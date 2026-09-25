import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { translateKoToEn } from '@/lib/translate';

export const maxDuration = 60;
const BATCH = 4;

/** Admin-only: fills title_en / excerpt_en / content_en / category_en for posts that lack them. Call repeatedly until remaining = 0. */
export async function POST() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: rows, count } = await sb.from('posts').select('id,title_ko,title_en,excerpt_ko,excerpt_en,content_ko,content_en,category,category_en', { count: 'exact' })
    .or('title_en.is.null,content_en.is.null,excerpt_en.is.null,category_en.is.null').order('id').limit(BATCH);
  let done = 0; const errors: string[] = [];
  for (const p of rows || []) {
    const fields: Record<string, string> = {};
    if (!p.title_en && p.title_ko) fields.title = p.title_ko;
    if (!p.excerpt_en && p.excerpt_ko) fields.excerpt = p.excerpt_ko;
    if (!p.content_en && p.content_ko && p.content_ko.trim()) fields.content = p.content_ko.slice(0, 6000);
    if (!p.category_en && p.category) fields.category = p.category;
    const upd: any = {};
    if (Object.keys(fields).length) {
      const out = await translateKoToEn(fields);
      if (!out) { errors.push(`#${p.id}`); continue; }
      if (out.title) upd.title_en = out.title;
      if (out.excerpt) upd.excerpt_en = out.excerpt;
      if (out.content) upd.content_en = out.content;
      if (out.category) upd.category_en = out.category;
    }
    // 원문이 비어 있는 칸만 ''로 표시한다 — 번역 실패분에 국문을 복사하면 영문처럼 보여 다시 번역되지 않는다(2026-09-25)
    if (!p.title_en && !upd.title_en && !(p.title_ko || '').trim()) upd.title_en = '';
    if (!p.excerpt_en && !upd.excerpt_en && !(p.excerpt_ko || '').trim()) upd.excerpt_en = '';
    if (!p.content_en && !upd.content_en && !(p.content_ko || '').trim()) upd.content_en = '';
    if (!p.category_en && !upd.category_en && !(p.category || '').trim()) upd.category_en = '';
    if (!Object.keys(upd).length) { errors.push(`#${p.id} empty translation`); continue; }
    const { error } = await sb.from('posts').update(upd).eq('id', p.id);
    if (error) errors.push(`#${p.id} ${error.message}`); else done++;
  }
  const remaining = Math.max(0, (count || 0) - done);
  return NextResponse.json({ done, remaining, errors });
}
