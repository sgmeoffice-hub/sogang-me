/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
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
