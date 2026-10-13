import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { refreshSite } from '@/lib/refresh';

/** 관리자 전용: 사이트 전체 캐시(페이지·데이터)를 새로 고친다 — refreshSite()를 쓰는 유일한 곳(2026-10-13부터).
 *  관리자 화면에서 저장하면 관련 페이지만 자동 갱신되지만(lib/refresh.ts), DB를 REST로 한꺼번에 고친 경우(복원 스크립트 등)에는 저장 동작이 없어
 *  상세 페이지가 최대 1주 옛 내용으로 남는다 — 그때 한 번 호출한다. 전체를 비우면 크롤러가 4,800여 쪽을 다시 긁어 Vercel 무료 한도를 크게 쓰므로 꼭 필요할 때만. */
export async function POST() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  refreshSite();
  return NextResponse.json({ revalidated: true });
}
