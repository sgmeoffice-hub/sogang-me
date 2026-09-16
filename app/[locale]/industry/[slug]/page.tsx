import StaticPage from '@/components/StaticPage';
import type { Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
export const revalidate = 3600;
export default function Industry({ params }: { params: { locale: Locale; slug: string } }) {
  if (!['samsung', 'lginnotek', 'lge', 'mobis'].includes(params.slug)) notFound();
  return <StaticPage locale={params.locale} section="industry" slug={params.slug} />;
}
