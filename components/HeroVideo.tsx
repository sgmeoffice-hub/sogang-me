import Link from '@/components/Link';
import { T, t, type Locale, type UIKey } from '@/lib/i18n';
import { DesignEmblem, ThermalEmblem, ControlEmblem, ManufacturingEmblem } from './FieldEmblems';
import { areas } from '@/content/areas';
import HeroRotator from './HeroRotator';
import { fmtDate, type Post } from './PostCard';
import { boardTint } from '@/lib/board-colors';

const Em = [DesignEmblem, ThermalEmblem, ControlEmblem, ManufacturingEmblem];

/** 히어로 '최신 소식' 위젯 한 줄 — getHomeData의 latest 쿼리 select와 같은 필드 */
export type HeroNewsItem = Pick<Post, 'id' | 'board' | 'title_ko' | 'title_en' | 'created_at' | 'is_pinned'>;

/* 카드가 뜨는 브레이크포인트를 로케일로 나눈다.
   국문 태그라인(4.6rem, 실측 ≈550~630px)은 lg 왼쪽 컬럼 656px에 2줄 그대로 들어가지만,
   영문('behind everything that moves' ≈980px)은 lg에서 한 줄 더 꺾이므로 영문은 xl부터 카드를 띄운다. */
const BP = {
  ko: { wrap: 'lg:flex lg:items-end lg:gap-8 xl:gap-10', card: 'hidden lg:block lg:w-[272px] xl:w-[340px]', sheet: 'lg:hidden' },
  // 영문 xl(1280)은 카드 300px → 왼쪽 컬럼 876px(1440과 동일)이어야 'behind everything that moves'가 한 줄로 남는다(실측: 340px면 3줄로 늘어남)
  en: { wrap: 'xl:flex xl:items-end xl:gap-10', card: 'hidden xl:block xl:w-[300px] 2xl:w-[340px]', sheet: 'xl:hidden' },
} as const;

/* 3줄 목록 — 데스크톱 카드(aside)와 모바일 시트(details)가 공유한다.
   행에는 rise 애니메이션을 두지 않는다: 닫힌 <details> 안의 애니메이션은 열 때마다 새로 시작해 1초간 빈 화면이 된다. */
