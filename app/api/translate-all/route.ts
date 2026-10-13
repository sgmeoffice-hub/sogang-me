import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { translateKoToEn, translateLongContent, translateProvider } from '@/lib/translate';
import { refreshPost, refreshFaculty, refreshStaticPage } from '@/lib/refresh';

export const maxDuration = 60;

/**
 * 관리자 전용 일괄 번역. 반복 호출하며 remaining이 0이 될 때까지 진행합니다.
 *  - force: false → 영문이 비어 있는 항목만
 *  - force: true  → 이미 있는 영문도 다시 번역 (무료 번역본을 Claude로 교체할 때)
 * 고친 항목의 페이지는 그때그때 갱신한다(lib/refresh.ts) — 끝나고 사이트 전체를 비울 필요가 없다(Vercel 무료 한도, 2026-10-13).
 */
export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const target = body.target || 'posts';
  const batch = Math.min(Number(body.batch) || 3, 8);
  const force = !!body.force;
  const board = body.board || null;
  // cursor: 이번 실행에서 이미 훑은 지점 뒤부터 조회 — 번역이 실패한 행이 매 반복 맨 앞에 다시
  // 뽑혀 유료 호출이 무한 반복되는 것을 막는다 (다음 실행에서 처음부터 재시도)
  const cursor = Number(body.cursor) || 0;
  let done = 0; let remaining = 0; let last = cursor; const errors: string[] = [];
  // 조회 자체가 실패하면(예: en_verified 컬럼이 없는 DB — schema_v7 미적용) '0건 완료 · 남은 0건'으로 끝난 척하지 않고 원인을 돌려준다(2026-10-13)
  const fail = (e: { message: string }) => NextResponse.json({ error: e.message }, { status: 500 });

  if (target === 'posts') {
    let q = sb.from('posts').select('id,board,title_ko,title_en,content_ko,content_en,excerpt_ko,excerpt_en,category,category_en', { count: 'exact' });
    if (board) q = q.eq('board', board);
    if (cursor) q = q.gt('id', cursor);
    q = force
      ? q.is('en_verified', null).order('id')
      : q.or('title_en.is.null,content_en.is.null,excerpt_en.is.null').order('id');
    const { data: rows, count, error } = await q.limit(batch);
    if (error) return fail(error);
    remaining = count || 0;
    for (const p of rows || []) {
      last = Math.max(last, p.id);
      const fields: Record<string, string> = {};
      if (p.title_ko && (force || !p.title_en)) fields.title = p.title_ko;
      if (p.excerpt_ko && (force || !p.excerpt_en)) fields.excerpt = p.excerpt_ko;
      if (p.category && (force || !p.category_en)) fields.category = p.category;
      const wantContent = p.content_ko && (force || !p.content_en);
      const out = Object.keys(fields).length ? await translateKoToEn(fields) : {};
      // 본문은 길이 제한 없이 문단 단위로 나눠 번역한다 — 12,000자에서 잘려 저장되던 문제 수정
      const content = wantContent ? await translateLongContent(p.content_ko) : undefined;
      if (out === null || (wantContent && content === null)) { errors.push('post ' + p.id); continue; }
      // 번역이 비어 돌아온 항목은 비워 둔다 — 국문을 영문 칸에 복사하면 '번역된 것'처럼 보여 다시 번역되지 않는다(2026-09-25)
      const upd: any = { en_verified: force ? new Date().toISOString() : null };
      if (fields.title && out.title) upd.title_en = out.title;
      if (wantContent && content) upd.content_en = content;
      if (fields.excerpt && out.excerpt) upd.excerpt_en = out.excerpt;
      if (fields.category && out.category) upd.category_en = out.category;
      if (!force) {
        delete upd.en_verified;
        // 원문이 비어 있는 칸만 ''로 표시해 다음 조회에서 빠지게 한다
        if (!p.content_en && !(p.content_ko || '').trim()) upd.content_en = '';
        if (!p.excerpt_en && !(p.excerpt_ko || '').trim()) upd.excerpt_en = '';
        if (!Object.keys(upd).length) { errors.push('post ' + p.id + ': empty translation'); continue; }
      }
      const { error } = await sb.from('posts').update(upd).eq('id', p.id);
      if (error) errors.push('post ' + p.id + ': ' + error.message); else { done++; refreshPost({ board: p.board, id: p.id }); }
    }
    remaining = Math.max(0, remaining - done);
  } else if (target === 'faculty') {
    let q = sb.from('faculty').select('id,lab_ko,lab_en,research_ko,research_en,bio_ko,bio_en,name_en,name_ko', { count: 'exact' });
    if (cursor) q = q.gt('id', cursor);
    q = force ? q.is('en_verified', null).order('id') : q.or('lab_en.is.null,name_en.is.null').order('id');
    const { data: rows, count, error } = await q.limit(batch);
    if (error) return fail(error);
    remaining = count || 0;
    for (const f of rows || []) {
      last = Math.max(last, f.id);
      const fields: Record<string, string> = {};
      if (f.lab_ko && (force || !f.lab_en)) fields.lab = f.lab_ko;
      if (f.research_ko && (force || !f.research_en)) fields.research = f.research_ko;
      if (f.bio_ko && (force || !f.bio_en)) fields.bio = f.bio_ko;
      if (f.name_ko && !f.name_en) fields.name = f.name_ko;
      const out = Object.keys(fields).length ? await translateKoToEn(fields) : {};
      if (out === null) { errors.push('faculty ' + f.id); continue; }
      const upd: any = {};
      if (fields.lab) upd.lab_en = out.lab || f.lab_ko;
      if (fields.research) upd.research_en = out.research || f.research_ko;
      if (fields.bio) upd.bio_en = out.bio || f.bio_ko;
      if (fields.name) upd.name_en = out.name || f.name_ko;
      if (force) upd.en_verified = new Date().toISOString();
      if (!Object.keys(upd).length) upd.lab_en = f.lab_en || '';
      const { error } = await sb.from('faculty').update(upd).eq('id', f.id);
      if (error) errors.push('faculty ' + f.id); else { done++; refreshFaculty(f.id); }
    }
    remaining = Math.max(0, remaining - done);
  } else if (target === 'pages') {
    // content_ko가 없는 행은 번역할 것이 없는데도 매번 뽑혀 무한 반복되던 문제 — 국문 있는 행만 대상
    const { data: rows, count, error } = await sb.from('pages').select('slug,content_ko,content_en,title_ko,title_en', { count: 'exact' })
      .is('content_en', null).not('content_ko', 'is', null).limit(batch);
    if (error) return fail(error);
    remaining = count || 0;
    for (const p of rows || []) {
      // 국문이 빈 문자열인 행은 ''로 표시해 다음 조회에서 빠지게 한다(게시글과 같은 규칙 — 매번 뽑혀 끝나지 않던 것 방지)
      if (!(p.content_ko || '').trim()) { const { error } = await sb.from('pages').update({ content_en: '' }).eq('slug', p.slug); if (error) errors.push('page ' + p.slug); else done++; continue; }
      // 고정 페이지 본문도 교과과정처럼 길 수 있다 — 게시글과 같이 문단 단위로 나눠 번역(한 요청으로 보내면 잘려 null이 되던 문제, 2026-10-13)
      const out = p.title_ko ? await translateKoToEn({ title: p.title_ko }) : {};
      const content = await translateLongContent(p.content_ko || '');
      if (!content) { errors.push('page ' + p.slug); continue; }
      const { error } = await sb.from('pages').update({ content_en: content, title_en: p.title_en || out?.title || null }).eq('slug', p.slug);
      if (error) errors.push('page ' + p.slug); else { done++; refreshStaticPage(p.slug); }
    }
    remaining = Math.max(0, remaining - done);
  }
  return NextResponse.json({ done, remaining, errors, cursor: last, provider: translateProvider() });
}
