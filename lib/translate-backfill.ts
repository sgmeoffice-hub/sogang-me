import type { SupabaseClient } from '@supabase/supabase-js';
import { translateKoToEn, translateLongContent } from './translate';

/**
 * 영문이 빈 게시글을 채운다 — 저장 때 번역기가 막혀(429 등) 영문 없이 저장된 글의 자동 보완.
 * 호출하는 곳: ① Vercel Cron 매일 03:00 KST(/api/cron/translate) ② 관리자 화면 접속 시 브라우저마다 하루 1회(localStorage)(/api/admin/translate-missing).
 * 번역이 실패한 칸은 비워 둔 채 다음 기회에 다시 시도한다(국문을 영문 칸에 복사하지 않음).
 * 돌려주는 updated(id·board)로 호출하는 쪽이 그 글의 페이지만 갱신한다(lib/refresh.ts refreshPost) — 사이트 전체를 비우지 않는다(2026-10-13).
 */
export async function fillMissingTranslations(sb: SupabaseClient, opts: { days?: number; limit?: number; budgetMs?: number } = {}) {
  const { days = 60, limit = 6, budgetMs = 40_000 } = opts;
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
  // 후보를 넉넉히(limit×4) 뽑고 시작점을 시간마다 돌린다 — 최신순 limit건만 뽑으면 계속 실패하는 글 몇 건이 매번 자리를 차지해
  // 그 뒤의 글이 60일 창을 벗어날 때까지 차례를 못 받았다(2026-10-13). 상태를 저장하지 않고도 매 실행 다른 구간을 시도한다.
  const { data: rows, error, count } = await sb.from('posts')
    .select('id,board,title_ko,title_en,excerpt_ko,excerpt_en,content_ko,content_en,category,category_en', { count: 'exact' })
    .eq('published', true).gte('created_at', since)
    .or('title_en.is.null,excerpt_en.is.null,content_en.is.null')
    .order('created_at', { ascending: false }).limit(limit * 4);
  if (error) throw new Error(error.message);
  const pool = rows || [];
  const off = pool.length ? Math.floor(Date.now() / 3600e3) % pool.length : 0;
  const todo = [...pool.slice(off), ...pool.slice(0, off)].slice(0, limit);

  const started = Date.now(); let done = 0; const failed: number[] = []; const updated: { id: number; board: string }[] = [];
  for (const p of todo) {
    if (Date.now() - started > budgetMs) break;   // 시간 안에 못 한 글은 다음 기회에
    try {
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
      if (e) failed.push(p.id); else { done++; updated.push({ id: p.id, board: p.board }); }
    } catch (e: any) {   // 한 글이 예외를 던져도(Claude 모드 API 오류 등) 나머지 글과 이미 채운 결과는 살린다
      console.error('translate-backfill', p.id, e?.message); failed.push(p.id);
    }
  }
  // remaining: 아직 영문이 빈 글 수(이번에 채운 것 제외) — 예전에는 시간 부족으로 건너뛴 수만 세어 늘 0으로 보였다
  return { checked: todo.length, done, failed, remaining: Math.max(0, (count || 0) - done), updated };
}