function HeroNewsRows({ locale, items }: { locale: Locale; items: HeroNewsItem[] }) {
  return (
    <ul className="divide-y divide-white/10">
      {items.map((p) => {
        const d = fmtDate(p.created_at); // 2026.09.22 (legacy 글 UTC 날짜 규칙은 fmtDate 주석 참조)
        return (
          <li key={p.id}>
            {/* prefetch={false}: 첫 화면에 보이는 링크라 홈 진입마다 글 5건 RSC 프리페치(엣지 요청 +3)가 나가는 것을 막는다 — 클릭 시 내비게이션은 그대로 */}
            <Link href={`/${locale}/board/${p.board}/${p.id}`} prefetch={false}
              className="group flex flex-col gap-1 px-4 py-2.5 transition-colors hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-white focus-visible:outline-offset-[-3px]">
              {/* 제목 먼저(스크린리더도 제목부터 읽음). 고정글 칩은 제목 앞 인라인 → "중요, 제목" 순.
                  `block`을 붙이면 line-clamp의 display:-webkit-box를 덮어써 말줄임이 풀리므로 넣지 않는다 */}
              <span className="text-[14px] font-semibold leading-snug text-white/90 break-keep line-clamp-2 group-hover:text-white">
                {p.is_pinned && <span className="mr-1.5 inline-block align-[2px] bg-sg-cardinal px-1.5 text-[10px] font-bold leading-[15px] text-white">{T(locale, 'pinned')}</span>}
                {t(p, 'title', locale)}
              </span>
              <span className="flex items-center gap-2 text-[11px] leading-none">
                {/* 게시판별 배경색으로 구분(lib/board-colors) — 테두리만 있던 칩이 서로 구분이 안 된다는 책임자 의견(9/25) */}
                <span className="min-w-0 truncate px-1.5 py-[3px] font-semibold tracking-[.04em] text-white" style={{ backgroundColor: boardTint(p.board) }}>{T(locale, p.board as UIKey) || p.board}</span>
                <time dateTime={d.replace(/\./g, '-')} className="ml-auto shrink-0 tabular-nums text-white/65">{d}</time>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** 히어로 '최신 소식' 위젯 — 서버 렌더·JS 0. 데스크톱: 텍스트 컬럼 오른쪽 유리 카드 / 모바일·태블릿: 버튼 아래 접힌 한 줄(details).
 *  둘 다 DOM에 들어가고 CSS로 한쪽만 보인다(display:none은 접근성 트리에서도 빠짐). 글이 0건이면 아무것도 그리지 않는다. */
function HeroNews({ locale, items, allHref }: { locale: Locale; items: HeroNewsItem[]; allHref: string }) {
  if (!items.length) return null;
  const bp = BP[locale];
  const head = <><span aria-hidden className="h-2 w-2 shrink-0 bg-sg-cardinal" />{T(locale, 'latestTitle')}</>;
  // '전체 소식' 링크: 같은 페이지 앵커(#news)는 순수 <a>로 — next/link로 감싸면 App Router 내비게이션이 돌아
  // 30초 뒤부터는 클릭마다 홈 RSC 페이로드를 다시 받는다(불필요한 요청). 다른 경로일 때만 Link(프리페치 없이).
  const AllLink = ({ className }: { className: string }) => allHref.startsWith('#')
    ? <a href={allHref} className={className}>{T(locale, 'latestAll')} →</a>
    : <Link href={allHref} prefetch={false} className={className}>{T(locale, 'latestAll')} →</Link>;
  return (
    <>
      {/* 데스크톱 카드: 오버레이가 가장 옅은 오른쪽(rgba .35)에 놓이므로 tint를 진하게(.70) + 블러. 블러 미지원은 단색 .85 */}
      <aside aria-labelledby="hero-news-h"
        className={`${bp.card} shrink-0 rise motion-reduce:!animate-none border border-white/15 bg-black/85 supports-[backdrop-filter]:bg-black/70 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_24px_60px_-24px_rgba(0,0,0,.7)]`}
        style={{ animationDelay: '.9s' }}>
        <div className="h-[3px] bg-sg-cardinal" />
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 pt-3.5 pb-2.5">
          <h2 id="hero-news-h" className="flex items-center gap-2 font-brand text-[1.15rem] leading-none">{head}</h2>
          <AllLink className="whitespace-nowrap text-[12px] font-semibold text-white/60 hover:text-white" />
        </div>
        <HeroNewsRows locale={locale} items={items} />
      </aside>

      {/* 모바일·태블릿 시트: 접힌 48px 한 줄(최신 1건 제목) → 탭하면 5건. 폰 GPU 부담을 피해 blur 없이 단색 */}
      {/* 처음부터 펼친 상태(open) — 책임자 요청(2026-09-22): 모바일에서도 전부 바로 보이게. 접기는 여전히 가능 */}
      <details open className={`${bp.sheet} group mt-6 max-w-2xl rise rise-4 motion-reduce:!animate-none border border-white/15 bg-black/75`}>
        <summary className="flex min-h-[48px] cursor-pointer select-none list-none items-center gap-3 px-4 text-[15px] focus-visible:outline-white focus-visible:outline-offset-[-3px] [&::-webkit-details-marker]:hidden">
          <span className="flex shrink-0 items-center gap-2 font-brand leading-none">{head}</span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-white/85 group-open:hidden">{t(items[0], 'title', locale)}</span>
          <span className="hidden min-w-0 flex-1 truncate text-[12.5px] text-white/60 group-open:block">{T(locale, 'latestSub')}</span>
          <svg aria-hidden className="ml-auto h-4 w-4 shrink-0 text-white/60 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        </summary>
        <div className="border-t border-white/10">
          <HeroNewsRows locale={locale} items={items} />
          <AllLink className="flex min-h-[44px] items-center border-t border-white/10 px-4 text-[12.5px] font-semibold text-white/70 hover:text-white" />
        </div>
      </details>
    </>
  );
}

export default function HeroVideo({ locale, videoUrl, poster, taglineKo, taglineEn, fieldVideos, news, newsHref }: { locale: Locale; videoUrl?: string; poster?: string; taglineKo?: string | null; taglineEn?: string | null; fieldVideos?: { src: string; poster: string }[]; news?: HeroNewsItem[]; newsHref?: string }) {
  const ko = locale === 'ko';
  const tagline = ko ? taglineKo : taglineEn;
  return (
    <section className="relative min-h-[100svh] bg-sg-ink text-white overflow-hidden pt-[80px]">
      {/* Background: 관리자가 지정한 영상 > 4개 분야 영상 순환 > 정적 이미지 순 */}
      <div className="absolute inset-0">
        {videoUrl ? (
          <video className="w-full h-full object-cover" autoPlay muted loop playsInline poster={poster} preload="metadata">
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : fieldVideos?.length ? (
          <HeroRotator videos={fieldVideos} />
        ) : (
          <img src={poster} alt="" className="w-full h-full object-cover kenburns" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,26,26,.82)_0%,rgba(139,30,36,.55)_45%,rgba(26,26,26,.35)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-sg-ink to-transparent" />
      </div>

      <div className="container-site relative flex flex-col justify-center min-h-[calc(100svh-80px)] py-16">
        {/* 텍스트 컬럼 + (lg/xl) 오른쪽 최신 소식 카드. 카드가 없으면 flex 자식이 하나라 현행과 같은 레이아웃 */}
        <div className={BP[locale].wrap}>
          <div className="min-w-0 flex-1">
            <p className="rise rise-1 text-[15px] md:text-[17px] font-semibold tracking-[0.12em] text-white/80">
              {ko ? 'SOGANG UNIVERSITY · 기계공학과' : 'SOGANG UNIVERSITY · MECHANICAL ENGINEERING'}
            </p>
            <h1 className="mt-5 max-w-4xl font-brand text-[2.6rem] sm:text-[3.6rem] lg:text-[4.6rem] leading-[1.12]">
              {tagline ? <span className="block rise rise-2">{tagline}</span> : (
                <><span className="block rise rise-2">{T(locale, 'hero1')}</span><span className="block rise rise-3">{T(locale, 'hero2')}</span></>
              )}
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] md:text-[19px] leading-relaxed text-white/85 rise rise-4">{T(locale, 'heroSub')}</p>
            <div className="mt-9 flex flex-wrap gap-3 rise rise-4">
              <Link href={`/${locale}/undergraduate/admission`} className="btn-primary">{T(locale, 'ugAdmission')}</Link>
              <Link href={`/${locale}/graduate/admission`} className="btn-light">{T(locale, 'gradAdmission')}</Link>
              <Link href={`/${locale}/faculty`} className="btn-light">{T(locale, 'professors')}</Link>
            </div>
          </div>
          <HeroNews locale={locale} items={news ?? []} allHref={newsHref ?? `/${locale}/board/notice`} />
        </div>

        {/* Four fields strip */}
        <div className="mt-14 md:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/15 border border-white/15 backdrop-blur-sm rise rise-4">
          {areas.map((a, i) => { const E = Em[i]; return (
            <Link key={a.id} href={`/${locale}/graduate/areas#${a.id}`} className="group bg-[rgba(26,26,26,0.4)] hover:bg-[rgba(175,39,47,0.8)] transition-colors p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <E className="w-[64px] h-[44px] md:w-[92px] md:h-[64px] shrink-0 text-white/90" />
              <div className="min-w-0">
                <p className="font-bold text-[15px] md:text-[17px] leading-tight break-keep">{ko ? a.ko : a.en}</p>
                {ko && <p className="mt-1 text-[12px] md:text-[12.5px] text-white/60 break-keep group-hover:text-white/85">{a.en}</p>}
              </div>
            </Link>
          ); })}
        </div>
      </div>
      <a href="#areas" className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 hover:text-white flex flex-col items-center gap-1 text-[11px] tracking-[.3em]">SCROLL<span className="floaty">↓</span></a>
    </section>
  );
}
