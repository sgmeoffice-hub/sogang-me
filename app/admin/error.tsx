'use client';
import { useEffect } from 'react';

/** 관리자 화면의 오류 경계 — 서버 액션·DB 오류가 나면 사이트 전체의 빈 'Application error' 화면 대신 관리자 레이아웃(사이드바) 안에서 안내한다(2026-10-13).
 *  운영 환경에서는 Next.js가 서버 오류 메시지를 가리고 digest만 넘기므로 일반 안내 + 조회용 digest를 보여 준다(개발 중에는 메시지도).
 *  입력 검증처럼 예상되는 안내는 각 액션이 ?note=로 화면에 돌려보낸다(app/admin/actions.ts) — 여기는 예상 밖 오류의 안전망이다. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="max-w-xl">
      <p className="eyebrow">오류</p>
      <h1 className="mt-2 text-2xl font-bold break-keep">처리 중 오류가 났습니다</h1>
      <p className="mt-3 text-[14px] text-sg-gray11 break-keep">저장되지 않았을 수 있습니다. 뒤로 가서 입력 내용을 확인한 뒤 다시 시도해 주세요. 같은 오류가 반복되면 개발 담당에게 아래 코드를 함께 알려 주세요.</p>
      {error.digest && <p className="mt-2 font-mono text-[12px] text-sg-steel break-all">digest: {error.digest}</p>}
      {process.env.NODE_ENV !== 'production' && error.message && <pre className="mt-2 whitespace-pre-wrap break-all bg-white border border-sg-line p-3 text-[12px]">{error.message}</pre>}
      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={() => reset()} className="btn-primary">다시 시도</button>
        <button type="button" onClick={() => history.back()} className="btn-ghost bg-white">뒤로 가기</button>
      </div>
    </div>
  );
}
