'use client';
import { useEffect, useState } from 'react';

/** 관리자 화면에 들어오면(브라우저 세션당 1회) 저장 때 번역기가 막혀 영문이 빠진 최근 글을 뒤에서 조용히 보완한다.
 *  채운 게 있을 때만 작은 안내를 띄운다. 매일 03시 cron과 같은 로직(lib/translate-backfill). */
export default function TranslateRetry() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    try { if (sessionStorage.getItem('sg-tr-retry')) return; sessionStorage.setItem('sg-tr-retry', '1'); } catch { /* 프라이빗 모드 등 */ }
    fetch('/api/admin/translate-missing', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => { if (r?.done) setMsg(`영문 번역이 빠져 있던 글 ${r.done}건을 자동으로 보완했습니다.`); })
      .catch(() => {});
  }, []);
  if (!msg) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border border-sg-line bg-white px-4 py-2.5 text-[13px] text-sg-gray11">
      <span>{msg}</span>
      <button onClick={() => setMsg(null)} className="text-sg-gray9 hover:text-sg-ink" aria-label="닫기">✕</button>
    </div>
  );
}
