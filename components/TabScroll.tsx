'use client';
import { useEffect, useRef } from 'react';

/** 가로로 넘치는 하위 메뉴 탭 줄에서 현재 탭이 보이도록 처음에 한 번 스크롤한다
 *  (영문·모바일에서 뒤쪽 탭, 예: Facility Reservation 이 선택돼 있어도 화면 밖에 잘려 보이던 문제 — 2026-09-25 전체 점검) */
export default function TabScroll({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; const a = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !a || el.scrollWidth <= el.clientWidth) return;
    const left = a.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
    el.scrollLeft = Math.max(0, left - (el.clientWidth - a.offsetWidth) / 2);
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
