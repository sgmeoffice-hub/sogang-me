'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { nav, label, isExternal } from '@/lib/nav';
import type { Locale } from '@/lib/i18n';

function Flag({ code }: { code: 'ko' | 'en' }) {
  if (code === 'ko') return (
    <svg viewBox="0 0 24 16" className="w-5 h-[14px] rounded-[2px] shadow-sm" aria-hidden>
      <rect width="24" height="16" fill="#fff" /><circle cx="12" cy="8" r="4" fill="#cd2e3a" />
      <path d="M8.2 6.4a4 4 0 0 0 7.6 3.2 2 2 0 0 1-3.8-1.6 2 2 0 0 0-3.8-1.6z" fill="#0047a0" />
      <g stroke="#000" strokeWidth=".8"><path d="M3.5 3.2l2-1.2M3 4l2-1.2M4 4.8l2-1.2M18.5 11.8l2 1.2M18 12.6l2 1.2M17.5 13.4l2 1.2M3.5 12.8l2 1.2M4 12l2 1.2M3 13.6l2 1.2M18.5 4.2l2-1.2M18 3.4l2-1.2M19 5l2-1.2" /></g>
    </svg>);
  return (
    <svg viewBox="0 0 24 16" className="w-5 h-[14px] rounded-[2px] shadow-sm" aria-hidden>
      <rect width="24" height="16" fill="#012169" /><path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="2.6" /><path d="M0 0l24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="4" /><path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="2" />
    </svg>);
}

