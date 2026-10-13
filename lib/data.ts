import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createPublicClient } from './supabase-server';
import type { Post } from '@/components/PostCard';
import { safeQuery } from './search';

/** 조회 오류는 삼키지 않고 던진다 — ISR 재생성이 실패해야 직전 정상 페이지가 유지된다.
 *  (조용히 빈 배열을 돌려주면 일시적 DB 장애 때 '빈 홈 화면'이 캐시로 굳는다) */
const safe = async <T,>(fn: () => Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> => {
  const { data, error } = await fn();
  if (error) { console.error(error.code, error.message); throw new Error(error.message); }
  return data ?? fallback;
};
/** 한 건 조회(.single()) 전용 — 행이 없을 때(PGRST116)만 null, 그 밖의 오류(DB 불통 등)는 던진다.
 *  예전엔 오류를 전부 null로 삼켜 DB가 잠깐 끊긴 사이 재생성된 글이 '404'로 1주일 캐시됐다(2026-10-13 점검). */
const one = async <T,>(what: string, fn: () => Promise<{ data: T | null; error: any }>): Promise<T | null> => {
  const { data, error } = await fn();
  if (error && error.code !== 'PGRST116') { console.error(what, error.code, error.message); throw new Error(error.message); }
  return data ?? null;
};
/** 게시글·교수 상세의 id 조각이 정규형 양의 정수인지 — '02420'·'2420.0'·'1e3' 같은 별칭 주소마다 ISR 항목이 따로 만들어지는 것을 막는다(2026-10-13 무료 한도).
 *  두 상세 페이지와 그 generateMetadata가 DB 조회 전에 쓴다. int4 serial이라 10자리면 충분. */
export const isCanonicalId = (s: string) => /^[1-9]\d{0,9}$/.test(s);
/** searchParams 값은 같은 키가 반복되면(?q=a&q=b) 배열로 오므로 첫 값만 문자열로 받는다(배열에 .trim()을 호출해 500이 나던 문제). 없으면 ''. */
export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

const homeBoards = ['notice', 'academic', 'research', 'award', 'alumni_news'] as const;
/** 히어로 '최신 소식' 위젯에서 제외하는 큐레이션 모음 게시판 (운영 중 archive 등 추가 가능) */
const heroNewsExclude = ['promo', 'videos'];

export async function getHomeData() {
  const sb = createPublicClient();
  // 게시판별로 따로 조회한다 — 합쳐서 최신순으로 자르면 글이 많은 게시판(공지)이 다른 줄(동문 소식)을 밀어낸다
  const [postsByBoard, gallery, banners, settings, promo, videos, latest] = await Promise.all([
    Promise.all(homeBoards.map((b) => safe<Post[]>(() => sb.from('posts').select('id,board,title_ko,title_en,excerpt_ko,excerpt_en,thumbnail_url,images,video_url,created_at,is_pinned')
      .eq('board', b).eq('published', true).eq('show_on_home', true)
      .order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(24) as any, []))),
    safe<Post[]>(() => sb.from('posts').select('id,board,title_ko,title_en,thumbnail_url,images,created_at').eq('board', 'gallery').eq('published', true).order('created_at', { ascending: false }).limit(8) as any, []),
    safe<any[]>(() => sb.from('banners').select('*').eq('visible', true).order('sort_order') as any, []),
    safe<any>(() => sb.from('site_settings').select('value').eq('key', 'home').maybeSingle() as any, null),
    safe<Post[]>(() => sb.from('posts').select('id,board,title_ko,title_en,excerpt_ko,excerpt_en,thumbnail_url,attachments,created_at').eq('board', 'promo').eq('published', true).order('sort_order').order('created_at', { ascending: false }).limit(2) as any, []),
    safe<Post[]>(() => sb.from('posts').select('id,board,title_ko,title_en,excerpt_ko,excerpt_en,thumbnail_url,video_url,category,category_en,sort_order,created_at').eq('board', 'videos').eq('published', true).order('sort_order').limit(4) as any, []),
    // 히어로 '최신 소식' 위젯(2026-09-22 학과장 요청) — 큐레이션 모음(promo·videos)을 뺀 전 게시판 최신 5건. 관리자 '메인 페이지에 노출'(show_on_home) 존중.
    // 고정글(is_pinned)은 일부러 우선 정렬하지 않는다(오래된 고정 공지 3건이 위젯을 영구 점유하면 '업데이트' 목적이 사라짐) — 칩 표시에만 쓴다.
    // id desc는 자정 시각만 있는 legacy 글 동률 tie-break (getAdjacent와 같은 규칙).
    safe<Post[]>(() => sb.from('posts').select('id,board,title_ko,title_en,created_at,is_pinned')
      .eq('published', true).eq('show_on_home', true).not('board', 'in', `(${heroNewsExclude.join(',')})`)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(5) as any, []), // 3→5건 (2026-09-25 책임자 요청)
  ]);
  const n = settings?.value?.news_count ?? 8;
  const groups: Record<string, Post[]> = Object.fromEntries(homeBoards.map((b, i) => [b, (postsByBoard[i] || []).slice(0, n)]));
  return { groups, gallery, banners, settings: settings?.value ?? {}, promo, videos, latest };
}

async function getPostsRaw(board: string, page = 1, per = 15, q = '') {
  const sb = createPublicClient();
  const qs = safeQuery(q);
  const match = qs ? `title_ko.ilike.%${qs}%,title_en.ilike.%${qs}%,content_ko.ilike.%${qs}%,content_en.ilike.%${qs}%,members.ilike.%${qs}%` : '';
  let query = sb.from('posts').select('id,board,title_ko,title_en,excerpt_ko,excerpt_en,thumbnail_url,images,created_at,is_pinned,view_count,author,attachments,video_url,term,members,advisor,category,category_en,sort_order', { count: 'exact' })
    .eq('board', board).eq('published', true);
  if (match) query = query.or(match);
  const from = (page - 1) * per;
  const { data, count, error } = await query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).range(from, from + per - 1);
  if (error) {
    if (error.code === 'PGRST103') {
      // 범위를 벗어난 페이지 번호 → 빈 목록. 총 건수는 따로 세어 돌려준다(0으로 주면 '총 0건'에 쪽 번호도 사라져 돌아갈 길이 없었음 — 목록 페이지가 마지막 쪽으로 보내 준다). 이 드문 오류 경로에서만 한 번 더 조회.
      let cq = sb.from('posts').select('id', { count: 'exact', head: true }).eq('board', board).eq('published', true);
      if (match) cq = cq.or(match);
      const { count: total, error: e2 } = await cq;
      if (e2) { console.error(e2.code, e2.message); throw new Error(e2.message); }
      return { posts: [] as Post[], total: total || 0 };
    }
    console.error(error.code, error.message); throw new Error(error.message);
  }
  return { posts: (data || []) as Post[], total: count || 0 };
}
/** 게시판 목록은 ?page=·?q= 때문에 요청마다 새로 그려지므로 조회 결과를 1시간 캐시한다(글 저장·삭제 시 태그 'posts'로 즉시 비움 — lib/refresh.ts).
 *  2026-09-25: 페이지·조회 캐시가 없어 방문마다 DB를 읽던 것이 Supabase 전송량(무료 5GB의 67%)의 주원인이었다.
 *  2026-10-13: 10분 → 1시간. 저장은 태그로 즉시 반영되므로 짧은 주기는 크롤러가 훑은 (게시판,쪽,검색어) 조합마다 10분꼴로 count:'exact' 재조회·데이터 캐시 재기록만 늘렸다(Vercel 무료 한도). 목록의 조회수만 최대 1시간 늦게 바뀐다. */
