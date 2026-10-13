'use server';
import { syncFacultyNameInPosts } from '@/lib/names-sync';
import { clearFacultyNamesCache } from '@/lib/names';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { translateKoToEn, translateLongContent } from '@/lib/translate';
import { toHtml } from '@/lib/html';
import { plainExcerpt } from '@/lib/seo';
import { staticPages } from '@/content';
import { researchGroupDefs } from '@/lib/groups';
import { buildingOf } from '@/lib/buildings';
import { facilities } from '@/lib/nav';
import { isHalfHour, isDateStr, repeatDates, REPEAT_MAX, type Repeat } from '@/lib/reservation';
import { refreshPost, refreshAllPosts, refreshFaculty, refreshStaticPage, refreshReservations, refreshHome } from '@/lib/refresh';
import { removeOwnMedia, removeUnusedMedia, trashFileUrls, otherTrashUrls } from '@/lib/media';
import { serviceClient, trashPost, getTrashed, removeTrashed, saveVersion, getVersion } from '@/lib/vault';
import { runBackup, getBackupStatus } from '@/lib/backup';

import { adminBase as base } from '@/lib/admin';

async function admin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('unauthorized');
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) throw new Error('forbidden');
  return sb;
}
async function who(sb: any) { const { data: { user } } = await sb.auth.getUser(); return user?.email || undefined; }
const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';
const str = (fd: FormData, k: string) => (fd.get(k) as string | null)?.toString() ?? '';
const nul = (s: string) => (s.trim() ? s : null);
/** 정수 칸: 비었거나 숫자가 아니면 기본값(Number('abc')=NaN이 null로 저장되던 문제), 소수는 버림(정수 컬럼 오류 방지) */
const int = (fd: FormData, k: string, d: number) => { const s = str(fd, k).trim(); const n = Number(s); return s && Number.isFinite(n) ? Math.trunc(n) : d; };
/** 자동 요약: 태그를 벗기고 HTML 엔티티(&amp;·&nbsp; 등)도 풀어 쓴다 — 카드에 'R&amp;D'가 그대로 보이던 문제(2026-10-13). 검색 설명(lib/seo.ts)과 같은 규칙 */
const strip = (html: string) => plainExcerpt(html, 180);
/** 안내문을 쿼리(?note=)로 들고 돌아간다 — 서버 액션에서 throw하면 운영 환경에서는 메시지가 가려진 오류 화면만 남는다(2026-10-13) */
const note = (path: string, msg: string) => `${path}${path.includes('?') ? '&' : '?'}note=${encodeURIComponent(msg)}`;
const TRANSLATE_FAILED = '영문 자동 번역에 실패해 국문만 저장했습니다. 영문이 빈 글은 자동 재시도(매일 새벽·관리자 접속 시)가 채우고, 기존 영문이 남아 있는 글은 나중에 다시 저장해 주세요.';

/** 이전/다음 글(lib/data.ts getAdjacent와 같은 정렬: created_at, 동률은 id). 상세 페이지에 이웃 글의 제목·링크가 1주 동안 구워져 있으므로
 *  글을 만들거나 지우거나 자리를 옮기면 이웃 글 페이지도 함께 비워야 한다(lib/refresh.ts refreshPost). */
async function adjacentOf(sb: any, board: string | null | undefined, id: number, created: string | null | undefined): Promise<{ board: string; id: number }[]> {
  if (!board || !created || !id) return [];
  const [{ data: prev }, { data: next }] = await Promise.all([
    sb.from('posts').select('id').eq('board', board).eq('published', true)
      .or(`created_at.lt."${created}",and(created_at.eq."${created}",id.lt.${id})`)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(1),
    sb.from('posts').select('id').eq('board', board).eq('published', true)
      .or(`created_at.gt."${created}",and(created_at.eq."${created}",id.gt.${id})`)
      .order('created_at', { ascending: true }).order('id', { ascending: true }).limit(1),
  ]);
  return [...(prev || []), ...(next || [])].map((p: any) => ({ board, id: p.id }));
}

export async function signOut() {
  const sb = await createClient(); await sb.auth.signOut(); redirect(base());
}

/** 작성일 관례: created_at은 'KST 시각을 +00으로' 저장한다 (legacy 이관분과 동일 — 표시도 UTC 기준).
 *  신규 글에 날짜만 오면 현재 KST 시각을, 백데이트면 09:00을 붙여 자정 동률·정렬 뒤틀림을 막는다. */
const kstNowIso = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString();

