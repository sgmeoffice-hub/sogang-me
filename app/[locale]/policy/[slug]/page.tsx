import { wrapTables } from '@/lib/html';
import PageHero from '@/components/PageHero';
import { staticPages } from '@/content';
import { T, type Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
export const revalidate = 3600;
export function generateStaticParams() { return []; }   // 선언해야 요청 시 만든 페이지가 캐시된다(ISR) — 없으면 매 요청 DB 조회(2026-09-25)
const titles: Record<string, 'privacy' | 'emailPolicy' | 'terms'> = { privacy: 'privacy', email: 'emailPolicy', terms: 'terms' };
export default function Policy({ params }: { params: { locale: Locale; slug: string } }) {
  const c = staticPages[`policy/${params.slug}`]; if (!c) notFound();
  return (<>
    <PageHero locale={params.locale} section="" title={T(params.locale, titles[params.slug])} />
    <article className="container-site py-14 max-w-3xl prose-sg" dangerouslySetInnerHTML={{ __html: wrapTables(params.locale === 'en' ? c.en : c.ko) }} />
  </>);
}
