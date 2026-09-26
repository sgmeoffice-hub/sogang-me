import NextLink from 'next/link';
import { forwardRef, type ComponentProps } from 'react';

/**
 * 사이트 공용 링크 — next/link와 같지만 미리 받아 오기(prefetch)를 기본으로 끈다.
 * next/link는 화면에 보이는 링크마다 그 페이지를 미리 요청하므로 홈 한 번 열 때도 요청이 수십 건 늘어난다.
 * Vercel 무료(Hobby) 한도(엣지 요청 월 100만 건) 안에서 운영하기 위함(2026-09-26). 클릭 시 이동은 그대로이고,
 * 페이지는 CDN에 캐시돼 있어 체감 속도 차이는 거의 없다. 꼭 필요한 곳만 prefetch를 명시해 켠다.
 */
const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function Link({ prefetch = false, ...props }, ref) {
  return <NextLink ref={ref} prefetch={prefetch} {...props} />;
});
export default Link;
