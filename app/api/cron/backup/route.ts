import { NextResponse } from 'next/server';
import { runBackup } from '@/lib/backup';
import { serviceClient, purgeVault } from '@/lib/vault';
import { removeOwnMedia, trashFileUrls, otherTrashUrls } from '@/lib/media';
import { allow } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;   // Fluid compute라 Hobby도 최대 300초. 옛 파일 사본(9/26 완료) 뒤로는 보통 1분 안팎

/** 매일 04:00 KST 자동 백업(vercel.json) + 휴지통(30일)·수정 이력(90일) 정리.
 *  인증은 번역 cron과 같다: CRON_SECRET Bearer 필수(없으면 503). 호출 빈도 제한. */
export async function GET(req: Request) {
  // CRON_SECRET 필수(2026-10-13): 없으면 503, Bearer 불일치면 401. User-Agent(vercel-cron) 허용은 흉내 낼 수 있어 제거 — 번역 cron과 같다.
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not set' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!allow('cron-backup', 2, 60 * 60 * 1000)) return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  const sb = serviceClient();
  // 휴지통의 다른 글이 쓰는 파일 주소를 한 번만 훑는다(lib/media trashFileUrls) — 수동 영구 삭제(actions.ts purgePost)와 같은 검사(2026-10-13).
  // 휴지통 조회가 실패하면 파일은 지우지 않고 기록만 정리한다(복구 불가능한 쪽으로 틀리지 않게)
  const trashUrls = await trashFileUrls(sb).catch(() => null);
  const purged = await purgeVault(sb, (row) => trashUrls ? removeOwnMedia(sb, row, otherTrashUrls(trashUrls, Number(row?.id))) : Promise.resolve(0)).catch(() => ({ trash: 0, history: 0 }));
  const status = await runBackup(sb, 'cron');
  return NextResponse.json({ ...status, purged });
}
