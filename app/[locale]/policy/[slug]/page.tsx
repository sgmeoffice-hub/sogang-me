import { wrapTables } from '@/lib/html';
import { normalizeHtml } from '@/lib/html-normalize';
import PageHero from '@/components/PageHero';
import { staticPages } from '@/content';
import { T, type Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import { pageMeta } from '@/lib/seo';
export const revalidate = 86400; // 관리자 저장 때 즉시 갱신되므로 시간 기준 갱신은 하루(Vercel 무료 한도 절약, 2026-09-26)
export function generateStaticParams() { return []; }   // 선언해야 요청 시 만든 페이지가 캐시된다(ISR) — 없으면 매 요청 DB 조회(2026-09-25)
const titles: Record<string, 'privacy' | 'emailPolicy' | 'terms'> = { privacy: 'privacy', email: 'emailPolicy', terms: 'terms' };
export async function generateMetadata(props: { params: Promise<{ locale: Locale; slug: string }> }) {
  const params = await props.params;
  const k = titles[params.slug]; return pageMeta(params.locale, `/policy/${params.slug}`, { title: k ? T(params.locale, k) : undefined });
}
export default async function Policy(props: { params: Promise<{ locale: Locale; slug: string }> }) {
  const params = await props.params;
  const c = staticPages[`policy/${params.slug}`]; if (!c) notFound();
  return (<>
    <PageHero locale={params.locale} section="" title={T(params.locale, titles[params.slug])} />
    <article className="container-site py-14 max-w-3xl prose-sg" dangerouslySetInnerHTML={{ __html: wrapTables(normalizeHtml(params.locale === 'en' ? c.en : c.ko)) }} />
  </>);
}
