import StaticPage from '@/components/StaticPage';
import type { Locale } from '@/lib/i18n';
import { notFound, redirect } from 'next/navigation';
export const revalidate = 86400; // 관리자 저장 때 즉시 갱신되므로 시간 기준 갱신은 하루(Vercel 무료 한도 절약, 2026-09-26)
export function generateStaticParams() { return []; }   // 선언해야 요청 시 만든 페이지가 캐시된다(ISR) — 없으면 매 요청 DB 조회(2026-09-25)
export default function Alumni({ params }: { params: { locale: Locale; slug: string } }) {
  if (params.slug === 'news') redirect(`/${params.locale}/board/alumni_news`);
  if (params.slug !== 'intro') notFound();
  return <StaticPage locale={params.locale} section="alumni" slug="intro" />;
}
