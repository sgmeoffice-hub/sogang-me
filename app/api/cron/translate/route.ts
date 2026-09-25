import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fillMissingTranslations } from '@/lib/translate-backfill';
import { allow } from '@/lib/ratelimit';
import { refreshSite } from '@/lib/refresh';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 영문 번역 자동 재시도 (Vercel Cron, 매일 03:00 KST — vercel.json). 로직은 lib/translate-backfill.
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
  try {
    const r = await fillMissingTranslations(sb, { days: 60, limit: 8, budgetMs: 45_000 });
    if (r.done) refreshSite();
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
