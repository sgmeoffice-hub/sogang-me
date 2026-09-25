import type { SupabaseClient } from '@supabase/supabase-js';
import { translateKoToEn, translateLongContent } from './translate';

/**
 * 영문이 빈 게시글을 채운다 — 저장 때 번역기가 막혀(429 등) 영문 없이 저장된 글의 자동 보완.
 * 호출하는 곳: ① Vercel Cron 매일 03:00 KST(/api/cron/translate) ② 관리자 화면 접속 시 브라우저 세션당 1회(/api/admin/translate-missing).
 * 번역이 실패한 칸은 비워 둔 채 다음 기회에 다시 시도한다(국문을 영문 칸에 복사하지 않음).
 */
export async function fillMissingTranslations(sb: SupabaseClient, opts: { days?: number; limit?: number; budgetMs?: number } = {}) {
  const { days = 60, limit = 6, budgetMs = 40_000 } = opts;
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
  const { data: rows, error } = await sb.from('posts')
    .select('id,title_ko,title_en,excerpt_ko,excerpt_en,content_ko,content_en,category,category_en')
    .eq('published', true).gte('created_at', since)
    .or('title_en.is.null,excerpt_en.is.null,content_en.is.null')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);

  const started = Date.now(); let done = 0; const failed: number[] = []; let remaining = 0;
  for (const p of rows || []) {
    if (Date.now() - started > budgetMs) { remaining++; continue; }   // 시간 안에 못 한 글은 다음 기회에
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
    if (!p.content_en && !p.content_ko?.trim()) upd.content_en = '';   // 원문이 빈 칸만 ''로 표시
    if (!p.excerpt_en && !p.excerpt_ko?.trim()) upd.excerpt_en = '';
    if (!Object.keys(upd).length) { failed.push(p.id); continue; }
    const { error: e } = await sb.from('posts').update(upd).eq('id', p.id);
    if (e) failed.push(p.id); else done++;
  }
  return { checked: rows?.length || 0, done, failed, remaining };
}
