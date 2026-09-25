import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import LoginForm from '@/components/admin/LoginForm';
import { signOut } from './actions';
import { adminBase } from '@/lib/admin';
import TranslateRetry from '@/components/admin/TranslateRetry';

export const dynamic = 'force-dynamic';
export const metadata = { title: '관리자 · 서강대학교 기계공학과', robots: { index: false, follow: false } };


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <LoginForm />;
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) return (
    <main className="min-h-screen grid place-items-center px-6 text-center">
      <div><p className="eyebrow">403</p><h1 className="text-2xl font-bold mt-2">관리자 권한이 없습니다</h1>
        <p className="mt-2 text-sg-steel text-[14px]">{user.email} 은(는) admins 테이블에 등록되어 있지 않습니다.</p>
        <form action={signOut} className="mt-6"><button className="btn-ghost">로그아웃</button></form></div>
    </main>
  );
  const b = adminBase();
  const menu = [['', '대시보드'], ['/posts', '게시판'], ['/faculty', '교수진'], ['/pages', '페이지'], ['/reservations', '시설 예약'], ['/ureca', 'URECA 지원'], ['/banners', '배너'], ['/settings', '메인·설정']];
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="bg-sg-ink text-white p-5 lg:min-h-screen">
        <p className="font-mono text-[11px] tracking-widest text-white/50">SOGANG ME</p>
        <p className="font-bold text-lg">관리자</p>
        <nav className="mt-6 flex lg:flex-col gap-1 overflow-x-auto">
          {menu.map(([h, t]) => <Link key={h} href={`${b}${h}`} className="px-3 py-2 text-[14px] whitespace-nowrap hover:bg-white/10">{t}</Link>)}
        </nav>
        <div className="mt-8 text-[12px] text-white/50 break-all">{user.email}</div>
        <form action={signOut}><button className="mt-2 text-[12px] underline text-white/70">로그아웃</button></form>
        <Link href="/ko" className="mt-6 block text-[12px] text-white/70 underline">사이트 보기 →</Link>
      </aside>
      <main className="p-6 lg:p-10 bg-sg-mist min-w-0"><TranslateRetry />{children}</main>
    </div>
  );
}
