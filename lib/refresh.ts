import { revalidatePath, revalidateTag } from 'next/cache';

/** 목록·예약 달력처럼 주소 조건(?page=, ?f=)을 읽어 요청마다 새로 그리는 페이지는 페이지 대신 DB 조회 결과를 캐시한다(lib/data.ts, 태그 'site').
 *  글·교수·예약 등을 저장했을 때는 페이지 캐시와 이 조회 캐시를 함께 비운다. */
export const SITE_TAG = 'site';
export function refreshSite() {
  revalidatePath('/', 'layout');
  revalidateTag(SITE_TAG);
}
