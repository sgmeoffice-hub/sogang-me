import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fillMissingTranslations } from '@/lib/translate-backfill';
import { allow } from '@/lib/ratelimit';
import { refreshPost } from '@/lib/refresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 영문 번역 자동 재시도 (Vercel Cron, 매일 03:00 KST — vercel.json). 로직은 lib/translate-backfill.
 * 인증: CRON_SECRET 환경변수(Vercel이 보내는 Bearer 토큰) 필수 — 없으면 503. 호출 빈도도 제한.
 */
export async function GET(req: Request) {
  // CRON_SECRET 필수(2026-10-13): 없으면 503으로 설정 누락을 드러내고, Bearer 불일치면 401. 예전의 User-Agent(vercel-cron) 허용은
  // 누구나 흉내 낼 수 있어 300초 백업·번역 실행을 외부에서 반복 호출할 수 있었다(Vercel 무료 한도). Vercel Cron은 이 헤더를 자동으로 보낸다.
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not set' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!allow('cron-translate', 3, 10 * 60 * 1000)) return NextResponse.json({ error: 'too many requests' }, { status: 429 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const r = await fillMissingTranslations(sb, { days: 60, limit: 8, budgetMs: 45_000 });
    for (const p of r.updated) refreshPost({ board: p.board, id: p.id });   // 채운 글만 갱신 — 매일 사이트 전체를 비우지 않는다(Vercel 무료 한도, 2026-10-13)
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
