'use server';
import { syncFacultyNameInPosts } from '@/lib/names-sync';
import { clearFacultyNamesCache } from '@/lib/names';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { translateKoToEn } from '@/lib/translate';
import { toHtml } from '@/lib/html';
import { researchGroupDefs } from '@/lib/groups';
import { buildingOf } from '@/lib/buildings';
import { facilities } from '@/lib/nav';
import { isHalfHour, isDateStr, repeatDates, REPEAT_MAX, type Repeat } from '@/lib/reservation';
import { refreshSite } from '@/lib/refresh';
import { mediaPaths, removeOwnMedia } from '@/lib/media';
import { serviceClient, trashPost, getTrashed, removeTrashed, saveVersion, getVersion } from '@/lib/vault';
import { runBackup } from '@/lib/backup';

import { adminBase as base } from '@/lib/admin';

async function admin() {
  const sb = createClient();
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
async function removeMedia(sb: any, row: any) {
  const urls = [row?.thumbnail_url, ...(row?.images || []).map((i: any) => i.url), ...(row?.attachments || []).map((f: any) => f.url)].filter(Boolean);
  const inBody = [...String(row?.content_ko || '' ).matchAll(/src="([^"]+)"/g), ...String(row?.content_en || '').matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  const paths = mediaPaths([...urls, ...inBody]);
  if (paths.length) await sb.storage.from('media').remove(paths);
  return paths.length;
}
const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);

export async function signOut() {
  const sb = createClient(); await sb.auth.signOut(); redirect(base());
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
    video_url: nul(str(fd, 'video_url')), term: nul(str(fd, 'term')), members: nul(str(fd, 'members')), advisor: nul(str(fd, 'advisor')), category: nul(str(fd, 'category')), sort_order: Number(str(fd, 'sort_order') || 100),
    excerpt_ko: nul(str(fd, 'excerpt_ko')) || strip(str(fd, 'content_ko')),
    thumbnail_url: nul(str(fd, 'thumbnail_url')), author: str(fd, 'author') || '기계공학과',
    is_pinned: bool(fd, 'is_pinned'), show_on_home: bool(fd, 'show_on_home'), published: bool(fd, 'published'),
    images: JSON.parse(str(fd, 'images') || '[]'), attachments: JSON.parse(str(fd, 'attachments') || '[]'),
    updated_at: new Date().toISOString(),
  };
  if (!row.title_ko.trim()) throw new Error('제목을 입력해 주세요.');

  let prev: any = null;
  if (id) { const { data } = await sb.from('posts').select('title_ko,content_ko,excerpt_ko,category,title_en,content_en,excerpt_en,category_en,created_at,thumbnail_url').eq('id', Number(id)).single(); prev = data; }
  // 수정 이력: 저장 직전 내용을 보관(글마다 최근 20개·90일). 보관이 실패해도 저장은 막지 않는다
  if (id) {
    const { data: full } = await sb.from('posts').select('*').eq('id', Number(id)).single();
    if (full) await saveVersion(serviceClient(), full, await who(sb)).catch((e) => console.error('history', e?.message));
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

  /* 번역 정책
   *  changed : 국문이 바뀐 항목만 다시 번역 (기본값) — 국문·영문이 어긋나는 것을 막습니다
   *  missing : 영문이 비어 있는 항목만 번역
   *  none    : 번역하지 않음 (영문을 직접 손봤거나 오타만 고친 경우)
   * 관리자가 영문 칸을 직접 수정하면 그 항목은 자동 번역이 덮어쓰지 않습니다.
   * 신규 글은 관리자가 영문을 입력해 두었으면 그 값을 존중하고, 비어 있을 때만 번역합니다. */
  const mode = str(fd, 'translate_mode') || 'changed';
  if (mode !== 'none') {
    const editedEn = (k: string) => fd.has(k) && !!prev && nul(str(fd, k)) !== (prev[k] ?? null);   // 관리자가 영문을 직접 고쳤는지 (폼에 있는 칸만)
    const koChanged = (k: string) => !prev || (row[k] || '') !== (prev[k] || '');
    const need = (koKey: string, enKey: string) =>
      !!row[koKey] && !editedEn(enKey) &&
      (mode === 'missing' || !prev ? !row[enKey] : (koChanged(koKey) || !row[enKey]));

    const fields: Record<string, string> = {};
    if (need('title_ko', 'title_en')) fields.title = row.title_ko;
    if (need('content_ko', 'content_en')) fields.content = row.content_ko;
    if (need('excerpt_ko', 'excerpt_en')) fields.excerpt = row.excerpt_ko;
    if (need('category', 'category_en')) fields.category = row.category;

    if (Object.keys(fields).length) {
      const out = await translateKoToEn(fields);
      if (out) {
        if (fields.title && out.title) row.title_en = out.title;
        if (fields.content && out.content) row.content_en = out.content;
        if (fields.excerpt && out.excerpt) row.excerpt_en = out.excerpt;
        if (fields.category && out.category) row.category_en = out.category;
      }
    }
  }

  const q = id ? sb.from('posts').update(row).eq('id', Number(id)) : sb.from('posts').insert(row);
  const { error } = await q; if (error) throw new Error(error.message);
  refreshSite();
  redirect(`${base()}/posts?board=${row.board}`);
}

