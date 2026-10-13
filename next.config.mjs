/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  /* Next 15부터 브라우저 쪽 라우터 캐시가 동적 페이지(게시판 목록·예약 달력·교수진 분야 필터처럼 ?조건을 읽는 페이지)를 기본 0초로 두어
   * 같은 페이지를 짧은 시간에 다시 열면 서버 함수를 다시 호출한다. Next 14과 같은 30초로 되돌려 Vercel 무료 한도(함수 호출 횟수)를 지킨다. */
  experimental: { staleTimes: { dynamic: 30 } },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'me.sogang.ac.kr' },
    ],
  },
  /* 정적 자산은 브라우저가 매번 재검증(304)하지 않도록 장기 캐시 — Vercel 무료 한도는 요청 '횟수' 기준이라
   * 304 응답도 한 건으로 센다. (파일을 바꿀 때는 파일명을 바꿔서 배포한다) */
  async headers() {
    return [
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
    ];
  },
};
export default nextConfig;
