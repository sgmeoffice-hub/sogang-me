import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { r2Enabled, r2SignedGet } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/** 관리자 전용: 백업 파일을 5분짜리 서명 주소로 내려받는다(백업 버킷은 비공개). */
export async function GET(req: Request) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const key = new URL(req.url).searchParams.get('key') || '';
  if (!r2Enabled() || !/^db\/(daily|monthly)\/[\d-]+\.json\.gz$/.test(key)) return NextResponse.json({ error: 'bad key' }, { status: 400 });
  return NextResponse.redirect(await r2SignedGet(key), 302);
}
