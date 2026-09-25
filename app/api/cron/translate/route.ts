import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { translateKoToEn, translateLongContent } from '@/lib/translate';
import { allow } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 영문 번역 자동 재시도 (Vercel Cron, 매일 03:00 KST — vercel.json).
 * 게시글 저장 때 번역기가 실패(무료 번역기 429 등)하면 영문 없이 저장되고 그대로 남던 문제(2026-09-25 발견)의 안전망.
 * 최근 60일 안의 공개 글 중 영문이 빈 칸만 채운다. 번역이 실패하면 칸을 비워 둔 채 다음 날 다시 시도한다(국문을 복사하지 않음).
 * 인증: CRON_SECRET 환경변수가 있으면 Vercel이 보내는 Bearer 토큰을 확인하고, 없으면 Vercel Cron 요청만 받는다. 호출 빈도도 제한.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? req.headers.get('authorization') === `Bearer ${secret}`
    : /vercel-cron/i.test(req.headers.get('user-agent') || '');
  if (!authorized) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!allow('cron-translate', 3, 10 * 60 * 1000)) return NextResponse.json({ error: 'too many requests' }, { status: 429 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const since = new Date(Date.now() - 60 * 86400 * 1000).toISOString();
  const { data: rows, error } = await sb.from('posts')
    .select('id,title_ko,title_en,excerpt_ko,excerpt_en,content_ko,content_en,category,category_en')
    .eq('published', true).gte('created_at', since)
    .or('title_en.is.null,excerpt_en.is.null,content_en.is.null')
    .order('created_at', { ascending: false }).limit(8);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const started = Date.now(); let done = 0; const failed: number[] = [];
  for (const p of rows || []) {
    if (Date.now() - started > 45_000) break; // maxDuration 안에서 끝낸다 — 남은 글은 다음 날
    const fields: Record<string, string> = {};
    if (!p.title_en && p.title_ko?.trim()) fields.title = p.title_ko;
    if (!p.excerpt_en && p.excerpt_ko?.trim()) fields.excerpt = p.excerpt_ko;
    if (!p.category_en && p.category?.trim()) fields.category = p.category;
    const wantContent = !p.content_en && !!p.content_ko?.trim();
    const out = Object.keys(fields).length ? await translateKoToEn(fields) : {};
    const content = wantContent ? await translateLongContent(p.content_ko) : null;
    const upd: Record<string, string> = {};
    if (out?.title) upd.title_en = out.title;
    if (out?.excerpt) upd.excerpt_en = out.excerpt;
    if (out?.category) upd.category_en = out.category;
    if (content) upd.content_en = content;
    if (!p.content_en && !p.content_ko?.trim()) upd.content_en = '';
    if (!p.excerpt_en && !p.excerpt_ko?.trim()) upd.excerpt_en = '';
    if (!Object.keys(upd).length) { failed.push(p.id); continue; }
    const { error: e } = await sb.from('posts').update(upd).eq('id', p.id);
    if (e) failed.push(p.id); else done++;
  }
  if (done) revalidatePath('/', 'layout');
  return NextResponse.json({ checked: rows?.length || 0, done, failed });
}