export const getPosts = unstable_cache(getPostsRaw, ['getPosts'], { revalidate: 3600, tags: ['site', 'posts'] });
/** 게시글 상세 — 보는 언어의 본문만 읽는다(두 언어 본문을 다 읽던 것의 약 절반, 2026-09-25 Supabase 전송량 절감).
 *  영문 페이지는 영문 본문이 비었을 때만 국문 본문을 한 번 더 읽는다(번역 없음 안내·국문 대체 표시용). */
const POST_COLS = 'id,board,title_ko,title_en,excerpt_ko,excerpt_en,thumbnail_url,images,attachments,created_at,is_pinned,view_count,author,video_url,term,members,advisor,category,category_en,sort_order,published';
// cache(): 같은 렌더링 안에서 페이지 메타데이터(검색 결과 제목)와 본문이 같은 글을 두 번 조회하지 않게
export const getPost = cache(async function getPost(id: number, locale: 'ko' | 'en' = 'ko') {
  if (!Number.isInteger(id) || id <= 0) return null; // NaN·소수 등은 DB에 묻지 않고 404 (예전엔 22P02 오류를 삼켜 우연히 404가 되던 것)
  const sb = createPublicClient();
  const lc = locale === 'en' ? 'en' : 'ko'; // 검증 전 로케일 조각(/x.y/…)이 컬럼명에 끼어 DB 오류→500이 나지 않게 컬럼명은 여기서 고정(2026-10-13)
  const data = await one<any>(`getPost ${id}`, () => sb.from('posts').select(`${POST_COLS},content_${lc}`).eq('id', id).eq('published', true).single() as any);
  if (data && locale === 'en' && !data.content_en) {
    const ko = await one<any>(`getPost ${id} content_ko`, () => sb.from('posts').select('content_ko').eq('id', id).single() as any);
    data.content_ko = ko?.content_ko ?? null;
  }
  return data as Post | null;
});
export async function getAdjacent(board: string, id: number, created: string) {
  const sb = createPublicClient();
  // created_at이 같은 글(자정 날짜만 있는 legacy 글 다수)은 id로 순서를 가른다 — 동률 글이 이전/다음에서 빠지지 않게
  const [prev, next] = await Promise.all([
    safe<any[]>(() => sb.from('posts').select('id,title_ko,title_en').eq('board', board).eq('published', true)
      .or(`created_at.lt."${created}",and(created_at.eq."${created}",id.lt.${id})`)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(1) as any, []),
    safe<any[]>(() => sb.from('posts').select('id,title_ko,title_en').eq('board', board).eq('published', true)
      .or(`created_at.gt."${created}",and(created_at.eq."${created}",id.gt.${id})`)
      .order('created_at', { ascending: true }).order('id', { ascending: true }).limit(1) as any, []),
  ]);
  return { prev: prev[0] || null, next: next[0] || null };
}
/** 교수 목록 조회 캐시 — 교수 저장 시 태그 'faculty'로 즉시 비운다(lib/refresh.ts).
 *  2026-10-13: 1시간 → 1일. unstable_cache의 revalidate가 페이지 revalidate보다 짧으면 페이지 주기까지 그 값으로 내려가(Next 내부), 하루·1주로 선언한 교수 상세·분야·URECA 페이지가 실제로는 매시간 재생성되고 있었다(Vercel 무료 한도). */
