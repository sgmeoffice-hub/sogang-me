import { notFound } from 'next/navigation';

/** 없는 주소(/ko/없는-페이지)도 사이트 머리글·바닥글 안에서 404를 보여 주도록 [locale] 아래로 받는다 (app/[locale]/not-found.tsx) */
export default function CatchAll() { notFound(); }
