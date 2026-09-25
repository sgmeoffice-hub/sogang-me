import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** 휴지통·수정 이력 — Supabase 비공개 저장소 'vault'(관리자 서버 코드만 서비스 키로 접근, 사이트에는 노출 안 됨).
 *  R2 설정과 무관하게 항상 동작한다. 2026-09-25 책임자 요청(백업 설계).
 *   trash/posts/<id>.json            삭제한 글(행 전체 + 삭제 시각). 첨부파일은 30일 동안 지우지 않고 남겨 둔다.
 *   history/posts/<id>/<시각>.json    글을 저장할 때마다 직전 내용. 글마다 최근 20개·90일 보관. */
export const TRASH_DAYS = 30;
export const HISTORY_DAYS = 90;
const HISTORY_MAX = 20;
const BUCKET = 'vault';

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function putJson(sb: SupabaseClient, path: string, data: unknown) {
  const body = new Blob([JSON.stringify(data)], { type: 'application/json' });
  let { error } = await sb.storage.from(BUCKET).upload(path, body, { upsert: true, contentType: 'application/json' });
  if (error && /not found/i.test(error.message)) {   // 저장소가 없으면 만들고 다시 시도
    await sb.storage.createBucket(BUCKET, { public: false });
    ({ error } = await sb.storage.from(BUCKET).upload(path, body, { upsert: true, contentType: 'application/json' }));
  }
  if (error) throw new Error(`보관 실패: ${error.message}`);
}
async function getJson<T = any>(sb: SupabaseClient, path: string): Promise<T | null> {
  const { data, error } = await sb.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return JSON.parse(await data.text());
}
async function list(sb: SupabaseClient, prefix: string) {
  const { data } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'desc' } });
  return (data || []).filter((o: any) => o.id);   // 폴더 제외
}

/* ── 휴지통 ── */
export type TrashItem = { id: number; board: string; title: string; deletedAt: string; by?: string };
export async function trashPost(sb: SupabaseClient, row: any, by?: string) {
  await putJson(sb, `trash/posts/${row.id}.json`, { deletedAt: new Date().toISOString(), by, row });
}
export async function listTrash(sb: SupabaseClient): Promise<TrashItem[]> {
  const files = await list(sb, 'trash/posts');
  const items = await Promise.all(files.map(async (f: any) => {
    const d = await getJson(sb, `trash/posts/${f.name}`);
    return d ? { id: d.row.id, board: d.row.board, title: d.row.title_ko, deletedAt: d.deletedAt, by: d.by } : null;
  }));
  return (items.filter(Boolean) as TrashItem[]).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}
export async function getTrashed(sb: SupabaseClient, id: number) { return getJson(sb, `trash/posts/${id}.json`); }
export async function removeTrashed(sb: SupabaseClient, id: number) { await sb.storage.from(BUCKET).remove([`trash/posts/${id}.json`]); }

/* ── 수정 이력 ── */
export type Version = { name: string; savedAt: string; by?: string; title: string };
export async function saveVersion(sb: SupabaseClient, row: any, by?: string) {
  const at = new Date().toISOString();
  await putJson(sb, `history/posts/${row.id}/${at.replace(/[:.]/g, '-')}.json`, { savedAt: at, by, row });
  const files = await list(sb, `history/posts/${row.id}`);
  const old = files.slice(HISTORY_MAX).map((f: any) => `history/posts/${row.id}/${f.name}`);   // 최신순 → 20개 넘는 것 정리
  if (old.length) await sb.storage.from(BUCKET).remove(old);
}
export async function listVersions(sb: SupabaseClient, id: number): Promise<Version[]> {
  const files = await list(sb, `history/posts/${id}`);
  const out = await Promise.all(files.map(async (f: any) => {
    const d = await getJson(sb, `history/posts/${id}/${f.name}`);
    return d ? { name: f.name, savedAt: d.savedAt, by: d.by, title: d.row?.title_ko || '' } : null;
  }));
  return out.filter(Boolean) as Version[];
}
export async function getVersion(sb: SupabaseClient, id: number, name: string) {
  if (!/^[\w-]+\.json$/.test(name)) return null;
  return getJson(sb, `history/posts/${id}/${name}`);
}

/** 기간이 지난 휴지통 글(첨부파일 포함)과 오래된 수정 이력을 정리한다 — 매일 백업 작업에서 호출 */
export async function purgeVault(sb: SupabaseClient, removeFiles: (row: any) => Promise<number>) {
  const now = Date.now(); let trash = 0, history = 0;
  for (const f of await list(sb, 'trash/posts')) {
    const d = await getJson(sb, `trash/posts/${f.name}`);
    if (d && now - Date.parse(d.deletedAt) > TRASH_DAYS * 86400e3) {
      await removeFiles(d.row);   // 다른 글이 같은 파일을 쓰면 남긴다(호출자 책임)
      await sb.storage.from(BUCKET).remove([`trash/posts/${f.name}`]); trash++;
    }
  }
  const { data: dirs } = await sb.storage.from(BUCKET).list('history/posts', { limit: 10000 });
  for (const dir of dirs || []) {
    if ((dir as any).id) continue;
    const files = await list(sb, `history/posts/${dir.name}`);
    const old = files.filter((f: any) => now - Date.parse(f.created_at || f.updated_at || 0) > HISTORY_DAYS * 86400e3).map((f: any) => `history/posts/${dir.name}/${f.name}`);
    if (old.length) { await sb.storage.from(BUCKET).remove(old); history += old.length; }
  }
  return { trash, history };
}
