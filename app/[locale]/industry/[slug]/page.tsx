import StaticPage from '@/components/StaticPage';
import type { Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
export const revalidate = 3600;
export function generateStaticParams() { return []; }   // 선언해야 요청 시 만든 페이지가 캐시된다(ISR) — 없으면 매 요청 DB 조회(2026-09-25)
export default function Industry({ params }: { params: { locale: Locale; slug: string } }) {
  if (!['samsung', 'lginnotek', 'lge', 'mobis'].includes(params.slug)) notFound();
  return <StaticPage locale={params.locale} section="industry" slug={params.slug} />;
}
