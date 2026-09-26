import Link from '@/components/Link';
import { nav, label, isExternal } from '@/lib/nav';
import { T, type Locale } from '@/lib/i18n';
import { sectionHero } from '@/content/assets';
import HeroDecor from './HeroDecor';
import TabScroll from './TabScroll';

export default function PageHero({ locale, section, current, title, image }: { locale: Locale; section: string; current?: string; title?: string; image?: string }) {
  const sec = nav.find((n) => n.id === section);
  const cur = sec?.sub?.find((s) => s.id === current);
  const heading = title || (cur ? label(cur, locale) : sec ? label(sec, locale) : '');
  const img = image || sectionHero[section] || sectionHero.default;
  return (
    <>
      <section className="relative bg-sg-ink text-white pt-[80px] overflow-hidden">
        <div className="absolute inset-0"><img src={img} alt="" className="w-full h-full object-cover kenburns" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,26,26,.85),rgba(139,30,36,.55)_60%,rgba(26,26,26,.3))]" /><HeroDecor /></div>
        <div className="container-site relative py-20 md:py-24">
          <p className="text-[14px] font-semibold tracking-[0.12em] text-white/75 uppercase">{sec ? label(sec, locale) : 'Sogang ME'}</p>
          <h1 className="h-display mt-3">{heading}</h1>
        </div>
      </section>
      <div className="border-b border-sg-line bg-white">
        <div className="container-site flex items-center gap-2 py-3 text-[14px] text-sg-gray9">
          <Link href={`/${locale}`} className="hover:text-sg-cardinal">{T(locale, 'home')}</Link>
          {sec && <><span>›</span><span>{label(sec, locale)}</span></>}
          {cur && <><span>›</span><span className="text-sg-ink font-semibold">{label(cur, locale)}</span></>}
        </div>
      </div>
      {sec?.sub && (
        <div className="border-b border-sg-line bg-white sticky top-[80px] z-30">
          <TabScroll className="container-site flex gap-1 overflow-x-auto no-scrollbar">
            {sec.sub.map((s) => isExternal(s.href) ? (
              <a key={s.id} href={s.href} target="_blank" rel="noreferrer" className="whitespace-nowrap px-4 py-3.5 text-[15px] border-b-[3px] -mb-px border-transparent text-sg-gray11 hover:text-sg-ink">{label(s, locale)} ↗</a>
            ) : (
              <Link key={s.id} href={`/${locale}${s.href}`} aria-current={s.id === current ? 'page' : undefined} className={`whitespace-nowrap px-4 py-3.5 text-[15px] border-b-[3px] -mb-px ${s.id === current ? 'border-sg-cardinal text-sg-cardinal font-bold' : 'border-transparent text-sg-gray11 hover:text-sg-ink'}`}>{label(s, locale)}</Link>
            ))}
          </TabScroll>
        </div>
      )}
    </>
  );
}
