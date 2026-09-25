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
  mediaCopied?: number; legacyCopied?: number; legacyRemaining?: number | null; purged?: { trash: number; history: number };
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

export async function runBackup(sb: SupabaseClient, trigger = 'cron', budgetMs = 240_000): Promise<BackupStatus> {
  const started = Date.now();
  // R2 설정 전에는 시도하지 않고 기록도 남기지 않는다(관리자 화면은 '설정 필요'로 안내)
  if (!r2Enabled()) return { at: new Date().toISOString(), ok: false, trigger, error: 'R2 환경변수가 아직 설정되지 않았습니다' };
  const prev = await readStatus(sb);
  const now = new Date(Date.now() + 9 * 3600e3);   // KST 날짜 기준
  const day = now.toISOString().slice(0, 10), month = day.slice(0, 7);
  const status: BackupStatus = { at: new Date().toISOString(), ok: false, trigger, lastSuccessAt: prev?.lastSuccessAt, hash: prev?.hash };
  try {

    // 1) DB 전체
    const tables: Record<string, any[]> = {}; const counts: Record<string, number> = {};
    for (const t of TABLES) { tables[t] = await dumpTable(sb, t); counts[t] = tables[t].length; }
    const body = JSON.stringify({ site: 'me.sogang.ac.kr', createdAt: status.at, tables });
    const hash = createHash('sha256').update(JSON.stringify({ ...tables, site_settings: tables.site_settings.filter((r: any) => r.key !== 'backup') })).digest('hex');   // 백업 상태 행은 매번 바뀌므로 비교에서 뺀다
    const gz = gzipSync(body);
    const monthly = await r2List(`db/monthly/${month}`);
    const needMonthly = monthly.length === 0;
    status.counts = counts; status.bytes = gz.length; status.hash = hash;
    if (hash === prev?.hash && !needMonthly) {
      status.unchanged = true;   // 전날과 같으면 새로 저장하지 않는다(용량 절약)
    } else {
      status.key = `db/daily/${day}.json.gz`;
      await r2Put(status.key, gz, 'application/gzip');
      if (needMonthly) await r2Put(`db/monthly/${month}.json.gz`, gz, 'application/gzip');
    }

    // 2) 보관 기간 정리
    const daily = (await r2List('db/daily/')).sort((a, b) => b.key.localeCompare(a.key));
    for (const o of daily.slice(DAILY_KEEP)) await r2Delete(o.key);
    const months = (await r2List('db/monthly/')).sort((a, b) => b.key.localeCompare(a.key));
    for (const o of months.slice(MONTHLY_KEEP)) await r2Delete(o.key);

    // 3) 관리자가 올린 파일 — 백업에 없는 것만 추가(지워진 파일도 백업에는 남겨 둔다)
    const have = new Set((await r2List('files/media/')).map((o) => o.key));
    let mediaCopied = 0;
    for (const p of await listMedia(sb)) {
      if (Date.now() - started > budgetMs) break;
      const key = `files/media/${p}`; if (have.has(key)) continue;
      const { data } = await sb.storage.from('media').download(p);
      if (!data) continue;
      await r2Put(key, new Uint8Array(await data.arrayBuffer()), data.type || 'application/octet-stream'); mediaCopied++;
    }
    status.mediaCopied = mediaCopied;

    // 4) 옛 홈페이지 파일(R2 공개 버킷) — 서버 간 복사, 남은 시간만큼 이어서. 토큰에 공개 버킷 읽기 권한이 없으면 건너뛴다
    try {
      if (Date.now() - started < budgetMs) {
        const src = await r2List('', mediaBucket());
        const done = new Set((await r2List('files/r2/')).map((o) => o.key.slice('files/r2/'.length)));
        const todo = src.filter((o) => !done.has(o.key));
        let n = 0, i = 0;   // 8개씩 동시에 서버 간 복사
        await Promise.all(Array.from({ length: 8 }, async () => {
          while (i < todo.length && Date.now() - started < budgetMs) { const o = todo[i++]; await r2Copy(mediaBucket(), o.key, `files/r2/${o.key}`); n++; }
        }));
        status.legacyCopied = n; status.legacyRemaining = todo.length - n;
      }
    } catch (e: any) { status.legacyRemaining = null; status.error = `옛 파일 복사 건너뜀: ${e?.message || e}`; }

    status.ok = true; status.lastSuccessAt = status.at;
  } catch (e: any) {
    status.ok = false; status.error = e?.message || String(e);
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
