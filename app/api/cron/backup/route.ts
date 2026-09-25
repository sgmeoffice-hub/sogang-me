import { NextResponse } from 'next/server';
import { runBackup } from '@/lib/backup';
import { serviceClient, purgeVault } from '@/lib/vault';
import { removeOwnMedia } from '@/lib/media';
import { allow } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;   // Vercel Pro 한도 안(첫 며칠은 옛 파일 사본 복사로 길어질 수 있음)

/** 매일 04:00 KST 자동 백업(vercel.json) + 휴지통(30일)·수정 이력(90일) 정리.
 *  인증은 번역 cron과 같다: CRON_SECRET이 있으면 Bearer 확인, 없으면 Vercel Cron 요청만. 호출 빈도 제한. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = secret ? req.headers.get('authorization') === `Bearer ${secret}` : /vercel-cron/i.test(req.headers.get('user-agent') || '');
  if (!authorized) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!allow('cron-backup', 2, 60 * 60 * 1000)) return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  const sb = serviceClient();
  const purged = await purgeVault(sb, (row) => removeOwnMedia(sb, row)).catch(() => ({ trash: 0, history: 0 }));
  const status = await runBackup(sb, 'cron');
  return NextResponse.json({ ...status, purged });
}
