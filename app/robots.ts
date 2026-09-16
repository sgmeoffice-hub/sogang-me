import type { MetadataRoute } from 'next';

/** 검색엔진(구글·빙·네이버·다음 등)은 허용하되, 학습 데이터 수집용 AI 크롤러는 차단한다 —
 *  이들이 4,700여 페이지를 반복 수집하면 Vercel 무료 한도(월 요청 100만 건)를 갉아먹는다. */
const AI_BOTS = ['GPTBot', 'ChatGPT-User', 'CCBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web', 'Bytespider', 'Amazonbot', 'PetalBot', 'meta-externalagent', 'Applebot-Extended', 'Google-Extended', 'Diffbot', 'ImagesiftBot', 'omgili', 'cohere-ai', 'PerplexityBot', 'YouBot', 'AI2Bot', 'Timpibot', 'DataForSeoBot', 'SemrushBot', 'AhrefsBot', 'MJ12bot', 'DotBot'];

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/admin', `/${process.env.ADMIN_PATH || 'adm'}`, '/api'];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, disallow: ['/'] })),
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://me.sogang.ac.kr'}/sitemap.xml`,
  };
}