export async function savePost(fd: FormData) {
  const sb = await admin();
  const id = str(fd, 'id');
  const row: any = {
    board: str(fd, 'board'), title_ko: str(fd, 'title_ko'), title_en: nul(str(fd, 'title_en')),
    content_ko: toHtml(str(fd, 'content_ko')), content_en: nul(toHtml(str(fd, 'content_en'))),
    video_url: nul(str(fd, 'video_url')), term: nul(str(fd, 'term')), members: nul(str(fd, 'members')), advisor: nul(str(fd, 'advisor')), category: nul(str(fd, 'category')), sort_order: int(fd, 'sort_order', 100),
    excerpt_ko: nul(str(fd, 'excerpt_ko')) || strip(str(fd, 'content_ko')),
    thumbnail_url: nul(str(fd, 'thumbnail_url')), author: str(fd, 'author') || '기계공학과',
    is_pinned: bool(fd, 'is_pinned'), show_on_home: bool(fd, 'show_on_home'), published: bool(fd, 'published'),
    images: JSON.parse(str(fd, 'images') || '[]'), attachments: JSON.parse(str(fd, 'attachments') || '[]'),
    updated_at: new Date().toISOString(),
  };
  if (!row.title_ko.trim()) throw new Error('제목을 입력해 주세요.');
  const list = `${base()}/posts?board=${row.board}`;

  // 수정이면 저장 직전 행 전체 — 번역 비교(prev)와 수정 이력 보관에 함께 쓴다
  let prev: any = null;
  if (id) {
    const { data } = await sb.from('posts').select('*').eq('id', Number(id)).single(); prev = data;
    // 다른 탭에서 이미 삭제(휴지통)된 글: 0건 수정이 '성공'으로 끝나 입력이 사라지던 문제 — 저장하지 않고 알린다(되살리면 restorePost의 중복 검사와 충돌)
    if (!prev) redirect(note(list, `#${id} 글이 이미 삭제되어 저장하지 못했습니다.`));
    // 수정 이력: 저장 직전 내용을 보관(글마다 최근 20개·90일). 보관이 실패해도 저장은 막지 않는다
    // — 서비스 키가 없는 환경(미리보기 배포)에서는 serviceClient()가 동기적으로 던지므로 .catch가 아니라 try로 감싼다
    try { await saveVersion(serviceClient(), prev, await who(sb)); } catch (e: any) { console.error('history', e?.message); }
  }

  /* 썸네일 자동 채움 (2026-09-17): 썸네일 칸을 따로 올리지 않고 본문에만 사진을 넣은 글의 카드가 기본 표지로 나오던 문제.
   *  - 썸네일이 비어 있으면 본문(국문→영문) 첫 사진을 쓴다.
   *  - 이전에 자동으로 채운 썸네일(=이전 본문에 있던 사진)이 새 본문에서 사라졌으면 새 본문 첫 사진으로 바꾼다(없으면 비움).
   *  - 관리자가 썸네일을 직접 올린 경우(본문에 없는 URL)는 건드리지 않는다. */
  const firstImg = (html: string | null | undefined) => (String(html || '').match(/<img[^>]+src="([^"]+)"/i) || [])[1] || null;
  const bodyImg = firstImg(row.content_ko) || firstImg(row.content_en);
  const inBody = (u: string | null) => !!u && (String(row.content_ko || '').includes(u) || String(row.content_en || '').includes(u));
  const wasAuto = !!prev?.thumbnail_url && row.thumbnail_url === prev.thumbnail_url && (String(prev.content_ko || '').includes(prev.thumbnail_url) || String(prev.content_en || '').includes(prev.thumbnail_url));
  if (!row.thumbnail_url || (wasAuto && !inBody(row.thumbnail_url))) row.thumbnail_url = bodyImg;
  // excerpt_en·category_en은 폼에 입력칸이 없으므로 기존 값을 보존한다 (폼에 있으면 그 값 사용)
  row.excerpt_en = fd.has('excerpt_en') ? nul(str(fd, 'excerpt_en')) : (prev?.excerpt_en ?? null);
  row.category_en = fd.has('category_en') ? nul(str(fd, 'category_en')) : (prev?.category_en ?? null);
  // 작성일: 날짜가 실제로 바뀌었을 때만 갱신 — 편집만 해도 시각이 자정으로 잘려 정렬·이전/다음이 뒤틀리는 것 방지
  const created = str(fd, 'created_at');
  const kstToday = kstNowIso().slice(0, 10);
  if (created && created !== (prev?.created_at || '').slice(0, 10)) {
    row.created_at = created === kstToday ? kstNowIso() : `${created}T09:00:00+00:00`;
  } else if (!id && !created) row.created_at = kstNowIso();
  // 글이 새로 생기거나 자리(게시판·작성일·공개 여부)가 바뀌면 사이트맵과 옛 이웃 글의 이전/다음 링크가 달라진다 — 옛 이웃은 저장 전에 구해 둔다
  const structural = !prev || row.board !== prev.board || row.published !== prev.published || !!row.created_at;
  const oldAdj = prev && structural ? await adjacentOf(sb, prev.board, prev.id, prev.created_at) : [];

  /* 번역 정책
   *  changed : 국문이 바뀐 항목만 다시 번역 (기본값) — 국문·영문이 어긋나는 것을 막습니다
   *  missing : 영문이 비어 있는 항목만 번역
   *  none    : 번역하지 않음 (영문을 직접 손봤거나 오타만 고친 경우)
   * 관리자가 영문 칸을 직접 수정하면 그 항목은 자동 번역이 덮어쓰지 않습니다.
   * 신규 글은 관리자가 영문을 입력해 두었으면 그 값을 존중하고, 비어 있을 때만 번역합니다. */
  const mode = str(fd, 'translate_mode') || 'changed';
  let translateFailed = false;
  if (mode !== 'none') {
    const editedEn = (k: string) => fd.has(k) && !!prev && nul(str(fd, k)) !== (prev[k] ?? null);   // 관리자가 영문을 직접 고쳤는지 (폼에 있는 칸만)
    const koChanged = (k: string) => !prev || (row[k] || '') !== (prev[k] || '');
    const need = (koKey: string, enKey: string) =>
      !!row[koKey] && !editedEn(enKey) &&
      (mode === 'missing' || !prev ? !row[enKey] : (koChanged(koKey) || !row[enKey]));

    // 제목·요약·분류는 한 요청으로, 본문은 문단 단위로 나눠(translateLongContent) 따로 — 긴 글을 한 요청에 넣으면 잘려(null) 모든 칸이 영문 없이 저장되던 문제(2026-10-13).
    // 일괄 번역(/api/translate-all)·자동 보완(lib/translate-backfill)과 같은 방식
    const fields: Record<string, string> = {};
    if (need('title_ko', 'title_en')) fields.title = row.title_ko;
    if (need('excerpt_ko', 'excerpt_en')) fields.excerpt = row.excerpt_ko;
    if (need('category', 'category_en')) fields.category = row.category;
    if (Object.keys(fields).length) {
      const out = await translateKoToEn(fields);
      if (out) {
        if (fields.title && out.title) row.title_en = out.title;
        if (fields.excerpt && out.excerpt) row.excerpt_en = out.excerpt;
        if (fields.category && out.category) row.category_en = out.category;
      } else translateFailed = true;
    }
    if (need('content_ko', 'content_en')) {
      const content = await translateLongContent(row.content_ko);
      if (content) row.content_en = content; else translateFailed = true;
    }
  }

  // .select()로 실제 고친 행을 받는다 — 0건이면 그사이 삭제된 글(위와 같은 안내). 새 글은 id·DB가 매긴 created_at을 이웃 계산에 쓴다
  const q = id ? sb.from('posts').update(row).eq('id', Number(id)).select('id,created_at') : sb.from('posts').insert(row).select('id,created_at');
  const { data: saved, error } = await q; if (error) throw new Error(error.message);
  const s = saved?.[0];
  if (!s) redirect(note(list, `#${id} 글이 이미 삭제되어 저장하지 못했습니다.`));
  const neighbours = [...oldAdj, ...(await adjacentOf(sb, row.board, s.id, s.created_at)), ...(prev && prev.board !== row.board ? [{ board: prev.board, id: s.id }] : [])];   // 게시판을 옮겼으면 옛 주소(이제 404)도
  refreshPost({ board: row.board, id: s.id, neighbours, structural });
  redirect(translateFailed ? note(list, TRANSLATE_FAILED) : list);
}

