import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { translateKoToEn } from '@/lib/translate';

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json();
  const out = await translateKoToEn(body.fields || {});
  if (out === null) return NextResponse.json({ error: '번역 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 });
  return NextResponse.json({ fields: out });
}
