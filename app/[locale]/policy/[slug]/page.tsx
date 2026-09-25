import { wrapTables } from '@/lib/html';
import PageHero from '@/components/PageHero';
import { staticPages } from '@/content';
import { T, type Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
const titles: Record<string, 'privacy' | 'emailPolicy' | 'terms'> = { privacy: 'privacy', email: 'emailPolicy', terms: 'terms' };
export default function Policy({ params }: { params: { locale: Locale; slug: string } }) {
  const c = staticPages[`policy/${params.slug}`]; if (!c) notFound();
  return (<>
    <PageHero locale={params.locale} section="" title={T(params.locale, titles[params.slug])} />
    <article className="container-site py-14 max-w-3xl prose-sg" dangerouslySetInnerHTML={{ __html: wrapTables(params.locale === 'en' ? c.en : c.ko) }} />
  </>);
}