/** 글 삭제 = 휴지통으로(30일 보관 후 자동 영구 삭제). 첨부·본문 파일도 그동안 지우지 않아 그대로 복구된다(2026-09-25). */
export async function deletePost(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id')); const board = str(fd, 'board');
  const { data: row } = await sb.from('posts').select('*').eq('id', id).single();
  if (row) await trashPost(serviceClient(), row, await who(sb));
  const adj = row ? await adjacentOf(sb, row.board, id, row.created_at) : [];   // 지우기 전에 — 이웃 글의 이전/다음 링크가 이 글을 가리키고 있다
  await sb.from('posts').delete().eq('id', id);
  refreshPost({ board: row?.board || board, id, neighbours: adj, structural: true }); redirect(`${base()}/posts?board=${board}`);
}

/** 휴지통에서 복구 — 같은 번호로 되살린다 */
export async function restorePost(fd: FormData) {
  await admin(); const id = Number(str(fd, 'id'));
  const svc = serviceClient(); const t = await getTrashed(svc, id);
  if (!t?.row) throw new Error('휴지통에서 글을 찾을 수 없습니다');
  const { data: exists } = await svc.from('posts').select('id').eq('id', id).maybeSingle();
  if (exists) throw new Error(`#${id} 글이 이미 있습니다`);
  const { error } = await svc.from('posts').insert(t.row); if (error) throw new Error(error.message);
  await removeTrashed(svc, id);
  refreshPost({ board: t.row.board, id, neighbours: await adjacentOf(svc, t.row.board, id, t.row.created_at), structural: true }); redirect(`${base()}/posts/${id}`);
}

