import type { MetadataRoute } from 'next';

/** 검색엔진(구글·빙·네이버·다음 등)은 허용하되, 학습 데이터 수집용 AI 크롤러는 차단한다 —
 *  이들이 4,700여 페이지를 반복 수집하면 Vercel 무료 한도(월 요청 100만 건)를 갉아먹는다. */
const AI_BOTS = ['GPTBot', 'ChatGPT-User', 'CCBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web', 'Bytespider', 'Amazonbot', 'PetalBot', 'meta-externalagent', 'Applebot-Extended', 'Google-Extended', 'Diffbot', 'ImagesiftBot', 'omgili', 'cohere-ai', 'PerplexityBot', 'YouBot', 'AI2Bot', 'Timpibot', 'DataForSeoBot', 'SemrushBot', 'AhrefsBot', 'MJ12bot', 'DotBot'];

export default function robots(): MetadataRoute.Robots {
  // '/*?': 물음표가 붙은 주소(게시판 쪽 번호·검색, 예약 달력 월 이동, 교수진 분야 필터, 언어 전환)는 요청마다 서버가 새로 그리는
  // 동적 페이지이고 예약 달력은 끝없이 이어지므로 크롤러가 긁지 않게 막는다. 게시글은 사이트맵으로 수집되어 검색 노출에는 영향 없음.
  // '/_next/'는 ?dpl=이 붙는 스크립트라 구글 렌더링용으로 허용(더 긴 규칙이 우선). (2026-10-12, Vercel 무료 한도 대비)
  const disallow = ['/admin', `/${process.env.ADMIN_PATH || 'adm'}`, '/api', '/*?'];
  return {
    rules: [
      { userAgent: '*', allow: ['/', '/_next/'], disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, disallow: ['/'] })),
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://me.sogang.ac.kr'}/sitemap.xml`,
  };
}