/** 글 삭제 = 휴지통으로(30일 보관 후 자동 영구 삭제). 첨부·본문 파일도 그동안 지우지 않아 그대로 복구된다(2026-09-25). */
export async function deletePost(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id')); const board = str(fd, 'board');
  const { data: row } = await sb.from('posts').select('*').eq('id', id).single();
  if (row) await trashPost(serviceClient(), row, await who(sb));
  await sb.from('posts').delete().eq('id', id); refreshSite(); redirect(`${base()}/posts?board=${board}`);
}

/** 휴지통에서 복구 — 같은 번호로 되살린다 */
export async function restorePost(fd: FormData) {
  await admin(); const id = Number(str(fd, 'id'));
  const svc = serviceClient(); const t = await getTrashed(svc, id);
  if (!t?.row) throw new Error('휴지통에서 글을 찾을 수 없습니다');
  const { data: exists } = await svc.from('posts').select('id').eq('id', id).maybeSingle();
  if (exists) throw new Error(`#${id} 글이 이미 있습니다`);
  const { error } = await svc.from('posts').insert(t.row); if (error) throw new Error(error.message);
  await removeTrashed(svc, id); refreshSite(); redirect(`${base()}/posts/${id}`);
}

/** 휴지통에서 영구 삭제(파일 포함, 다른 글이 쓰는 파일은 남김) */
export async function purgePost(fd: FormData) {
  await admin(); const id = Number(str(fd, 'id'));
  const svc = serviceClient(); const t = await getTrashed(svc, id);
  if (t?.row) await removeOwnMedia(svc, t.row);
  await removeTrashed(svc, id); redirect(`${base()}/backup`);
}

/** 수정 이력의 한 버전으로 되돌리기 — 지금 내용도 이력에 남긴 뒤 되돌린다 */
export async function restoreVersion(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id')); const name = str(fd, 'name');
  const svc = serviceClient(); const v = await getVersion(svc, id, name);
  if (!v?.row) throw new Error('이전 버전을 찾을 수 없습니다');
  const { data: cur } = await svc.from('posts').select('*').eq('id', id).single();
  if (cur) await saveVersion(svc, cur, await who(sb));
  const { id: _i, created_at: _c, view_count: _v, ...fields } = v.row;
  const { error } = await svc.from('posts').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  refreshSite(); redirect(`${base()}/posts/${id}?restored=1`);
}

/** 관리자 화면 '지금 백업' */
export async function backupNow() {
  await admin();
  await runBackup(serviceClient(), 'manual');
  redirect(`${base()}/backup`);
}

