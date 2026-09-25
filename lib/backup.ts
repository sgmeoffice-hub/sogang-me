import { gzipSync } from 'zlib';
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { r2Enabled, r2Put, r2List, r2Delete, r2Copy, mediaBucket } from './r2';

/**
 * 자동 백업(매일 04:00 KST, /api/cron/backup) — Cloudflare R2 비공개 버킷(R2_BACKUP_BUCKET)에 보관. 2026-09-25 책임자와 합의한 설계:
 *  db/daily/YYYY-MM-DD.json.gz   DB 표 8개 전체(압축 약 2MB). 내용이 전날과 같으면 새로 저장하지 않는다. 최근 30일 보관
 *  db/monthly/YYYY-MM.json.gz    매월 첫 백업. 12개월 보관
 *  files/media/…                 관리자가 올린 파일(Supabase 'media') — 새 파일만 추가
 *  files/r2/…                    옛 홈페이지 사진·첨부(R2 공개 버킷) — 서버 간 복사, 한 번에 일부씩 이어서
 * Supabase 전송량: DB 전체를 받아도 압축 전송 약 1.2MB → 매일 해도 월 36MB(무료 5GB의 0.7%).
 * 복원은 버튼으로 두지 않는다(실수 위험) — docs/HANDOFF.md의 복원 절차 참고.
 */
export const TABLES = ['posts', 'faculty', 'pages', 'reservations', 'banners', 'site_settings', 'ureca_applications', 'admins'] as const;
const DAILY_KEEP = 30;
const MONTHLY_KEEP = 12;

export type BackupStatus = {
  at: string; ok: boolean; error?: string; trigger?: string;
  key?: string; bytes?: number; unchanged?: boolean; counts?: Record<string, number>;
  mediaCopied?: number; legacyCopied?: number; legacyTotal?: number; legacyAfter?: string; legacyDone?: boolean; legacyFailed?: string[]; stage?: string; purged?: { trash: number; history: number };
  lastSuccessAt?: string; hash?: string;
};

/** 표별 기본 키 — 페이지를 나눠 읽을 때 순서가 흔들리지 않게 정렬 기준으로 쓴다 */
const PK: Record<string, string> = { pages: 'slug', site_settings: 'key', admins: 'email' };
async function dumpTable(sb: SupabaseClient, t: string) {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(t).select('*').order(PK[t] || 'id', { ascending: true }).range(from, from + 999);
    if (error) throw new Error(`${t}: ${error.message}`);
    rows.push(...(data || []));
    if ((data || []).length < 1000) return rows;
  }
}

async function readStatus(sb: SupabaseClient): Promise<BackupStatus | null> {
  const { data } = await sb.from('site_settings').select('value').eq('key', 'backup').maybeSingle();
  return (data?.value as BackupStatus) || null;
}
async function writeStatus(sb: SupabaseClient, s: BackupStatus) {
  await sb.from('site_settings').upsert({ key: 'backup', value: s }, { onConflict: 'key' });
}
export const getBackupStatus = readStatus;

/** Supabase 'media' 저장소 전체 경로 */
async function listMedia(sb: SupabaseClient, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  const { data } = await sb.storage.from('media').list(prefix, { limit: 1000 });
  for (const o of data || []) {
    const p = prefix ? `${prefix}/${o.name}` : o.name;
    if ((o as any).id) out.push(p); else out.push(...(await listMedia(sb, p)));
  }
  return out;
}

