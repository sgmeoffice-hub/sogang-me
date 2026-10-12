import type { Metadata } from 'next';
import { nav } from './nav';
import { T, type Locale } from './i18n';

/**
 * 검색엔진용 페이지 정보. 국문·영문 페이지가 각자 자기 언어의 제목·설명을 갖고, 서로를 짝(hreflang)으로 가리킨다.
 * (2026-10-12 책임자: 구글에서 영어로 검색해도 한글 제목으로 나옴 — 모든 페이지가 국문 제목·설명 하나를 같이 쓰고 있었다)
 */
const bare = (path: string) => (path === '/' ? '' : path);

/** 메뉴에 있는 주소면 메뉴 이름을 페이지 제목으로 쓴다 */
export function navLabel(l: Locale, href: string): string | undefined {
  for (const n of nav) for (const s of n.sub || []) if (s.href === href) return l === 'en' ? s.en : s.ko;
  return undefined;
}

/** 페이지 메타데이터 — 제목(뒤에 사이트 이름이 붙음)·설명·자기 주소(canonical)·국문/영문 짝 주소·공유 미리보기 */
export function pageMeta(l: Locale, path: string, opts: { title?: string; description?: string } = {}): Metadata {
  const p = bare(path);
  const description = opts.description || T(l, 'siteDesc');
  return {
    ...(opts.title ? { title: opts.title } : {}),
    description,
    alternates: {
      canonical: `/${l}${p}`,
      // x-default(언어를 정하지 않은 방문자): 홈은 접속 언어를 판별해 보내 주는 루트(/), 나머지는 국문
      languages: { ko: `/ko${p}`, en: `/en${p}`, 'x-default': p ? `/ko${p}` : '/' },
    },
    openGraph: {
      type: 'website', siteName: T(l, 'siteName'), locale: l === 'en' ? 'en_US' : 'ko_KR', url: `/${l}${p}`,
      title: opts.title ? `${opts.title} | ${T(l, 'siteName')}` : T(l, 'siteTitle'), description,
    },
  };
}

/** 본문 HTML → 검색 결과 설명용 한 줄 */
export function plainExcerpt(html: string, max = 150): string {
  const s = (html || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** 홈에 넣는 사이트 이름 정보(구글 검색 결과 위쪽 '사이트 이름'). 사이트 이름은 구글 규칙상 도메인당 하나라 국문·영문 홈이 같은 값을 쓴다 */
export function siteJsonLd() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://me.sogang.ac.kr';
  return {
    '@context': 'https://schema.org', '@type': 'WebSite', url: `${base}/`,
    name: '서강대학교 기계공학과',
    alternateName: ['Department of Mechanical Engineering, Sogang University', 'Sogang Mechanical Engineering'],
  };
}
