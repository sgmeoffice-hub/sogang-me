import type { SupabaseClient } from '@supabase/supabase-js';

/** Supabase 'media' 저장소에 있는 파일이면 저장소 경로만 뽑는다 */
export function mediaPaths(urls: string[]) {
  return urls.map((u) => { const m = (u || '').match(/\/storage\/v1\/object\/public\/media\/(.+)$/); return m ? decodeURIComponent(m[1]) : null; }).filter(Boolean) as string[];
}
/** 글 한 건이 쓰는 파일 주소 전부(썸네일·사진·첨부·본문 이미지) */
export function postFileUrls(row: any): string[] {
  return Array.from(new Set([row?.thumbnail_url, ...(row?.images || []).map((i: any) => i.url), ...(row?.attachments || []).map((f: any) => f.url),
    ...[...String(row?.content_ko || '').matchAll(/src="([^"]+)"/g), ...String(row?.content_en || '').matchAll(/src="([^"]+)"/g)].map((m) => m[1])].filter(Boolean)));
}
/** 이 URL을 다른 게시글도 쓰고 있으면 true — 공유 파일은 저장소에서 지우면 안 된다. */
export async function usedByOtherPost(sb: SupabaseClient | any, url: string, excludeId: number): Promise<boolean> {
  const safeUrl = url.replace(/[",]/g, ''); // or() 필터 구문을 깨는 문자는 실사용 URL에 없다
  const { data: a } = await sb.from('posts').select('id').neq('id', excludeId)
    .or(`thumbnail_url.eq."${safeUrl}",content_ko.ilike."%${safeUrl}%",content_en.ilike."%${safeUrl}%"`).limit(1);
  if (a && a.length) return true;
  const { data: b } = await sb.from('posts').select('id').neq('id', excludeId).contains('images', [{ url }]).limit(1);
  if (b && b.length) return true;
  const { data: c } = await sb.from('posts').select('id').neq('id', excludeId).contains('attachments', [{ url }]).limit(1);
  return !!(c && c.length);
}
/** 글의 파일 중 다른 글이 쓰지 않는 것만 저장소에서 지운다(휴지통 30일이 지났거나 영구 삭제할 때) */
export async function removeOwnMedia(sb: SupabaseClient | any, row: any): Promise<number> {
  const own: string[] = [];
  for (const u of postFileUrls(row)) if (!(await usedByOtherPost(sb, u, row.id))) own.push(u);
  const paths = mediaPaths(own);
  if (paths.length) await sb.storage.from('media').remove(paths);
  return paths.length;
}
