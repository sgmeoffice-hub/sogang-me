import StaticPage from '@/components/StaticPage';
import type { Locale } from '@/lib/i18n';
import { notFound, redirect } from 'next/navigation';
export const revalidate = 3600;
export default function Alumni({ params }: { params: { locale: Locale; slug: string } }) {
  if (params.slug === 'news') redirect(`/${params.locale}/board/alumni_news`);
  if (params.slug !== 'intro') notFound();
  return <StaticPage locale={params.locale} section="alumni" slug="intro" />;
}
