import type { SupabaseClient } from '@supabase/supabase-js';
import { listTrash, getTrashed } from '@/lib/vault';

/** Supabase 'media' 저장소에 있는 파일이면 저장소 경로만 뽑는다 */
export function mediaPaths(urls: string[]) {
  return urls.map((u) => { const m = (u || '').match(/\/storage\/v1\/object\/public\/media\/(.+)$/); return m ? decodeURIComponent(m[1]) : null; }).filter(Boolean) as string[];
}
/** 글 한 건이 쓰는 파일 주소 전부(썸네일·사진·첨부·본문 이미지) */
export function postFileUrls(row: any): string[] {
  return Array.from(new Set([row?.thumbnail_url, ...(row?.images || []).map((i: any) => i.url), ...(row?.attachments || []).map((f: any) => f.url),
    ...[...String(row?.content_ko || '').matchAll(/src="([^"]+)"/g), ...String(row?.content_en || '').matchAll(/src="([^"]+)"/g)].map((m) => m[1])].filter(Boolean)));
}
/** 이 URL을 다른 곳에서도 쓰고 있으면 true — 공유 파일은 저장소에서 지우면 안 된다.
 *  게시글(excludePostId 제외)뿐 아니라 교수 사진·배너·고정 페이지 본문·메인 설정(히어로 포스터/영상)까지 본다(2026-10-13: 게시글만 보던 빈틈).
 *  extraUrls: 휴지통의 다른 글이 쓰는 주소처럼 DB 밖에 있는 참조. 조회가 실패하면 '쓰고 있다'로 간주해 지우지 않는다(복구 불가능한 쪽으로 틀리지 않게). */
export async function usedElsewhere(sb: SupabaseClient | any, url: string, excludePostId: number, extraUrls?: Set<string>): Promise<boolean> {
  if (extraUrls?.has(url)) return true;
  const safeUrl = url.replace(/[",]/g, ''); // or() 필터 구문을 깨는 문자는 실사용 URL에 없다
  const hit = ({ data, error }: { data: any; error: any }) => !!error || !!(data && data.length);
  const checks: Promise<boolean>[] = [
    sb.from('posts').select('id').neq('id', excludePostId).or(`thumbnail_url.eq."${safeUrl}",content_ko.ilike."%${safeUrl}%",content_en.ilike."%${safeUrl}%"`).limit(1).then(hit),
    sb.from('posts').select('id').neq('id', excludePostId).contains('images', [{ url }]).limit(1).then(hit),
    sb.from('posts').select('id').neq('id', excludePostId).contains('attachments', [{ url }]).limit(1).then(hit),
    sb.from('faculty').select('id').eq('photo_url', url).limit(1).then(hit),
    sb.from('banners').select('id').eq('image_url', url).limit(1).then(hit),
    sb.from('pages').select('slug').or(`content_ko.ilike."%${safeUrl}%",content_en.ilike."%${safeUrl}%"`).limit(1).then(hit),
    sb.from('site_settings').select('key').eq('key', 'home').or(`value->>hero_poster_url.eq."${safeUrl}",value->>hero_video_url.eq."${safeUrl}"`).limit(1).then(hit),
  ];
  return (await Promise.all(checks)).some(Boolean);
}
/** @deprecated usedElsewhere로 대체(이름만 호환) */
export const usedByOtherPost = (sb: SupabaseClient | any, url: string, excludeId: number) => usedElsewhere(sb, url, excludeId);

/** 주어진 파일 중 다른 곳에서 쓰지 않는 것만 저장소에서 지운다. 교수 사진·배너 이미지 삭제도 이 경로를 탄다(DB 행을 먼저 지운 뒤 호출할 것 — 자기 행이 '사용 중'으로 잡히지 않게). */
export async function removeUnusedMedia(sb: SupabaseClient | any, urls: string[], excludePostId = 0, extraUrls?: Set<string>): Promise<number> {
  const own: string[] = [];
  for (const u of Array.from(new Set(urls.filter(Boolean)))) if (!(await usedElsewhere(sb, u, excludePostId, extraUrls))) own.push(u);
  const paths = mediaPaths(own);
  if (paths.length) await sb.storage.from('media').remove(paths);
  return paths.length;
}
/** 글의 파일 중 다른 글·화면이 쓰지 않는 것만 저장소에서 지운다(휴지통 30일이 지났거나 영구 삭제할 때) */
export async function removeOwnMedia(sb: SupabaseClient | any, row: any, extraUrls?: Set<string>): Promise<number> {
  return removeUnusedMedia(sb, postFileUrls(row), Number(row?.id) || 0, extraUrls);
}
/** 휴지통 글마다 쓰는 파일 주소(id → 주소들). usedElsewhere는 살아 있는 행만 보므로, 영구 삭제 전에 '휴지통의 다른 글'이 같은 파일을 쓰는지는
 *  이 지도로 본다 — 같은 사진을 쓰는 두 글이 함께 휴지통에 있으면 먼저 지우는 쪽(자동 정리·수동 영구 삭제 모두)이 파일을 없애던 문제(2026-10-13).
 *  휴지통은 몇 건뿐이라 한 번 훑는 비용은 작다. 서비스 키 클라이언트(vault)로 호출할 것. 목록 조회가 실패하면 빈 지도(=지운다)가 아니라 던진다 → 호출자가 catch해 '지우지 않음'으로 처리 */
export async function trashFileUrls(sb: SupabaseClient): Promise<Map<number, string[]>> {
  const m = new Map<number, string[]>();
  for (const t of await listTrash(sb)) { const d = await getTrashed(sb, t.id); if (d?.row) m.set(t.id, postFileUrls(d.row)); }
  return m;
}
/** 위 지도에서 excludeId 글을 뺀 나머지 글들의 주소 집합 — removeOwnMedia의 extraUrls로 넘긴다 */
export const otherTrashUrls = (m: Map<number, string[]>, excludeId: number) =>
  new Set(Array.from(m).filter(([k]) => k !== excludeId).flatMap(([, u]) => u));