export async function saveFaculty(fd: FormData) {
  const sb = await admin(); const id = str(fd, 'id');
  const row: any = {};
  for (const k of ['name_ko', 'name_en', 'title_ko', 'title_en', 'email', 'tel', 'lab_ko', 'lab_en', 'lab_url', 'photo_url', 'field', 'research_ko', 'research_en', 'bio_ko', 'bio_en']) row[k] = nul(str(fd, k));
  row.building = nul(str(fd, 'building')); row.room = nul(str(fd, 'room'));
  const bdg = buildingOf(row.building);
  row.office = bdg ? (row.room ? `${bdg.ko}(${bdg.code}) ${row.room}호` : `${bdg.ko}(${bdg.code})`) : null;
  row.name_ko = str(fd, 'name_ko'); row.sort_order = Number(str(fd, 'sort_order') || 100);
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
  // 이름·연구실 영문이 새로 생기거나 바뀌었는지 — 바뀌면 저장 후 기존 게시글 영문도 맞춘다(lib/names-sync)
  const { data: before } = id ? await sb.from('faculty').select('name_en,lab_en').eq('id', Number(id)).single() : { data: null as any };
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
  const q = id ? sb.from('faculty').update(row).eq('id', Number(id)) : sb.from('faculty').insert(row);
  const { error } = await q; if (error) throw new Error(error.message);
  clearFacultyNamesCache();
  if (row.name_ko && row.name_en && (!before || before.name_en !== row.name_en || before.lab_en !== row.lab_en)) {
    await syncFacultyNameInPosts(sb as any, { ko: row.name_ko, en: row.name_en, labKo: row.lab_ko, labEn: row.lab_en }).catch(() => 0);
  }
  refreshSite(); redirect(`${base()}/faculty`);
}
export async function deleteFaculty(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id'));
  const { data: row } = await sb.from('faculty').select('photo_url').eq('id', id).single();
  if (row?.photo_url) await removeMedia(sb, { thumbnail_url: row.photo_url });
  await sb.from('faculty').delete().eq('id', id); refreshSite(); redirect(`${base()}/faculty`);
}

export async function savePage(fd: FormData) {
  const sb = await admin(); const slug = str(fd, 'slug');
  const row: any = { slug, title_ko: nul(str(fd, 'title_ko')), title_en: nul(str(fd, 'title_en')), content_ko: nul(toHtml(str(fd, 'content_ko'))), content_en: nul(toHtml(str(fd, 'content_en'))), updated_at: new Date().toISOString() };
  const mode = str(fd, 'translate_mode') || 'changed';
  if (mode !== 'none' && row.content_ko) {
    const { data: prev } = await sb.from('pages').select('content_ko,content_en').eq('slug', slug).maybeSingle();
    const editedEn = !!prev && row.content_en !== (prev.content_en ?? null);
    const koChanged = !prev || row.content_ko !== (prev.content_ko || '');
    const need = !editedEn && (mode === 'missing' || !prev ? !row.content_en : (koChanged || !row.content_en));
    if (need) { const out = await translateKoToEn({ content: row.content_ko }); if (out?.content) row.content_en = out.content; }
  }
  const { error } = await sb.from('pages').upsert(row); if (error) throw new Error(error.message);
  refreshSite(); redirect(`${base()}/pages`);
}

export async function resetPage(fd: FormData) {
  const sb = await admin(); await sb.from('pages').delete().eq('slug', str(fd, 'slug')); refreshSite(); redirect(`${base()}/pages`);
}

/* ───────── 시설 예약 (관리자) ─────────
 * 화면 상태(시설·연월·날짜)는 쿼리스트링으로 유지한다 — 한 건 등록 후에도 같은 시설·날짜가 그대로 남게. */
const safeBack = (s: string) => (s.startsWith('/') && !s.startsWith('//') ? s : `${base()}/reservations`);
const resvUrl = (facility: string, date: string, extra: Record<string, string> = {}) => {
  const q = new URLSearchParams({ f: facility, y: date.slice(0, 4), m: String(Number(date.slice(5, 7))), d: date, ...extra });
  return `${base()}/reservations?${q.toString()}`;
};
/** prev를 주면(수정) 30분 단위가 아닌 기존 시각도 '그대로 두는 것'은 허용한다 — 옛 사이트에서 이관된 09:15 같은 행의 이름만 고칠 때 시간이 바뀌지 않게. */
function readResv(fd: FormData, prev?: { start_time: string; end_time: string } | null) {
  const r = { facility: str(fd, 'facility'), date: str(fd, 'date'), start_time: str(fd, 'start_time').slice(0, 5), end_time: str(fd, 'end_time').slice(0, 5), user_name: str(fd, 'user_name').trim(), purpose: nul(str(fd, 'purpose')) };
  if (!facilities.some((f) => f.id === r.facility)) throw new Error('시설을 선택해 주세요.');
  if (!isDateStr(r.date) || !r.start_time || !r.end_time || !r.user_name) throw new Error('필수 항목이 비어 있습니다.');
  const kept = (v: string, p?: string) => !!p && v === p.slice(0, 5);
  if ((!isHalfHour(r.start_time) && !kept(r.start_time, prev?.start_time)) || (!isHalfHour(r.end_time) && !kept(r.end_time, prev?.end_time))) throw new Error('시간은 30분 단위로 입력해 주세요.');
  if (r.start_time >= r.end_time) throw new Error('종료 시간이 시작 시간보다 늦어야 합니다.');
  return r;
}
const fmtClash = (c: any) => `${c.date ? c.date.slice(5) + ' ' : ''}${c.start_time.slice(0, 5)}~${c.end_time.slice(0, 5)} ${c.user_name}`;

