import { notFound } from 'next/navigation';

/** 없는 주소(/ko/없는-페이지)도 사이트 머리글·바닥글 안에서 404를 보여 주도록 [locale] 아래로 받는다 (app/[locale]/not-found.tsx) */
// 한 번 그린 404를 캐시해 재사용한다 — 옛 홈페이지 파일 주소(/data/file/…)·취약점 탐색 봇이 같은 없는 주소를 반복해 두드릴 때마다
// 서버가 404 화면을 새로 그리던 것(함수 호출·CPU)을 없앤다. Vercel 무료(Hobby) 한도 대비(2026-10-12)
export const revalidate = 86400;
export function generateStaticParams() { return []; }
export default function CatchAll() { notFound(); }
