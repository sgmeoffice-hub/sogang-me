'use client';
import Link from '@/components/Link';
import { useRef, useState, useEffect } from 'react';
import { fmtDate, type Post } from './PostCard';
import { t, T, type Locale } from '@/lib/i18n';
import { coverFor } from '@/lib/placeholder';
import { youtubeThumb } from '@/lib/html';

function Arrow({ dir, onClick, disabled }: { dir: 'l' | 'r'; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={dir === 'l' ? 'previous' : 'next'}
      className="w-11 h-11 grid place-items-center border border-sg-line bg-white text-sg-ink hover:bg-sg-cardinal hover:border-sg-cardinal hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-sg-ink transition-colors">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{dir === 'l' ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}</svg>
    </button>
  );
}

/** 공지 전용 컴팩트 리스트 — 카드 없이 제목 한 줄 + 날짜로 많은 공지를 한눈에 보여준다. */
function NoticeList({ locale, board, posts }: { locale: Locale; board: 'notice' | 'academic'; posts: Post[] }) {
  const ko = locale === 'ko';
  const meta: Record<string, { t: [string, string]; s: [string, string] }> = {
    notice: { t: ['일반공지', 'General Notice'], s: ['장학·행사·시설 등 학과 생활 안내', 'Scholarships, events and facilities'] },
    academic: { t: ['학사공지', 'Academic Notice'], s: ['수강·교과목·졸업·학적 안내', 'Courses, graduation and records'] },
  };
  const m = meta[board];
  return (
    <div className="flex flex-col border border-sg-line bg-white">
      <div className="h-1.5 bg-sg-cardinal" />
      <div className="px-5 md:px-7 pt-5 md:pt-6 pb-4 flex items-end justify-between gap-3 border-b border-sg-line">
        <div>
          <h3 className="font-brand text-[1.5rem] md:text-[1.8rem] leading-none">{ko ? m.t[0] : m.t[1]}</h3>
          <p className="mt-2 text-[13.5px] text-sg-gray9 break-keep">{ko ? m.s[0] : m.s[1]}</p>
        </div>
        <Link href={`/${locale}/board/${board}`} className="shrink-0 inline-flex items-center gap-1 pb-0.5 text-[14px] font-semibold text-sg-gray11 hover:text-sg-cardinal whitespace-nowrap">{T(locale, 'more')} <span aria-hidden>+</span></Link>
      </div>
      {posts.length === 0 ? (
        <p className="flex-1 grid place-items-center py-14 text-[14px] text-sg-gray9">{T(locale, 'noPosts')}</p>
      ) : (
        <ul className="flex-1 px-2 md:px-3 py-2">
          {posts.slice(0, 8).map((p) => (
            <li key={p.id} className="border-b border-sg-mist last:border-0">
              <Link href={`/${locale}/board/${board}/${p.id}`} className="group flex items-center gap-3 px-3 md:px-4 py-[11px]">
                {p.is_pinned && <span className="shrink-0 text-[11px] font-bold text-white bg-sg-cardinal px-1.5 py-0.5">{ko ? '중요' : 'PIN'}</span>}
                <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-sg-ink group-hover:text-sg-cardinal transition-colors">{t(p, 'title', locale)}</span>
                <span className="shrink-0 text-[12.5px] text-sg-gray9 tabular-nums">{fmtDate(p.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ locale, board, posts, variant }: { locale: Locale; board: string; posts: Post[]; variant: 'text' | 'image' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ start: true, end: false });
  const ko = locale === 'ko';
  const update = () => { const el = ref.current; if (!el) return; setPos({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); const el = ref.current; el?.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); return () => { el?.removeEventListener('scroll', update); window.removeEventListener('resize', update); }; }, []);
  const step = (d: number) => { const el = ref.current; if (!el) return; const card = el.querySelector<HTMLElement>('[data-card]'); const w = card ? card.offsetWidth + 20 : 320; el.scrollBy({ left: d * w, behavior: 'smooth' }); };
  const titles: Record<string, [string, string]> = { research: ['연구성과', 'Research Highlights'], award: ['수상', 'Awards & Honors'], alumni_news: ['동문·구성원 소식', 'Alumni & Community'] };
  const subs: Record<string, [string, string]> = { research: ['논문·과제·연구 소식', 'Papers, projects and research news'], award: ['학생·교수 수상 소식', 'Student and faculty honors'], alumni_news: ['재학생·졸업생·교수진 소식', 'Students, alumni and faculty news'] };
  return (
    <div className="py-10 first:pt-0 border-b border-sg-line last:border-0">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h3 className="font-brand text-[1.7rem] md:text-[2.1rem] leading-none">{ko ? titles[board][0] : titles[board][1]}</h3>
          <p className="mt-2 text-[14px] text-sg-gray9">{ko ? subs[board][0] : subs[board][1]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/board/${board}`} className="hidden sm:inline-flex items-center gap-1 mr-2 text-[14px] font-semibold text-sg-gray11 hover:text-sg-cardinal">{T(locale, 'more')} <span aria-hidden>+</span></Link>
          <Arrow dir="l" onClick={() => step(-1)} disabled={pos.start} /><Arrow dir="r" onClick={() => step(1)} disabled={pos.end} />
        </div>
      </div>
      {posts.length === 0 ? <p className="py-10 text-center text-sg-gray9 border border-dashed border-sg-line">{T(locale, 'noPosts')}</p> : (
        <div ref={ref} className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
          {posts.map((p, i) => {
            const img = p.thumbnail_url || (p.images && p.images[0]?.url);
            const cover = img || youtubeThumb(p.video_url) || coverFor(board, t(p, 'title', locale), p.id);
            return (
              <Link key={p.id} data-card href={`/${locale}/board/${board}/${p.id}`} className="card group snap-start shrink-0 w-[78vw] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] flex flex-col overflow-hidden">
                {variant === 'image' ? (
                  <div className="aspect-[16/10] overflow-hidden bg-sg-mist"><img src={cover} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" /></div>
                ) : (
                  <div className="h-2 bg-sg-cardinal group-hover:bg-sg-deep" />
                )}
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  {p.is_pinned && <span className="self-start mb-2 text-[11px] font-bold text-white bg-sg-cardinal px-2 py-0.5">{ko ? '중요' : 'PINNED'}</span>}
                  <h4 className={`font-bold leading-snug group-hover:text-sg-cardinal transition-colors ${variant === 'text' ? 'text-[17px] line-clamp-3' : 'text-[16px] line-clamp-2'}`}>{t(p, 'title', locale)}</h4>
                  {variant === 'text' && t(p, 'excerpt', locale) && <p className="mt-3 text-[14px] leading-relaxed text-sg-gray11 line-clamp-3">{t(p, 'excerpt', locale)}</p>}
                  {variant === 'image' && t(p, 'excerpt', locale) && <p className="mt-2 text-[13.5px] leading-relaxed text-sg-gray11 line-clamp-2">{t(p, 'excerpt', locale)}</p>}
                  <div className="mt-auto pt-4 flex items-center justify-between text-[13px] text-sg-gray9">
                    <span>{fmtDate(p.created_at)}</span><span className="text-sg-cardinal font-semibold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {/* 캐러셀 끝: 전체 목록으로 이어지는 더보기 카드 */}
          <Link data-card href={`/${locale}/board/${board}`} className="card group snap-start shrink-0 w-[78vw] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] grid place-items-center min-h-[220px] border-dashed">
            <span className="text-center">
              <span className="block text-3xl text-sg-gray5 group-hover:text-sg-cardinal transition-colors">→</span>
              <span className="mt-2 block font-semibold text-[15px] text-sg-gray11 group-hover:text-sg-cardinal">{ko ? '전체 보기' : 'View all'}</span>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function NewsRows({ locale, groups }: { locale: Locale; groups: Record<string, Post[]> }) {
  return (
    <div>
      {/* 공지: 카드 대신 두 칼럼 제목 리스트 — 일반공지(왼쪽) / 학사공지(오른쪽) */}
      <div className="pb-10 border-b border-sg-line">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-stretch">
          <NoticeList locale={locale} board="notice" posts={groups.notice || []} />
          <NoticeList locale={locale} board="academic" posts={groups.academic || []} />
        </div>
      </div>
      <Row locale={locale} board="research" posts={groups.research || []} variant="image" />
      <Row locale={locale} board="award" posts={groups.award || []} variant="image" />
      <Row locale={locale} board="alumni_news" posts={groups.alumni_news || []} variant="image" />
    </div>
  );
}