/** 휴지통에서 영구 삭제(파일 포함, 다른 글·화면이 쓰는 파일은 남김) */
export async function purgePost(fd: FormData) {
  await admin(); const id = Number(str(fd, 'id'));
  const svc = serviceClient(); const t = await getTrashed(svc, id);
  // 자동 정리(cron/backup)와 같은 검사: 휴지통의 다른 글이 쓰는 파일은 남긴다(usedElsewhere는 살아 있는 행만 본다, 2026-10-13). 휴지통 조회가 실패하면 파일은 두고 기록만 지운다
  const urls = await trashFileUrls(svc).catch(() => null);
  if (t?.row && urls) await removeOwnMedia(svc, t.row, otherTrashUrls(urls, id));
  await removeTrashed(svc, id); redirect(`${base()}/backup`);
}

/** 수정 이력의 한 버전으로 되돌리기 — 지금 내용도 이력에 남긴 뒤 되돌린다 */
export async function restoreVersion(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id')); const name = str(fd, 'name');
  const svc = serviceClient(); const v = await getVersion(svc, id, name);
  if (!v?.row) throw new Error('이전 버전을 찾을 수 없습니다');
  const { data: cur } = await svc.from('posts').select('*').eq('id', id).single();
  if (!cur) redirect(note(`${base()}/posts`, `#${id} 글이 이미 삭제되어 되돌리지 못했습니다.`));   // 그사이 삭제된 글에 0건 수정을 하고 성공한 척하지 않는다
  await saveVersion(svc, cur, await who(sb));
  const oldAdj = await adjacentOf(svc, cur.board, id, cur.created_at);
  const { id: _i, created_at: _c, view_count: _v, ...fields } = v.row;
  const { error } = await svc.from('posts').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  const board = fields.board || cur.board;
  const neighbours = [...oldAdj, ...(await adjacentOf(svc, board, id, cur.created_at)), ...(board !== cur.board ? [{ board: cur.board, id }] : [])];
  refreshPost({ board, id, neighbours, structural: true }); redirect(`${base()}/posts/${id}?restored=1`);
}

/** 관리자 화면 '지금 백업' */
export async function backupNow() {
  await admin(); const svc = serviceClient();
  // 연타·새로고침 뒤 재클릭으로 전체 덤프(표 8개, 최대 200초)가 겹쳐 돌지 않게 — 마지막 시도가 10분 안이면 건너뛴다(Hobby 함수 시간 절약, 2026-10-13).
  // 상태 행(site_settings 'backup') 기준이라 서버리스 인스턴스가 달라도 막힌다(lib/ratelimit allow()는 인스턴스별 메모리라 여기엔 부족)
  const prev = await getBackupStatus(svc).catch(() => null);
  if (prev?.at && Date.now() - Date.parse(prev.at) < 10 * 60e3) redirect(`${base()}/backup?limited=1`);
  await runBackup(svc, 'manual');
  redirect(`${base()}/backup`);
}