export async function runBackup(sb: SupabaseClient, trigger = 'cron', budgetMs = 200_000): Promise<BackupStatus> {
  const started = Date.now();
  const left = () => budgetMs - (Date.now() - started);
  // R2 설정 전에는 시도하지 않고 기록도 남기지 않는다(관리자 화면은 '설정 필요'로 안내)
  if (!r2Enabled()) return { at: new Date().toISOString(), ok: false, trigger, error: 'R2 환경변수가 아직 설정되지 않았습니다' };
  const prev = await readStatus(sb);
  const now = new Date(Date.now() + 9 * 3600e3);   // KST 날짜 기준
  const day = now.toISOString().slice(0, 10), month = day.slice(0, 7);
  const status: BackupStatus = { at: new Date().toISOString(), ok: false, trigger, stage: 'start', lastSuccessAt: prev?.lastSuccessAt, hash: prev?.hash, legacyAfter: prev?.legacyAfter, legacyDone: prev?.legacyDone, legacyTotal: prev?.legacyTotal, legacyFailed: prev?.legacyFailed };
  // 단계마다 기록 — 도중에 시간 제한으로 끊겨도 어디까지 됐는지 남는다
  const checkpoint = async (stage: string) => { status.stage = stage; await writeStatus(sb, status).catch(() => {}); };
  try {
    // 1) DB 전체 — 가장 중요하므로 먼저, 끝나면 바로 '성공'으로 기록
    const tables: Record<string, any[]> = {}; const counts: Record<string, number> = {};
    for (const t of TABLES) { tables[t] = await dumpTable(sb, t); counts[t] = tables[t].length; }
    const body = JSON.stringify({ site: 'me.sogang.ac.kr', createdAt: status.at, tables });
    const hash = createHash('sha256').update(JSON.stringify({ ...tables, site_settings: tables.site_settings.filter((r: any) => r.key !== 'backup') })).digest('hex');   // 백업 상태 행은 매번 바뀌므로 비교에서 뺀다
    const gz = gzipSync(body);
    const needMonthly = (await r2List(`db/monthly/${month}`)).length === 0;
    status.counts = counts; status.bytes = gz.length;
    if (hash === prev?.hash && !needMonthly) status.unchanged = true;   // 전날과 같으면 새로 저장하지 않는다(용량 절약)
    else {
      status.key = `db/daily/${day}.json.gz`;
      await r2Put(status.key, gz, 'application/gzip');
      if (needMonthly) await r2Put(`db/monthly/${month}.json.gz`, gz, 'application/gzip');
    }
    status.hash = hash; status.ok = true; status.lastSuccessAt = status.at;
    await checkpoint('db');

    // 2) 보관 기간 정리
    const daily = (await r2List('db/daily/')).sort((x, y) => y.key.localeCompare(x.key));
    for (const o of daily.slice(DAILY_KEEP)) await r2Delete(o.key);
    const months = (await r2List('db/monthly/')).sort((x, y) => y.key.localeCompare(x.key));
    for (const o of months.slice(MONTHLY_KEEP)) await r2Delete(o.key);

    // 3) 관리자가 올린 파일 — 백업에 없는 것만 추가(지워진 파일도 백업에는 남겨 둔다)
    const have = new Set((await r2List('files/media/')).map((o) => o.key));
    let mediaCopied = 0;
    for (const p of await listMedia(sb)) {
      if (left() < 30_000) break;
      const key = `files/media/${p}`; if (have.has(key)) continue;
      const { data } = await sb.storage.from('media').download(p);
      if (!data) continue;
      await r2Put(key, new Uint8Array(await data.arrayBuffer()), data.type || 'application/octet-stream'); mediaCopied++;
    }
    status.mediaCopied = mediaCopied;
    await checkpoint('media');

    // 4) 옛 홈페이지 파일(R2 공개 버킷) — 서버 간 복사. 키 순서대로 1,000개씩 읽어 복사하고 마지막 키(legacyAfter)를 기록해 다음 실행에서 이어 간다
    if (!status.legacyDone) {
      try {
        let copied = 0;
        while (left() > 60_000) {   // 복사 한 건이 최대 150초 걸릴 수 있어 여유를 두고 시작(함수 제한 300초)
          const batch = await r2List('', mediaBucket(), 1000, status.legacyAfter || '');
          if (!batch.length) { status.legacyDone = true; break; }
          for (let i = 0; i < batch.length && left() > 60_000; i += 8) {
            const chunk = batch.slice(i, i + 8);
            // 한 파일이 실패해도 전체가 멈추지 않게: 실패한 파일은 기록만 하고 넘어간다(다음에 legacyFailed로 재시도 가능)
            const res = await Promise.allSettled(chunk.map((o) => r2Copy(mediaBucket(), o.key, `files/r2/${o.key}`)));
            res.forEach((r, k) => { if (r.status === 'rejected') status.legacyFailed = [...(status.legacyFailed || []), chunk[k].key].slice(-200); else copied++; });
            status.legacyAfter = chunk[chunk.length - 1].key;
          }
          status.legacyCopied = copied; status.legacyTotal = (prev?.legacyTotal || 0) + copied;
          await checkpoint('legacy');
          if (batch.length < 1000 && status.legacyAfter === batch[batch.length - 1].key) { status.legacyDone = true; break; }
        }
      } catch (e: any) { status.error = `옛 파일 사본: ${e?.message || e}`; }
    }
    // 모두 훑은 뒤에는 실패했던 파일만 다시 시도
    if (status.legacyDone && status.legacyFailed?.length && left() > 30_000) {
      const retry = status.legacyFailed; status.legacyFailed = [];
      for (const k of retry) {
        if (left() < 20_000) { status.legacyFailed.push(k); continue; }
        try { await r2Copy(mediaBucket(), k, `files/r2/${k}`); status.legacyTotal = (status.legacyTotal || 0) + 1; } catch { status.legacyFailed.push(k); }
      }
    }
    status.stage = 'done';
  } catch (e: any) {
    status.error = e?.message || String(e);
    if (!status.lastSuccessAt || status.lastSuccessAt !== status.at) status.ok = false;
  }
  await writeStatus(sb, status);
  return status;
}

/** 백업 목록(관리자 화면) */
export async function listBackups() {
  if (!r2Enabled()) return { daily: [], monthly: [] };
  const [daily, monthly] = await Promise.all([r2List('db/daily/'), r2List('db/monthly/')]);
  const desc = (a: { key: string }, b: { key: string }) => b.key.localeCompare(a.key);
  return { daily: daily.sort(desc), monthly: monthly.sort(desc) };
}
