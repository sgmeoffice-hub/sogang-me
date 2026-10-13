import { revalidatePath, revalidateTag } from 'next/cache';

/** 캐시 갱신 — 저장한 것과 관련된 페이지·조회 캐시만 비운다 (2026-10-13 Vercel 무료 한도 대비).
 *  예전에는 저장·승인·cron마다 refreshSite()로 사이트 전체(사이트맵 기준 약 4,800쪽)를 무효화해, 크롤러가 다시 훑을 때마다
 *  함수 호출·재생성 CPU·ISR 쓰기가 하루치 Hobby 한도를 넘겼다(docs/HANDOFF.md). 이제 전체 비우기는 /api/admin/revalidate(수동)만 쓴다.
 *  태그: 'site'는 모든 조회 캐시에 그대로 남겨 두고(수동 전체 비우기용), 'posts'·'faculty'·'reservations'를 각각 더 붙인다(lib/data.ts, lib/names.ts).
 *  목록·예약 달력처럼 주소 조건(?page=, ?f=)을 읽어 요청마다 새로 그리는 페이지는 페이지 대신 조회 캐시(태그)만 비우면 된다.
 *  두 로케일(/ko·/en)은 항상 함께 비운다. 빠뜨린 페이지가 있어도 각 페이지의 시간 기준 갱신(최대 1주) 안에는 따라오고, 급하면 수동 전체 비우기가 있다. */
export const SITE_TAG = 'site';
const LOCALES = ['ko', 'en'] as const;
const paths = (...ps: string[]) => { for (const p of ps) for (const l of LOCALES) revalidatePath(`/${l}${p}`); };

/** 사이트 전체(페이지·데이터) — /api/admin/revalidate 전용. 저장 동작에서는 쓰지 않는다. */
export function refreshSite() {
  revalidatePath('/', 'layout');
  revalidateTag(SITE_TAG);
}

/** 홈(/ko, /en) — 배너·메인 설정·메인 노출 글이 바뀌었을 때. 홈 조회(getHomeData)는 태그 캐시가 아니라 페이지 캐시(1시간)만 있다. */
export function refreshHome() { paths(''); }

/** 게시글 한 건: 상세(두 로케일) + 목록 조회 캐시('posts') + 홈.
 *  neighbours: 이전/다음 글 — 상세 페이지에 이웃 글 제목·링크가 1주 동안 구워져 있으므로 글을 만들거나 지우거나 제목·날짜를 바꾸면 함께 비운다(호출하는 쪽이 계산).
 *  structural: 글이 생기거나 없어지거나(삭제·복구·공개 여부·게시판·작성일 변경) 사이트맵이 달라지는 경우. */
export function refreshPost(o: { board: string; id: number; neighbours?: { board: string; id: number }[]; structural?: boolean }) {
  revalidateTag('posts');
  const seen = new Set<string>();
  for (const p of [{ board: o.board, id: o.id }, ...(o.neighbours || [])]) { const k = `/board/${p.board}/${p.id}`; if (!seen.has(k)) { seen.add(k); paths(k); } }
  paths('');
  if (o.structural) revalidatePath('/sitemap.xml');
}

/** 게시글 상세 경로 전체(두 로케일, 경로 패턴으로 한 번에) + 목록 캐시 — 교수 공식 영문 표기 변경으로 글 수십 건 이상의 영문을 한꺼번에 고친 때처럼
 *  글 하나하나 비우는 것이 더 비쌀 때만. 전체 비우기(refreshSite)와 달리 고정 페이지·교수·예약은 건드리지 않는다. */
export function refreshAllPosts() { revalidateTag('posts'); revalidatePath('/[locale]/board/[board]/[id]', 'page'); paths(''); }

/** 교수 저장·삭제: 교수 조회 캐시('faculty' — getFaculty·facultyNames) + 교수진 목록·상세와 교수 표를 그리는 고정 페이지(기초전공분야·연구그룹·URECA) + 홈(연구실 수). */
export function refreshFaculty(id?: number) {
  revalidateTag('faculty');
  paths('/faculty', '/faculty/emeritus', '/faculty/chair', '/graduate/areas', '/graduate/groups', '/undergraduate/ureca', '');
  if (id) paths(`/faculty/${id}`);
  revalidatePath('/sitemap.xml');   // 교수 상세 주소 목록(드문 동작이라 항상)
}

/** 예약 승인·등록·수정: 예약 조회 캐시('reservations')만으로 충분하지만(달력 페이지는 ?f=·y=·m= 때문에 매 요청 렌더링), /api/reservations와 같은 모양으로 경로도 함께 비운다. */
export function refreshReservations() { revalidateTag('reservations'); paths('/reservation'); }

/** 관리자 '페이지' 저장·되돌리기: pages 행의 slug가 곧 공개 주소('about/intro' → /ko/about/intro, /en/about/intro). getPage는 캐시가 없으므로 페이지만 비운다. */
export function refreshStaticPage(slug: string) { paths(`/${slug}`); }