export async function saveFaculty(fd: FormData) {
  const sb = await admin(); const id = str(fd, 'id');
  const row: any = {};
  for (const k of ['name_ko', 'name_en', 'title_ko', 'title_en', 'email', 'tel', 'lab_ko', 'lab_en', 'lab_url', 'photo_url', 'field', 'research_ko', 'research_en', 'bio_ko', 'bio_en']) row[k] = nul(str(fd, k));
  row.building = nul(str(fd, 'building')); row.room = nul(str(fd, 'room'));
  const bdg = buildingOf(row.building);
  row.office = bdg ? (row.room ? `${bdg.ko}(${bdg.code}) ${row.room}호` : `${bdg.ko}(${bdg.code})`) : null;
  row.name_ko = str(fd, 'name_ko').trim(); row.sort_order = int(fd, 'sort_order', 100);
  if (!row.name_ko) throw new Error('이름을 입력해 주세요.');   // 빈 이름 행이 목록·용어집(lib/names.ts)에 끼지 않게
  // 구분(전임/명예/석좌): category 셀렉트가 is_emeritus와 field='chair'를 결정한다
  const category = str(fd, 'category');
  if (category) {
    row.is_emeritus = category === 'emeritus';
    if (category === 'chair') row.field = 'chair';
    else if (category === 'emeritus') row.field = null; // 퇴임 처리(구분만 명예교수로 변경) 시 전임 시절 분야가 남지 않게 — 공개 페이지·목록은 명예교수의 field를 쓰지 않는다
    else if (row.field === 'chair') row.field = null;
  } else row.is_emeritus = bool(fd, 'is_emeritus');
  row.published = bool(fd, 'published');
  row.groups = researchGroupDefs.filter((g) => bool(fd, `group_${g.id}`)).map((g) => g.id);
  /* 교수 정보도 같은 정책: 국문이 바뀐 항목만 다시 번역 */
  const mode = str(fd, 'translate_mode') || 'changed';
  // 이름 영문이 새로 생기거나 바뀌었는지 — 바뀌면 저장 후 기존 게시글 영문도 맞춘다(lib/names-sync). 연구실명(lab_en)은 그 치환에 쓰이지 않으므로 비교하지 않는다
  const { data: before } = id ? await sb.from('faculty').select('name_en').eq('id', Number(id)).single() : { data: null as any };
  if (mode !== 'none') {
    let prev: any = null;
    if (id) { const { data } = await sb.from('faculty').select('lab_ko,lab_en,research_ko,research_en,bio_ko,bio_en,name_ko,name_en').eq('id', Number(id)).single(); prev = data; }
    const editedEn = (k: string) => !!prev && nul(str(fd, k)) !== (prev[k] ?? null);
    const koChanged = (k: string) => !prev || (row[k] || '') !== (prev[k] || '');
    const need = (koKey: string, enKey: string) =>
      !!row[koKey] && !editedEn(enKey) &&
      (mode === 'missing' || !prev ? !row[enKey] : (koChanged(koKey) || !row[enKey]));   // 신규는 영문 직접 입력을 존중
    const fields: Record<string, string> = {};
    if (need('lab_ko', 'lab_en')) fields.lab = row.lab_ko;
    if (need('research_ko', 'research_en')) fields.research = row.research_ko;
    if (need('bio_ko', 'bio_en')) fields.bio = row.bio_ko;
    if (row.name_ko && !row.name_en) fields.name = row.name_ko;
    if (Object.keys(fields).length) {
      const out = await translateKoToEn(fields);
      if (out) {
        if (fields.lab && out.lab) row.lab_en = out.lab;
        if (fields.research && out.research) row.research_en = out.research;
        if (fields.bio && out.bio) row.bio_en = out.bio;
        if (fields.name && out.name) row.name_en = out.name;
      }
    }
  }
  const q = id ? sb.from('faculty').update(row).eq('id', Number(id)).select('id') : sb.from('faculty').insert(row).select('id');
  const { data: saved, error } = await q; if (error) throw new Error(error.message);
  const fid = saved?.[0]?.id ?? (id ? Number(id) : undefined);
  clearFacultyNamesCache();
  let synced: { id: number; board: string }[] = [];
  if (row.name_ko && row.name_en && (!before || before.name_en !== row.name_en)) {
    synced = await syncFacultyNameInPosts(sb as any, { ko: row.name_ko, en: row.name_en, labKo: row.lab_ko, labEn: row.lab_en }, await who(sb)).catch(() => []);
  }
  refreshFaculty(fid);
  // 표기를 맞춘 게시글만 갱신. 수십 건을 넘으면(드문 공식 표기 변경) 글 하나하나 대신 게시글 상세 경로 전체를 한 번에 비운다
  if (synced.length > 30) refreshAllPosts(); else for (const p of synced) refreshPost({ board: p.board, id: p.id });
  redirect(`${base()}/faculty`);
}
export async function deleteFaculty(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id'));
  const { data: row } = await sb.from('faculty').select('photo_url').eq('id', id).single();
  await sb.from('faculty').delete().eq('id', id);
  // 행을 지운 뒤에 — 다른 교수·글·배너·페이지가 같은 파일을 쓰면 남긴다(예전엔 무조건 지웠다, 2026-10-13)
  if (row?.photo_url) await removeUnusedMedia(sb, [row.photo_url]).catch(() => 0);
  clearFacultyNamesCache(); refreshFaculty(id); redirect(`${base()}/faculty`);
}

/** 코드에 있는 고정 페이지만 — 임의 slug 행이 생기거나 'constructor' 같은 상속 키가 통과하지 않게 */
const knownPage = (slug: string) => Object.prototype.hasOwnProperty.call(staticPages, slug);

