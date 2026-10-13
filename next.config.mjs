/** @type {import('next').NextConfig} */
const nextConfig = {
  // 타입 검사를 빌드 관문에 포함한다(2026-10-13 전수 검사 — 그동안 ignoreBuildErrors로 tsc 오류가 배포를 막지 못했다). ESLint 설정은 없어 그대로 건너뛴다.
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,   // 'x-powered-by: Next.js' 노출 불필요(2026-10-13)
  /* Next 15부터 브라우저 쪽 라우터 캐시가 동적 페이지(게시판 목록·예약 달력·교수진 분야 필터처럼 ?조건을 읽는 페이지)를 기본 0초로 두어
   * 같은 페이지를 짧은 시간에 다시 열면 서버 함수를 다시 호출한다. Next 14과 같은 30초로 되돌려 Vercel 무료 한도(함수 호출 횟수)를 지킨다. */
  experimental: { staleTimes: { dynamic: 30 } },
  /* next/image는 일부러 쓰지 않는다(2026-10-13): 이미지는 R2·Supabase·public을 <img>로 그대로 서빙한다. Vercel 이미지 최적화는
   * 무료(Hobby) 한도가 월 5,000회 변환이라 게시글 4,800여 쪽에 쓰면 금세 넘는다. unoptimized로 /_next/image 엔드포인트 자체를 닫아 둔다.
   * 앞으로 next/image를 도입하려면 이 한도를 다시 따지고 R2 호스트를 remotePatterns에 넣어야 한다. */
  images: { unoptimized: true },
  async headers() {
    return [
      /* 기본 보안 헤더(2026-10-13). CSP는 넣지 않는다 — App Router의 인라인 하이드레이션 스크립트·inline style 때문에 'unsafe-inline'이
       * 필요해 XSS 방어 효과가 없고, nonce 방식은 /ko·/en 모든 요청에 미들웨어를 돌려야 해 함수 호출(무료 한도)을 늘린다. */
      { source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ] },
      /* 정적 자산은 브라우저가 매번 재검증(304)하지 않도록 장기 캐시 — Vercel 무료 한도는 요청 '횟수' 기준이라
       * 304 응답도 한 건으로 센다. (파일을 바꿀 때는 파일명을 바꿔서 배포한다)
       * /media: 사이트는 R2 사본(content/assets.ts siteMedia)을 보지만 public/media 원본도 그대로 서빙되므로 규칙은 둔다. */
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      // public/docs의 PDF(학회 소개 자료 등)는 max-age=0으로 열 때마다 재검증되던 것을 7일 캐시(2026-10-13)
      { source: '/docs/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
    ];
  },
};
export default nextConfig;
