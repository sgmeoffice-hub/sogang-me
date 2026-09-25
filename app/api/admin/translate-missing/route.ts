import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { fillMissingTranslations } from '@/lib/translate-backfill';

export const maxDuration = 60;

/** 관리자 전용: 최근 60일 공개 글 중 영문이 빈 칸을 채운다. 관리자 화면(TranslateRetry)이 브라우저 세션당 한 번 조용히 호출한다.
 *  행정선생님이 따로 누를 것은 없다 — 관리자 화면에 들어오기만 하면 저장 때 막혔던 번역이 보완된다. */
export async function POST() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const r = await fillMissingTranslations(sb as any, { days: 60, limit: 4, budgetMs: 40_000 });
    if (r.done) revalidatePath('/', 'layout');
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
