import PageHero from './PageHero';
import { staticPages } from '@/content';
import { getPage } from '@/lib/data';
import type { Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import { assets, siteMedia } from '@/content/assets';
import { toHtml } from '@/lib/html';
const pageImages: Record<string, string> = { 'about/intro': assets.mainVisual, 'about/goals': assets.entrance, 'undergraduate/ureca': assets.ureca, 'undergraduate/activities': assets.festival, 'graduate/admission': assets.research };
/** 산학 트랙 협력기업 로고 (채용연계 트랙 안내 목적의 공식 로고 표기) */
const industryLogos: Record<string, { img: string; ko: string; en: string }> = {
  samsung: { img: `${siteMedia}/logos/samsung.png`, ko: '삼성전자', en: 'Samsung Electronics' },
  lginnotek: { img: `${siteMedia}/logos/lginnotek.png`, ko: 'LG이노텍', en: 'LG Innotek' },
  lge: { img: `${siteMedia}/logos/lge.png`, ko: 'LG전자', en: 'LG Electronics' },
  mobis: { img: `${siteMedia}/logos/mobis.png`, ko: '현대모비스', en: 'Hyundai Mobis' },
};

/** Renders an editable static page: DB row (pages table) wins, otherwise built-in content. */
export default async function StaticPage({ locale, section, slug, children }: { locale: Locale; section: string; slug: string; children?: React.ReactNode }) {
  const key = `${section}/${slug}`;
  const builtin = staticPages[key];
  const db = await getPage(key);
  const html = locale === 'en' ? (db?.content_en || builtin?.en || db?.content_ko || builtin?.ko) : (db?.content_ko || builtin?.ko);
  if (!builtin && !db && !children) notFound();
  return (
    <>
      <PageHero locale={locale} section={section} current={slug} title={locale === 'en' ? db?.title_en || undefined : db?.title_ko || undefined} />
      <article className="container-site py-14 max-w-4xl">
        {section === 'industry' && industryLogos[slug] && (
          <div className="mb-10 border border-sg-line bg-white p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-7">
            <img src={industryLogos[slug].img} alt={locale === 'en' ? industryLogos[slug].en : industryLogos[slug].ko} className="h-12 md:h-16 w-auto max-w-[210px] object-contain shrink-0 self-start sm:self-center" />
            <div className="sm:border-l sm:border-sg-line sm:pl-7">
              <p className="eyebrow">{locale === 'en' ? 'Partner company' : '협력 기업'}</p>
              <p className="mt-1 font-bold text-[18px] break-keep">{locale === 'en' ? industryLogos[slug].en : industryLogos[slug].ko}</p>
            </div>
          </div>
        )}
        {pageImages[key] && !children && <img src={pageImages[key]} alt="" className="w-full aspect-[21/9] object-cover mb-10 border border-sg-line" />}
        {children}
        {html && <div className="prose-sg" dangerouslySetInnerHTML={{ __html: toHtml(html) }} />}
      </article>
    </>
  );
}
