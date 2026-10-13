import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SetLang from '@/components/SetLang';
import { isLocale, locales, T } from '@/lib/i18n';

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

/** 언어별 기본 제목·설명 — 영문 페이지는 영어로 (각 페이지는 lib/seo.ts pageMeta로 자기 제목·짝 주소를 더한다) */
export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const l = isLocale(params.locale) ? params.locale : 'ko';
  return {
    title: { default: T(l, 'siteTitle'), template: `%s | ${T(l, 'siteName')}` },
    description: T(l, 'siteDesc'),
    openGraph: { type: 'website', siteName: T(l, 'siteName'), locale: l === 'en' ? 'en_US' : 'ko_KR', title: T(l, 'siteTitle'), description: T(l, 'siteDesc') },
  };
}

export default async function LocaleLayout(props: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const { children } = props;
  if (!isLocale(params.locale)) notFound();
  return (
    <>
      <SetLang locale={params.locale} />
      <Header locale={params.locale} />
      <main className="min-h-screen">{children}</main>
      <Footer locale={params.locale} />
    </>
  );
}