export default function Header({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const other: Locale = locale === 'ko' ? 'en' : 'ko';
  // ?setlang=1: 미들웨어가 이 표시가 있을 때만 언어 선택을 쿠키로 기억한다.
  // 클릭 시점에 현재 쿼리(페이지·검색어 등)를 보존해 언어를 바꿔도 보던 목록이 유지되게 한다.
  // (useSearchParams는 SSG 페이지에서 Suspense 경계를 요구하므로 쓰지 않는다)
  const switchHref = pathname.replace(/^\/(ko|en)/, `/${other}`) + '?setlang=1';
  const switchLang = (e: React.MouseEvent) => {
    e.preventDefault();
    const q = new URLSearchParams(window.location.search);
    q.set('setlang', '1');
    window.location.href = pathname.replace(/^\/(ko|en)/, `/${other}`) + `?${q.toString()}`;
  };
  useEffect(() => { const f = () => setScrolled(window.scrollY > 10); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => { setOpen(false); setMega(false); }, [pathname]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 backdrop-blur-xl transition-[background-color,box-shadow] duration-300 ${scrolled || mega || open ? 'bg-white/90 shadow-[0_2px_20px_rgba(0,0,0,.08)]' : 'bg-white/85 supports-[backdrop-filter]:bg-white/60'}`} onMouseLeave={() => setMega(false)}>
      <div className="h-1 bg-sg-cardinal" />
      <div className="container-site h-[76px] flex items-center justify-between gap-6">
        <Logo locale={locale} />
        {/* 전체 메뉴는 1280px 이상에서만: 1024~1365px에서 메뉴가 넘쳐 오른쪽 BK21·언어 전환 버튼이 화면 밖으로 잘리던 문제(2026-09-25 전체 점검).
            1280~1439px은 메뉴 간격을 줄이고, 그보다 좁으면 햄버거 메뉴 */}
        <nav className="hidden xl:flex items-center h-full" aria-label="Main" onMouseEnter={() => setMega(true)}>
          {nav.map((item) => (
            <Link key={item.id} href={`/${locale}${item.href}`} className="relative px-3 min-[1440px]:px-[18px] h-full flex items-center text-[16.5px] font-semibold text-sg-ink hover:text-sg-cardinal after:absolute after:left-3 after:right-3 min-[1440px]:after:left-[18px] min-[1440px]:after:right-[18px] after:bottom-0 after:h-[3px] after:bg-sg-cardinal after:scale-x-0 after:origin-left after:transition-transform hover:after:scale-x-100">
              {label(item, locale)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {/* 옛 홈페이지 상단바에 있던 BK21 바로가기 — 공식 로고 원색, 버튼 틀은 언어 버튼과 동일 (모바일은 대학원과정 메뉴에서) */}
          <a href="http://bk21me.sogang.ac.kr" target="_blank" rel="noreferrer" title="BK21 교육연구팀 (BK21 FOUR)"
            className="hidden md:flex items-center px-3 py-2 border border-sg-line hover:border-sg-ink">
            <img src="/images/brand/bk21-four.png" alt="BK21 FOUR" width={44} height={20} style={{ width: 44, height: 20, maxWidth: 'none' }} />
          </a>
          {/* 일반 <a>여야 한다 — next/link로 두면 화면에 보이는 순간 /xx?setlang=1 을 프리페치하고, 미들웨어가 그것을 '언어 선택'으로 받아
              쿠키를 반대 언어로 바꿔 버린다(2026-09-24 발견: 한국어 페이지를 보기만 해도 다음 접속이 영어로 열리던 원인) */}
          <a href={switchHref} onClick={switchLang} className="flex items-center gap-2 px-3 py-2 border border-sg-line text-[13px] font-semibold text-sg-ink hover:border-sg-ink" aria-label={other === 'en' ? 'Switch to English' : '한국어로 전환'}>
            <Flag code={other} /> {other === 'en' ? 'ENG' : '한국어'}
          </a>
          <button onClick={() => setOpen(!open)} className="xl:hidden p-2 text-sg-ink" aria-label="Menu" aria-expanded={open}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 7h18M3 12h18M3 17h18" />}</svg>
          </button>
        </div>
      </div>
      {/* Mega menu (desktop) — all sub-menus at once, like the university site */}
      <div className={`hidden xl:block absolute inset-x-0 top-full bg-white/95 backdrop-blur-xl border-t border-sg-line overflow-hidden transition-[max-height,opacity] duration-300 ${mega ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="container-site grid grid-cols-7 gap-4 py-7">
          {nav.map((item) => (
            <div key={item.id}>
              <p className="font-bold text-[15px] text-sg-cardinal mb-3">{label(item, locale)}</p>
              <ul className="space-y-1.5">{item.sub?.map((s) => <li key={s.id}>{isExternal(s.href)
                ? <a href={s.href} target="_blank" rel="noreferrer" className="block text-[14px] text-sg-gray11 hover:text-sg-ink hover:underline underline-offset-4">{label(s, locale)} ↗</a>
                : <Link href={`/${locale}${s.href}`} className="block text-[14px] text-sg-gray11 hover:text-sg-ink hover:underline underline-offset-4">{label(s, locale)}</Link>}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      {open && (
        <div className="xl:hidden bg-white/95 backdrop-blur-xl border-t border-sg-line max-h-[calc(100vh-80px)] overflow-y-auto">
          {nav.map((item) => (
            <div key={item.id} className="border-b border-sg-line">
              <button className="w-full flex items-center justify-between px-5 py-4 text-left text-[16px] font-semibold" onClick={() => setMobile(mobile === item.id ? null : item.id)} aria-expanded={mobile === item.id}>
                {label(item, locale)}<span className={`text-sg-gray9 transition-transform ${mobile === item.id ? 'rotate-45' : ''}`}>+</span>
              </button>
              {mobile === item.id && item.sub && <ul className="bg-sg-mist pb-2">{item.sub.map((s) => <li key={s.id}>{isExternal(s.href)
                ? <a href={s.href} target="_blank" rel="noreferrer" className="block px-8 py-2.5 text-[15px]">{label(s, locale)} ↗</a>
                : <Link href={`/${locale}${s.href}`} className="block px-8 py-2.5 text-[15px]">{label(s, locale)}</Link>}</li>)}</ul>}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
