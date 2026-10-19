import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/vault';
import { allow, clientIp } from '@/lib/ratelimit';

/** 조회수 집계: 방문자당 게시글 1회만 (클라이언트가 sessionStorage로 중복 호출 차단, 서버는 봇 UA 제외 + IP·글별 재호출 제한). */
export async function POST(req: Request) {
  const { id } = await req.json().catch(() => ({ id: 0 }));
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) return NextResponse.json({ ok: false }, { status: 400 });
  const ua = req.headers.get('user-agent') || '';
  if (/bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless/i.test(ua)) return NextResponse.json({ ok: true, skipped: 'bot' });
  if (!allow(`view:${clientIp(req)}:${postId}`, 1, 60 * 1000)) return NextResponse.json({ ok: true, skipped: 'dup' });
  // service role로 호출(2026-10-19): schema_v12가 increment_view의 anon·authenticated EXECUTE를 회수해, 브라우저에 배포된 anon 키로
  // REST를 직접 불러 조회수를 부풀리는 경로를 닫는다. 이 라우트의 봇 UA·IP 제한이 유일한 관문이 된다. 함수 자체는 published 글만 올린다(v9).
  await serviceClient().rpc('increment_view', { post_id: postId });
  return NextResponse.json({ ok: true });
}