export async function setReservation(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id')); const status = str(fd, 'status');
  if (status === 'delete') await sb.from('reservations').delete().eq('id', id);
  else if (['approved', 'rejected', 'pending'].includes(status)) await sb.from('reservations').update({ status }).eq('id', id);
  refreshSite(); redirect(safeBack(str(fd, 'back')));
}

/** 직접 등록(즉시 확정). 반복(매주/격주)이면 종료일까지 여러 날짜를 한 번에 넣고, 겹치는 날짜만 건너뛰어 결과를 알려준다. */
export async function addReservation(fd: FormData) {
  const sb = await admin();
  const r = readResv(fd);
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
  let note = rows.length ? `${rows.length}건 등록했습니다.` : '';
  if (clashDates.size) note += `${note ? ' ' : ''}겹치는 예약이 있어 건너뜀: ${(clashes || []).map(fmtClash).join(', ')}`;
  if (repeat !== 'none' && dates.length >= REPEAT_MAX) note += ` (반복은 최대 ${REPEAT_MAX}건까지)`;
  refreshSite();
  redirect(resvUrl(r.facility, r.date, { note }));
}

/** 수정 모드: 승인된 예약도 삭제 없이 시설·날짜·시간·이름·목적을 고친다 (겹침 검사는 자기 자신 제외). */
export async function updateReservation(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id'));
  if (!id) throw new Error('잘못된 요청입니다.');
  const { data: prev } = await sb.from('reservations').select('start_time,end_time').eq('id', id).maybeSingle();
  if (!prev) throw new Error('예약을 찾을 수 없습니다.');
  const r = readResv(fd, prev);
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
  refreshSite();
  redirect(resvUrl(r.facility, r.date, { note: '수정했습니다.' }));
}

export async function saveSettings(fd: FormData) {
  const sb = await admin();
  const sections = ['hero', 'promo', 'intro', 'news', 'videos', 'programs', 'quicklinks', 'gallery'].filter((s) => bool(fd, `sec_${s}`));
  const order = str(fd, 'order').split(',').map((s) => s.trim()).filter(Boolean);
  const ordered = [...order.filter((s) => sections.includes(s)), ...sections.filter((s) => !order.includes(s))];
  const value = { sections: ordered, news_count: Number(str(fd, 'news_count') || 8), tagline_ko: nul(str(fd, 'tagline_ko')), tagline_en: nul(str(fd, 'tagline_en')), hero_video_url: nul(str(fd, 'hero_video_url')), hero_poster_url: nul(str(fd, 'hero_poster_url')), notify_email: nul(str(fd, 'notify_email')) };
  const { error } = await sb.from('site_settings').upsert({ key: 'home', value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message); refreshSite(); redirect(`${base()}/settings`);
}

export async function saveBanner(fd: FormData) {
  const sb = await admin(); const id = str(fd, 'id');
  const row: any = { title_ko: nul(str(fd, 'title_ko')), title_en: nul(str(fd, 'title_en')), subtitle_ko: nul(str(fd, 'subtitle_ko')), subtitle_en: nul(str(fd, 'subtitle_en')), image_url: nul(str(fd, 'image_url')), link: nul(str(fd, 'link')), sort_order: Number(str(fd, 'sort_order') || 100), visible: bool(fd, 'visible') };
  const q = id ? sb.from('banners').update(row).eq('id', Number(id)) : sb.from('banners').insert(row);
  const { error } = await q; if (error) throw new Error(error.message); refreshSite(); redirect(`${base()}/banners`);
}
export async function deleteBanner(fd: FormData) {
  const sb = await admin(); const id = Number(str(fd, 'id'));
  const { data: row } = await sb.from('banners').select('image_url').eq('id', id).single();
  if (row?.image_url) await removeMedia(sb, { thumbnail_url: row.image_url });
  await sb.from('banners').delete().eq('id', id); refreshSite(); redirect(`${base()}/banners`);
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
  if (status === 'delete') await sb.from('ureca_applications').delete().eq('id', id); else await sb.from('ureca_applications').update({ status }).eq('id', id);
  redirect(`${base()}/ureca`);
}
