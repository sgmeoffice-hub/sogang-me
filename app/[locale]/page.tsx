import Link from 'next/link';
import HeroVideo from '@/components/HeroVideo';
import NewsRows from '@/components/NewsRows';
import Reveal from '@/components/Reveal';
import { emblemOf } from '@/components/FieldEmblems';
import { getHomeData, getLabCount } from '@/lib/data';
import { T, t, type Locale } from '@/lib/i18n';
import { areas } from '@/content/areas';
import { assets, heroFieldVideos } from '@/content/assets';
import { youtubeThumb } from '@/lib/html';

export const revalidate = 3600; // 관리자 저장 시 즉시 갱신되므로 길게(10분 → 1시간, 2026-09-25 전송량 절감)

export default async function Home({ params }: { params: { locale: Locale } }) {
  const l = params.locale; const ko = l === 'ko';
  const [{ groups, gallery, banners, settings, promo, videos, latest }, labCount] = await Promise.all([getHomeData(), getLabCount()]);
  const sections: string[] = settings.sections || ['hero', 'promo', 'intro', 'news', 'videos', 'programs', 'quicklinks', 'gallery'];
  const on = (s: string) => sections.includes(s);

  const programs = [
    { k: 'ug', d: 'ugDesc', href: '/undergraduate/admission', img: assets.entrance, tagKo: '학부', tagEn: 'Undergraduate' },
    { k: 'grad', d: 'gradDesc', href: '/graduate/admission', img: assets.mainVisual, tagKo: '대학원', tagEn: 'Graduate', extra: ko ? `, ${labCount}개 연구실` : `, ${labCount} labs` },
    { k: 'ureca', d: 'urecaDesc', href: '/undergraduate/ureca', img: assets.ureca, tagKo: '학부연구', tagEn: 'Research' },
    { k: 'industry', d: 'industryDesc', href: '/industry/samsung', img: assets.industry, tagKo: '산학협력', tagEn: 'Industry' },
  ] as const;
  const quick = [
    { k: 'seminar', href: '/reservation?f=seminar', icon: 'M4 6h16v10H4zM8 20h8' }, { k: 'meeting', href: '/reservation?f=meeting', icon: 'M3 8h18v8H3zM7 12h10' },
    { k: 'drafting', href: '/reservation?f=drafting', icon: 'M4 20L20 4M4 4l4 4M12 12l4 4' }, { k: 'server', href: '/reservation?f=server1', icon: 'M4 5h16v5H4zM4 14h16v5H4zM7 7.5h.01M7 16.5h.01' },
    { k: 'scholarship', href: '/board/scholarship', icon: 'M12 3l9 5-9 5-9-5 9-5zM5 12v4c0 2 3 4 7 4s7-2 7-4v-4' }, { k: 'gallery', href: '/board/gallery', icon: 'M4 5h16v14H4zM8 15l3-3 3 3 2-2 2 2' },
  ] as const;

  return (
    <>
      {on('hero') && <HeroVideo locale={l} videoUrl={settings.hero_video_url ?? undefined} fieldVideos={heroFieldVideos} poster={settings.hero_poster_url ?? assets.mainVisual} taglineKo={settings.tagline_ko} taglineEn={settings.tagline_en} news={latest} newsHref={on('news') ? '#news' : `/${l}/board/notice`} />}

      {on('promo') && promo.length > 0 && (
        <section className="container-site -mt-14 relative z-10">
          <div className="grid gap-4 md:grid-cols-2">
            {promo.map((p: any, i: number) => { const file = (p.attachments || [])[0]; return (
              <Reveal key={p.id} delay={i * 80} className="h-full">
                <div className="card h-full flex overflow-hidden bg-white border-t-4 border-t-sg-cardinal shadow-[0_18px_40px_-16px_rgba(26,26,26,.28)]">
                  {/* 표지는 비율이 제각각인 PDF 커버라 자르지 않고(contain) 통째로 보여주고, 빈 공간은 표지를 흐린 배경으로 채운다 */}
                  <Link href={`/${l}/board/promo/${p.id}`} className="relative w-[34%] md:w-[36%] shrink-0 self-stretch overflow-hidden grid place-items-center p-2 md:p-3" style={{ backgroundColor: 'rgba(26,26,26,.9)' }}>
                    <img src={p.thumbnail_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-lg scale-125 opacity-50" />
                    <img src={p.thumbnail_url} alt="" className="relative max-w-full max-h-[240px] md:max-h-[280px] object-contain shadow-[0_10px_28px_rgba(0,0,0,.45)]" />
                  </Link>
                  <div className="p-4 md:p-6 flex flex-col min-w-0">
                    <p className="eyebrow">{ko ? '전공 홍보자료' : 'Intro materials'}</p>
                    <h3 className="mt-1 text-[16px] md:text-[19px] font-bold leading-snug break-keep"><Link href={`/${l}/board/promo/${p.id}`} className="hover:text-sg-cardinal">{t(p, 'title', l)}</Link></h3>
                    <p className="mt-2 text-[13px] md:text-[13.5px] text-sg-gray11 leading-relaxed line-clamp-3 break-keep">{t(p, 'excerpt', l)}</p>
                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                      <Link href={`/${l}/board/promo/${p.id}`} className="btn-ghost !py-1.5 !px-3 !text-[13px]">{ko ? '자료 보기' : 'View'}</Link>
                      {file && <a href={file.url} download className="btn-primary !py-1.5 !px-3 !text-[13px]">PDF ↓</a>}
                    </div>
                  </div>
                </div>
              </Reveal>
            ); })}
          </div>
        </section>
      )}

      {banners.length > 0 && (
        <section className="container-site -mt-10 relative z-10 grid gap-4 md:grid-cols-3">
          {banners.slice(0, 3).map((b: any) => (
            <a key={b.id} href={b.link || '#'} className="card p-5 flex items-center gap-4">
              {b.image_url && <img src={b.image_url} alt="" className="w-16 h-16 object-cover" />}
              <div><p className="font-bold text-[16px]">{t(b, 'title', l)}</p><p className="text-[14px] text-sg-gray9">{t(b, 'subtitle', l)}</p></div>
            </a>
          ))}
        </section>
      )}

      {on('intro') && (
        <section id="areas" className="container-site pt-24 pb-10">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">{T(l, 'areasTitle')}</p>
            <h2 className="h-section mt-3">{ko ? '기계공학의 네 기둥, 그 위에서 만나는 융합' : 'Four pillars of mechanical engineering, converging'}</h2>
            <p className="mt-4 text-[17px] text-sg-gray11 leading-relaxed">{ko ? '설계·재료역학, 열·유체·에너지, 제어·진동·로보틱스, 생산공학. 기초 분야의 깊이 위에 바이오·에너지·모빌리티·마이크로나노 융합 연구가 자랍니다.' : 'Depth in four foundations grows into convergence research in bio, energy, mobility and micro/nano systems.'}</p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 items-stretch">
            {areas.map((a, i) => { const E = emblemOf[a.id]; return (
              <Reveal key={a.id} delay={i * 90} className="h-full">
                <Link href={`/${l}/graduate/areas#${a.id}`} className="group relative flex h-full min-h-[300px] sm:min-h-[340px] flex-col overflow-hidden bg-sg-ink text-white p-6 sm:p-8 md:p-10">
                  <div className="absolute inset-0 opacity-90" style={{ background: `linear-gradient(135deg, ${a.color} 0%, #1a1a1a 85%)` }} />
                  <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
                  <div className="absolute right-2 bottom-2 w-[190px] opacity-30 sm:opacity-90 sm:right-4 sm:w-[260px] md:w-[320px] transition-transform duration-700 group-hover:scale-105"><E className="w-full h-auto text-white" /></div>
                  <div className="relative max-w-full sm:max-w-[60%]">
                    <p className="text-[13px] font-semibold tracking-[0.12em] text-white/70 uppercase">{ko ? a.en : ''}</p>
                    <h3 className="mt-2 font-brand text-[1.6rem] sm:text-[1.9rem] md:text-[2.3rem] leading-tight break-keep">{ko ? a.ko : a.en}</h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-white/85">{ko ? a.descKo : a.descEn}</p>
                    <ul className="mt-5 flex flex-wrap gap-2">{(ko ? a.keywordsKo : a.keywordsEn).map((k) => <li key={k} className="text-[12.5px] px-2.5 py-1 bg-white/[.12] border border-white/20 rounded-full">{k}</li>)}</ul>
                    <span className="mt-auto pt-6 inline-flex items-center gap-2 text-[14px] font-semibold">{ko ? '연구실 보기' : 'Explore labs'} <span className="transition-transform group-hover:translate-x-1">→</span></span>
                  </div>
                </Link>
              </Reveal>
            ); })}
          </div>
        </section>
      )}

      {on('news') && (
        <section id="news" className="container-site py-20 scroll-mt-24">
          <Reveal className="mb-12"><p className="eyebrow">{T(l, 'newsTitle')}</p><h2 className="h-section mt-3">{ko ? '기계공학과 소식' : 'News from the department'}</h2></Reveal>
          <NewsRows locale={l} groups={groups} />
        </section>
      )}

      {on('videos') && videos.length > 0 && (
        <section className="bg-sg-ink text-white py-20">
          <div className="container-site">
            <Reveal className="flex items-end justify-between gap-4 mb-8">
              <div><p className="eyebrow !text-white/70">{ko ? '기계공학도가 봐야 할 영상' : 'Videos for ME students'}</p><h2 className="h-section mt-3">{ko ? '영상으로 만나는 기계공학' : 'Mechanical engineering on screen'}</h2></div>
              <Link href={`/${l}/board/videos`} className="text-[14px] font-semibold text-white/70 hover:text-white whitespace-nowrap">{T(l, 'more')} +</Link>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {videos.map((v: any, i: number) => (
                <Reveal key={v.id} delay={i * 70}>
                  <Link href={`/${l}/board/videos/${v.id}`} className="group block">
                    <div className="relative aspect-video overflow-hidden bg-white/5"><img src={youtubeThumb(v.video_url) || v.thumbnail_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /><span className="absolute inset-0 grid place-items-center"><span className="w-12 h-12 rounded-full bg-[rgba(175,39,47,0.9)] grid place-items-center text-white pl-1">▶</span></span></div>
                    <p className="mt-3 text-[12px] font-semibold text-white/60">{ko ? v.category : v.category_en || v.category}</p>
                    <h3 className="mt-1 font-bold text-[15px] leading-snug group-hover:text-sg-cardinal line-clamp-2">{t(v, 'title', l)}</h3>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {on('programs') && (
        <section className="bg-sg-mist py-24">
          <div className="container-site">
            <Reveal className="mb-10"><p className="eyebrow">{T(l, 'programsTitle')}</p><h2 className="h-section mt-3">{ko ? '학부에서 대학원, 그리고 산업 현장까지' : 'From undergraduate to graduate to industry'}</h2></Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {programs.map((p, i) => (
                <Reveal key={p.k} delay={i * 80}>
                  <Link href={`/${l}${p.href}`} className="group relative block aspect-[3/4] overflow-hidden bg-sg-ink text-white">
                    <img src={p.img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-sg-ink via-[rgba(26,26,26,0.4)] to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="text-[12.5px] font-semibold tracking-[0.12em] text-white/70 uppercase">{ko ? p.tagKo : p.tagEn}</p>
                      <h3 className="mt-1 font-brand text-[1.8rem] leading-tight">{T(l, p.k)}</h3>
                      <p className="mt-2 text-[14px] text-white/80 leading-relaxed">{T(l, p.d)}{(p as any).extra || ''}</p>
                      <span className="mt-4 inline-flex w-10 h-10 items-center justify-center bg-sg-cardinal group-hover:bg-white group-hover:text-sg-cardinal transition-colors">→</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {on('quicklinks') && (
        <section className="container-site py-20">
          <Reveal className="mb-8 flex items-end justify-between gap-4"><div><p className="eyebrow">{T(l, 'quick')}</p><h2 className="h-section mt-3">{ko ? '자주 찾는 메뉴' : 'Quick links'}</h2></div></Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quick.map((q, i) => (
              <Reveal key={q.k} delay={i * 60}>
                <Link href={`/${l}${q.href}`} className="card group block p-6 text-center hover:border-sg-cardinal">
                  <span className="mx-auto w-16 h-16 grid place-items-center rounded-full bg-sg-mist text-sg-cardinal group-hover:bg-sg-cardinal group-hover:text-white transition-colors">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={q.icon} /></svg>
                  </span>
                  <p className="mt-4 font-bold text-[15.5px]">{T(l, q.k)}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {on('gallery') && gallery.length > 0 && (
        <section className="bg-sg-ink text-white py-24">
          <div className="container-site">
            <div className="flex items-end justify-between mb-10">
              <div><p className="eyebrow !text-white/70">{T(l, 'galleryTitle')}</p><h2 className="h-section mt-3">{ko ? '학과의 순간들' : 'Moments'}</h2></div>
              <Link href={`/${l}/board/gallery`} className="text-[14px] font-semibold text-white/70 hover:text-white">{T(l, 'more')} +</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gallery.slice(0, 8).map((g: any, i: number) => (
                <Link key={g.id} href={`/${l}/board/gallery/${g.id}`} className={`group relative overflow-hidden bg-white/5 ${i === 0 ? 'col-span-2 row-span-2' : ''} aspect-square`}>
                  <img src={g.thumbnail_url || g.images?.[0]?.url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="absolute left-3 bottom-3 right-3 text-[13.5px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{t(g, 'title', l)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
