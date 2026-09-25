import Link from 'next/link';

/** [locale] 안의 404 — 머리글·바닥글(해당 언어)이 함께 보인다. not-found에는 params가 없어 본문은 두 언어로 적는다. */
export default function LocaleNotFound() {
  return (
    <div className="container-site pt-[160px] pb-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-display mt-3 break-keep">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-[18px] font-semibold text-sg-gray11">Page not found</p>
      <p className="mt-4 text-sg-steel break-keep">주소가 바뀌었거나 삭제된 페이지입니다. · The page may have been moved or removed.</p>
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        <Link href="/ko" className="btn-primary justify-center">홈으로</Link>
        <Link href="/en" className="btn-ghost justify-center">English home</Link>
        <Link href="/ko/board/notice" className="btn-ghost justify-center">학과 공지</Link>
      </div>
    </div>
  );
}
