import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { refreshSite } from '@/lib/refresh';

/** 관리자 전용: 사이트 전체 캐시(페이지·데이터)를 새로 고친다.
 *  관리자 화면에서 저장하면 자동으로 갱신되지만, DB를 한꺼번에 고친 경우(영문 백필 등)에는 저장 동작이 없어
 *  상세 페이지가 최대 1시간 옛 내용으로 남는다 — 그때 한 번 호출한다. */
export async function POST() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  refreshSite();
  return NextResponse.json({ revalidated: true });
}