export async function savePage(fd: FormData) {
  const sb = await admin(); const slug = str(fd, 'slug');
  if (!knownPage(slug)) throw new Error('알 수 없는 페이지입니다.');
  const builtin = staticPages[slug];
  const row: any = { slug, title_ko: nul(str(fd, 'title_ko')), title_en: nul(str(fd, 'title_en')), content_ko: nul(toHtml(str(fd, 'content_ko'))), content_en: nul(toHtml(str(fd, 'content_en'))), updated_at: new Date().toISOString() };
  const mode = str(fd, 'translate_mode') || 'changed';
  let translateFailed = false;
  if (mode !== 'none' && row.content_ko) {
    const { data: prev } = await sb.from('pages').select('content_ko,content_en').eq('slug', slug).maybeSingle();
    /* 편집기는 영문 칸을 코드 내장 영문으로 미리 채워 보여 준다. 그래서 첫 저장 때 '영문이 이미 있다'고 보고 번역을 건너뛰면
     * 국문만 바뀐 채 내장 영문이 DB에 굳어 /en이 옛 내용으로 남았다(2026-10-13). 내장 영문 그대로면 '직접 고치지 않음'으로 보고
     * 국문이 내장 국문과 달라졌으면 번역한다. 번역에 실패하면 내장 영문을 저장하지 않고 비워 둔다 — 그래야 일괄 번역(/api/translate-all pages)이 나중에 채운다.
     * (편집기 재직렬화로 공백만 다를 수 있어 태그 사이 공백을 지우고 비교) */
    const norm = (s: string | null | undefined) => String(s || '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
    const builtinEn = norm(toHtml(builtin.en));
    const enIsBuiltin = !!builtinEn && norm(row.content_en) === builtinEn;
    const koIsBuiltin = norm(row.content_ko) === norm(toHtml(builtin.ko));
    const editedEn = !enIsBuiltin && row.content_en !== (prev?.content_en ?? null);
    const stale = !row.content_en || (enIsBuiltin && !koIsBuiltin);   // 영문이 없거나, 국문은 바뀌었는데 영문은 내장본 그대로
    const koChanged = prev ? row.content_ko !== (prev.content_ko || '') : !koIsBuiltin;
    const need = !editedEn && (mode === 'missing' ? stale : (koChanged || stale));
    if (need) {
      const out = await translateLongContent(row.content_ko);   // 교과과정처럼 긴 본문도 나눠 번역(한 요청은 잘려 null)
      if (out) row.content_en = out; else { translateFailed = true; if (stale) row.content_en = null; }
    }
  }
  const { error } = await sb.from('pages').upsert(row); if (error) throw new Error(error.message);
  refreshStaticPage(slug);
  redirect(translateFailed ? note(`${base()}/pages`, TRANSLATE_FAILED) : `${base()}/pages`);
}

export async function resetPage(fd: FormData) {
  const sb = await admin(); const slug = str(fd, 'slug');
  if (!knownPage(slug)) throw new Error('알 수 없는 페이지입니다.');
  await sb.from('pages').delete().eq('slug', slug); refreshStaticPage(slug); redirect(`${base()}/pages`);
}

/* ───────── 시설 예약 (관리자) ─────────
 * 화면 상태(시설·연월·날짜)는 쿼리스트링으로 유지한다 — 한 건 등록 후에도 같은 시설·날짜가 그대로 남게. */
const safeBack = (s: string) => (s.startsWith('/') && !s.startsWith('//') ? s : `${base()}/reservations`);
const resvUrl = (facility: string, date: string, extra: Record<string, string> = {}) => {
  const q = new URLSearchParams({ f: facility, y: date.slice(0, 4), m: String(Number(date.slice(5, 7))), d: date, ...extra });
  return `${base()}/reservations?${q.toString()}`;
};
type Resv = { facility: string; date: string; start_time: string; end_time: string; user_name: string; purpose: string | null };
/** prev를 주면(수정) 30분 단위가 아닌 기존 시각도 '그대로 두는 것'은 허용한다 — 옛 사이트에서 이관된 09:15 같은 행의 이름만 고칠 때 시간이 바뀌지 않게.
 *  검증에 걸리면 err에 안내문을 담아 돌려주고 호출하는 쪽이 화면(?note=)으로 되돌린다 — throw하면 운영 환경에서는 메시지가 가려진 오류 화면만 남는다(2026-10-13). */
function readResv(fd: FormData, prev?: { start_time: string; end_time: string } | null): { r: Resv; err: string | null } {
  const r: Resv = { facility: str(fd, 'facility'), date: str(fd, 'date'), start_time: str(fd, 'start_time').slice(0, 5), end_time: str(fd, 'end_time').slice(0, 5), user_name: str(fd, 'user_name').trim(), purpose: nul(str(fd, 'purpose')) };
  const kept = (v: string, p?: string) => !!p && v === p.slice(0, 5);
  let err: string | null = null;
  if (!facilities.some((f) => f.id === r.facility)) err = '시설을 선택해 주세요.';
  else if (!isDateStr(r.date) || !r.start_time || !r.end_time || !r.user_name) err = '필수 항목이 비어 있습니다.';
  else if ((!isHalfHour(r.start_time) && !kept(r.start_time, prev?.start_time)) || (!isHalfHour(r.end_time) && !kept(r.end_time, prev?.end_time))) err = '시간은 30분 단위로 입력해 주세요.';
  else if (r.start_time >= r.end_time) err = '종료 시간이 시작 시간보다 늦어야 합니다.';
  return { r, err };
}
/** 안내문을 들고 돌아갈 주소: 시설·날짜가 유효하면 그 화면으로, 아니면 예약 관리 첫 화면으로 */
const resvBack = (r: Resv, msg: string, extra: Record<string, string> = {}) =>
  facilities.some((f) => f.id === r.facility) && isDateStr(r.date) ? resvUrl(r.facility, r.date, { ...extra, note: msg }) : note(`${base()}/reservations`, msg);
const fmtClash = (c: any) => `${c.date ? c.date.slice(5) + ' ' : ''}${c.start_time.slice(0, 5)}~${c.end_time.slice(0, 5)} ${c.user_name}`;

export async function setReservation(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id')); const status = str(fd, 'status'); const back = safeBack(str(fd, 'back'));
  if (status === 'delete') await sb.from('reservations').delete().eq('id', id);
  else if (['approved', 'rejected', 'pending'].includes(status)) {
    if (status === 'approved') {
      // 승인 전에 겹침 검사 — 화면의 '⚠ 중복' 경고는 표시만이라 겹치는 신청 두 건이 모두 승인되던 문제(2026-10-13). updateReservation과 같은 조건(거절 제외·자기 제외·대기 건도 포함: 경쟁 신청을 먼저 거절해야 승인된다)
      const { data: cur } = await sb.from('reservations').select('facility,date,start_time,end_time').eq('id', id).maybeSingle();
      if (!cur) redirect(note(back, '예약을 찾을 수 없습니다.'));
      const { data: clash } = await sb.from('reservations').select('date,start_time,end_time,user_name')
        .eq('facility', cur.facility).eq('date', cur.date).neq('status', 'rejected').neq('id', id)
        .lt('start_time', cur.end_time).gt('end_time', cur.start_time).limit(3);
      if (clash && clash.length) redirect(resvUrl(cur.facility, cur.date, { note: `승인하지 않았습니다 — 겹치는 예약: ${clash.map(fmtClash).join(', ')}` }));
    }
    await sb.from('reservations').update({ status }).eq('id', id);
  }
  refreshReservations(); redirect(back);
}

/** 직접 등록(즉시 확정). 반복(매주/격주)이면 종료일까지 여러 날짜를 한 번에 넣고, 겹치는 날짜만 건너뛰어 결과를 알려준다. */
export async function addReservation(fd: FormData) {
  const sb = await admin();
  const { r, err } = readResv(fd); if (err) redirect(resvBack(r, err));
  const repeat = (['weekly', 'biweekly'].includes(str(fd, 'repeat')) ? str(fd, 'repeat') : 'none') as Repeat;
  const untilRaw = str(fd, 'repeat_until');
  const until = isDateStr(untilRaw) ? untilRaw : null;   // 형식이 아니면 반복 없이 1건만
  const dates = repeatDates(r.date, repeat, until);
  const { data: clashes } = await sb.from('reservations').select('date,start_time,end_time,user_name')
    .eq('facility', r.facility).in('date', dates).neq('status', 'rejected')
    .lt('start_time', r.end_time).gt('end_time', r.start_time).order('date');
  const clashDates = new Set((clashes || []).map((c: any) => c.date));
  const rows = dates.filter((d) => !clashDates.has(d)).map((d) => ({ ...r, date: d, status: 'approved' }));
  if (rows.length) { const { error } = await sb.from('reservations').insert(rows); if (error) throw new Error(error.message); }
  let msg = rows.length ? `${rows.length}건 등록했습니다.` : '';
  if (clashDates.size) msg += `${msg ? ' ' : ''}겹치는 예약이 있어 건너뜀: ${(clashes || []).map(fmtClash).join(', ')}`;
  if (repeat !== 'none' && dates.length >= REPEAT_MAX) msg += ` (반복은 최대 ${REPEAT_MAX}건까지)`;
  refreshReservations();
  redirect(resvUrl(r.facility, r.date, { note: msg }));
}

/** 수정 모드: 승인된 예약도 삭제 없이 시설·날짜·시간·이름·목적을 고친다 (겹침 검사는 자기 자신 제외). */
export async function updateReservation(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id'));
  if (!id) redirect(note(`${base()}/reservations`, '잘못된 요청입니다.'));
  const { data: prev } = await sb.from('reservations').select('start_time,end_time').eq('id', id).maybeSingle();
  if (!prev) redirect(note(`${base()}/reservations`, '예약을 찾을 수 없습니다.'));
  const { r, err } = readResv(fd, prev); if (err) redirect(resvBack(r, err, { edit: String(id) }));
  const status = ['approved', 'rejected', 'pending'].includes(str(fd, 'status')) ? str(fd, 'status') : undefined;
  // 거절로 바꾸는 저장은 자리를 차지하지 않으므로 겹침 검사를 하지 않는다 (겹친 신청을 거절하는 게 바로 그 용도)
  if (status !== 'rejected') {
    const { data: clash } = await sb.from('reservations').select('date,start_time,end_time,user_name')
      .eq('facility', r.facility).eq('date', r.date).neq('status', 'rejected').neq('id', id)
      .lt('start_time', r.end_time).gt('end_time', r.start_time).limit(3);
    if (clash && clash.length) redirect(resvUrl(r.facility, r.date, { edit: String(id), note: `저장하지 않았습니다 — 겹치는 예약: ${clash.map(fmtClash).join(', ')}` }));
  }
  const { error } = await sb.from('reservations').update({ ...r, ...(status ? { status } : {}) }).eq('id', id);
  if (error) throw new Error(error.message);
  refreshReservations();
  redirect(resvUrl(r.facility, r.date, { note: '수정했습니다.' }));
}

export async function saveSettings(fd: FormData) {
  const sb = await admin();
  const sections = ['hero', 'promo', 'intro', 'news', 'videos', 'programs', 'quicklinks', 'gallery'].filter((s) => bool(fd, `sec_${s}`));
  const order = str(fd, 'order').split(',').map((s) => s.trim()).filter(Boolean);
  const ordered = [...order.filter((s) => sections.includes(s)), ...sections.filter((s) => !order.includes(s))];
  const value = { sections: ordered, news_count: int(fd, 'news_count', 8), tagline_ko: nul(str(fd, 'tagline_ko')), tagline_en: nul(str(fd, 'tagline_en')), hero_video_url: nul(str(fd, 'hero_video_url')), hero_poster_url: nul(str(fd, 'hero_poster_url')), notify_email: nul(str(fd, 'notify_email')) };
  const { error } = await sb.from('site_settings').upsert({ key: 'home', value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message); refreshHome(); redirect(`${base()}/settings`);   // 메인 설정은 홈만 쓴다
}

export async function saveBanner(fd: FormData) {
  const sb = await admin(); const id = str(fd, 'id');
  const row: any = { title_ko: nul(str(fd, 'title_ko')), title_en: nul(str(fd, 'title_en')), subtitle_ko: nul(str(fd, 'subtitle_ko')), subtitle_en: nul(str(fd, 'subtitle_en')), image_url: nul(str(fd, 'image_url')), link: nul(str(fd, 'link')), sort_order: int(fd, 'sort_order', 100), visible: bool(fd, 'visible') };
  const q = id ? sb.from('banners').update(row).eq('id', Number(id)) : sb.from('banners').insert(row);
  const { error } = await q; if (error) throw new Error(error.message); refreshHome(); redirect(`${base()}/banners`);   // 배너는 홈에만 나온다
}
export async function deleteBanner(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id'));
  const { data: row } = await sb.from('banners').select('image_url').eq('id', id).single();
  await sb.from('banners').delete().eq('id', id);
  if (row?.image_url) await removeUnusedMedia(sb, [row.image_url]).catch(() => 0);   // 행을 지운 뒤에 — 다른 곳이 쓰는 파일은 남긴다
  refreshHome(); redirect(`${base()}/banners`);
}
export async function addAdmin(fd: FormData) {
  const sb = await admin(); const email = str(fd, 'email').trim().toLowerCase();
  if (email) {
    const { error } = await sb.from('admins').insert({ email });
    // admins 쓰기 정책(schema_v8)이 없으면 RLS가 조용히 거부한다 — 성공한 척하지 않는다
    if (error) throw new Error(`관리자 추가 실패: ${error.message} (Supabase에 schema_v8.sql을 적용했는지 확인)`);
  }
  redirect(`${base()}/settings`);
}

export async function setUreca(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id')); const status = str(fd, 'status');
  // 화면의 버튼 값만 받는다(임의 문자열이 상태 컬럼에 들어가지 않게). 'archived'는 이관 기록 전용이라 화면에서 보내지 않는다
  if (status === 'delete') await sb.from('ureca_applications').delete().eq('id', id);
  else if (['accepted', 'rejected', 'pending'].includes(status)) await sb.from('ureca_applications').update({ status }).eq('id', id);
  redirect(`${base()}/ureca`);
}
