import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { adminBase } from '@/lib/admin';
import { boards } from '@/lib/nav';
import { ui } from '@/lib/i18n';
import { r2Enabled } from '@/lib/r2';
import { getBackupStatus } from '@/lib/backup';
import { serviceClient } from '@/lib/vault';

export default async function Dashboard() {
  const sb = createClient(); const b = adminBase();
  const counts = await Promise.all(boards.map(async (bd) => { const { count } = await sb.from('posts').select('id', { count: 'exact', head: true }).eq('board', bd); return [bd, count || 0] as const; }));
  const { count: pending } = await sb.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: fac } = await sb.from('faculty').select('id', { count: 'exact', head: true });
  const { count: ureca } = await sb.from('ureca_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  return (
    <div>
      <h1 className="text-2xl font-bold">대시보드</h1>
      <BackupAlert href={`${b}/backup`} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={`${b}/reservations`} className={`card p-5 ${pending ? 'border-sg-red' : ''}`}><p className="eyebrow">승인 대기 예약</p><p className="mt-2 font-mono text-3xl">{pending || 0}</p></Link>
        <Link href={`${b}/ureca`} className={`card p-5 ${ureca ? 'border-sg-red' : ''}`}><p className="eyebrow">URECA 지원 (검토 중)</p><p className="mt-2 font-mono text-3xl">{ureca || 0}</p></Link>
        <Link href={`${b}/faculty`} className="card p-5"><p className="eyebrow">교수진</p><p className="mt-2 font-mono text-3xl">{fac || 0}</p></Link>
        <Link href={`${b}/posts/new`} className="card p-5 !bg-sg-cardinal !border-sg-cardinal text-white"><p className="eyebrow !text-white/60">빠른 작업</p><p className="mt-2 font-semibold">+ 새 게시글 작성</p></Link>
      </div>
      <h2 className="mt-10 font-bold">게시판별 글 수</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">{counts.map(([bd, c]) => <Link key={bd} href={`${b}/posts?board=${bd}`} className="card p-4 flex justify-between"><span>{ui.ko[bd]}</span><span className="font-mono">{c}</span></Link>)}</div>
    </div>
  );
}

/** 자동 백업이 이틀 넘게 성공하지 못했거나 아직 설정 전이면 알린다 */
async function BackupAlert({ href }: { href: string }) {
  const st = await getBackupStatus(serviceClient()).catch(() => null);
  const enabled = r2Enabled();
  const stale = !st?.lastSuccessAt || Date.now() - Date.parse(st.lastSuccessAt) > 48 * 3600e3;
  if (enabled && !stale) return null;
  return (
    <Link href={href} className="mt-4 block border-l-4 border-sg-cardinal bg-white px-4 py-3 text-[13.5px] break-keep hover:bg-sg-mist">
      {enabled ? '⚠ 자동 백업이 이틀 넘게 성공하지 못했습니다. 백업·휴지통 화면에서 확인해 주세요.' : '자동 백업이 아직 꺼져 있습니다(R2 설정 필요). 휴지통·수정 이력은 동작 중입니다. →'}
    </Link>
  );
}
