import { createPublicClient } from './supabase-server';
import type { Post } from '@/components/PostCard';
import { safeQuery } from './search';

/** 조회 오류는 삼키지 않고 던진다 — ISR 재생성이 실패해야 직전 정상 페이지가 유지된다.
 *  (조용히 빈 배열을 돌려주면 일시적 DB 장애 때 '빈 홈 화면'이 캐시로 굳는다) */
const safe = async <T,>(fn: () => Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> => {
  const { data, error } = await fn();
  if (error) { console.error(error.message); throw new Error(error.message); }
  return data ?? fallback;
};

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
    // 히어로 '최신 소식' 위젯(2026-09-22 학과장 요청) — 큐레이션 모음(promo·videos)을 뺀 전 게시판 최신 3건. 관리자 '메인 페이지에 노출'(show_on_home) 존중.
    // 고정글(is_pinned)은 일부러 우선 정렬하지 않는다(오래된 고정 공지 3건이 위젯을 영구 점유하면 '업데이트' 목적이 사라짐) — 칩 표시에만 쓴다.
    // id desc는 자정 시각만 있는 legacy 글 동률 tie-break (getAdjacent와 같은 규칙).
    safe<Post[]>(() => sb.from('posts').select('id,board,title_ko,title_en,created_at,is_pinned')
      .eq('published', true).eq('show_on_home', true).not('board', 'in', `(${heroNewsExclude.join(',')})`)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(3) as any, []),
  ]);
  const n = settings?.value?.news_count ?? 8;
  const groups: Record<string, Post[]> = Object.fromEntries(homeBoards.map((b, i) => [b, (postsByBoard[i] || []).slice(0, n)]));
  return { groups, gallery, banners, settings: settings?.value ?? {}, promo, videos, latest };
}

export async function getPosts(board: string, page = 1, per = 15, q = '') {
  const sb = createPublicClient();
  let query = sb.from('posts').select('id,board,title_ko,title_en,excerpt_ko,excerpt_en,thumbnail_url,images,created_at,is_pinned,view_count,author,attachments,video_url,term,members,advisor,category,category_en,sort_order', { count: 'exact' })
    .eq('board', board).eq('published', true);
  const qs = safeQuery(q);
  if (qs) query = query.or(`title_ko.ilike.%${qs}%,title_en.ilike.%${qs}%,content_ko.ilike.%${qs}%,content_en.ilike.%${qs}%,members.ilike.%${qs}%`);
  const from = (page - 1) * per;
  const { data, count, error } = await query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).range(from, from + per - 1);
  if (error) {
    if (error.code === 'PGRST103') return { posts: [] as Post[], total: 0 }; // 범위를 벗어난 페이지 번호 → 빈 목록
    console.error(error.message); throw new Error(error.message);
  }
  return { posts: (data || []) as Post[], total: count || 0 };
}
export async function getPost(id: number) {
  const sb = createPublicClient();
  const { data } = await sb.from('posts').select('*').eq('id', id).eq('published', true).single();
  return data as Post | null;
}
export async function getAdjacent(board: string, id: number, created: string) {
  const sb = createPublicClient();
  // created_at이 같은 글(자정 날짜만 있는 legacy 글 다수)은 id로 순서를 가른다 — 동률 글이 이전/다음에서 빠지지 않게
  const [{ data: prev }, { data: next }] = await Promise.all([
    sb.from('posts').select('id,title_ko,title_en').eq('board', board).eq('published', true)
      .or(`created_at.lt."${created}",and(created_at.eq."${created}",id.lt.${id})`)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(1),
    sb.from('posts').select('id,title_ko,title_en').eq('board', board).eq('published', true)
      .or(`created_at.gt."${created}",and(created_at.eq."${created}",id.gt.${id})`)
      .order('created_at', { ascending: true }).order('id', { ascending: true }).limit(1),
  ]);
  return { prev: prev?.[0] || null, next: next?.[0] || null };
}
export async function getFaculty(emeritus = false) {
  const sb = createPublicClient();
  let query = sb.from('faculty').select('*').eq('is_emeritus', emeritus).eq('published', true);
  // 석좌교수(field='chair')는 전임교수 목록에서 제외하고 전용 페이지에서만 노출한다.
  if (!emeritus) query = query.or('field.is.null,field.neq.chair');
  const { data } = await query.order('sort_order');
  return data || [];
}
/** 석좌교수(Chair Professor) 목록 — field='chair'로 구분한다. */
export async function getChair() {
  const sb = createPublicClient();
  const { data } = await sb.from('faculty').select('*').eq('field', 'chair').eq('published', true).order('sort_order');
  return data || [];
}
export async function getFacultyOne(id: number) {
  const sb = createPublicClient(); const { data } = await sb.from('faculty').select('*').eq('id', id).single(); return data;
}
export async function getPage(slug: string) {
  const sb = createPublicClient(); const { data } = await sb.from('pages').select('*').eq('slug', slug).maybeSingle(); return data;
}
export async function getReservations(facility: string, year: number, month: number) {
  const sb = createPublicClient();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endD = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${endD}`;
  // 달력 표시에 필요한 컬럼만 — 연락처(contact)·소속(affiliation)은 개인정보라 공개 경로에서 조회하지 않는다 (schema_v8의 컬럼 grant와 세트)
  const { data } = await sb.from('reservations').select('id,facility,date,start_time,end_time,user_name,purpose,status').eq('facility', facility).gte('date', start).lte('date', end).neq('status', 'rejected').order('date').order('start_time');
  return data || [];
}

/** 전임교수 중 연구실이 등록된 수 — '18개 연구실' 같은 문구를 DB와 연동하기 위해 사용합니다. */
export async function getLabCount() {
  const sb = createPublicClient();
  const { count } = await sb.from('faculty').select('id', { count: 'exact', head: true }).eq('is_emeritus', false).eq('published', true).not('lab_ko', 'is', null).or('field.is.null,field.neq.chair');
  return count || 0;
}