export const getFaculty = unstable_cache(getFacultyRaw, ['getFaculty'], { revalidate: 86400, tags: ['site', 'faculty'] });
async function getFacultyRaw(emeritus = false) {
  const sb = createPublicClient();
  let query = sb.from('faculty').select('*').eq('is_emeritus', emeritus).eq('published', true);
  // 석좌교수(field='chair')는 전임교수 목록에서 제외하고 전용 페이지에서만 노출한다.
  if (!emeritus) query = query.or('field.is.null,field.neq.chair');
  return safe<any[]>(() => query.order('sort_order') as any, []);
}
/** 석좌교수(Chair Professor) 목록 — field='chair'로 구분한다. */
export async function getChair() {
  const sb = createPublicClient();
  return safe<any[]>(() => sb.from('faculty').select('*').eq('field', 'chair').eq('published', true).order('sort_order') as any, []);
}
export const getFacultyOne = cache(async function getFacultyOne(id: number) {
  if (!Number.isInteger(id) || id <= 0) return null; // getPost와 같은 이유
  const sb = createPublicClient();
  return one<any>(`getFacultyOne ${id}`, () => sb.from('faculty').select('*').eq('id', id).single() as any);
});
export async function getPage(slug: string) {
  // maybeSingle(): 행이 없으면 {data:null,error:null} → 내장 본문으로 대체. 오류면 던진다(관리자가 고친 고정 페이지가 DB 장애 때 내장 원문으로 되돌아가 하루 캐시되지 않게)
  const sb = createPublicClient();
  return safe<any>(() => sb.from('pages').select('*').eq('slug', slug).maybeSingle() as any, null);
}
/** 예약 달력 조회 캐시 — 신청(/api/reservations)·관리자 처리 때 태그 'reservations'로 즉시 비우므로 시간 기준은 1일(2026-10-13, 1시간 → 1일: 봇이 훑은 (시설,연,월)마다 매시간 재조회되던 것) */
export const getReservations = unstable_cache(getReservationsRaw, ['getReservations'], { revalidate: 86400, tags: ['site', 'reservations'] });
async function getReservationsRaw(facility: string, year: number, month: number) {
  const sb = createPublicClient();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endD = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${endD}`;
  // 달력 표시에 필요한 컬럼만 — 연락처(contact)·소속(affiliation)은 개인정보라 공개 경로에서 조회하지 않는다 (schema_v8의 컬럼 grant와 세트)
  return safe<any[]>(() => sb.from('reservations').select('id,facility,date,start_time,end_time,user_name,purpose,status').eq('facility', facility).gte('date', start).lte('date', end).neq('status', 'rejected').order('date').order('start_time') as any, []);
}

/** 전임교수 중 연구실이 등록된 수 — '18개 연구실' 같은 문구를 DB와 연동하기 위해 사용합니다. */
export async function getLabCount() {
  const sb = createPublicClient();
  const { count, error } = await sb.from('faculty').select('id', { count: 'exact', head: true }).eq('is_emeritus', false).eq('published', true).not('lab_ko', 'is', null).or('field.is.null,field.neq.chair');
  if (error) { console.error(error.code, error.message); throw new Error(error.message); } // 0개로 굳히지 않는다(홈 '0개 연구실' 1시간 캐시 방지)
  return count ?? 0;
}
