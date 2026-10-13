'use client';
import { useEffect, useState } from 'react';

const RETRY_KEY = 'sg-tr-retry-at';
const RETRY_WINDOW = 60 * 60e3;   // 브라우저당 1시간 1회 — 탭 중복만 막고 "저장 실패 → 관리자 재진입 때 보완" 약속은 유지(하루로 잡으면 03시 cron까지 기다려야 한다)

/** 관리자 화면에 들어오면(브라우저당 1시간 1회) 저장 때 번역기가 막혀 영문이 빠진 최근 글을 뒤에서 조용히 보완한다.
 *  채운 게 있을 때만 작은 안내를 띄운다. 매일 03시 cron과 같은 로직(lib/translate-backfill).
 *  2026-10-13: sessionStorage는 탭마다 따로라 글을 새 탭으로 여러 개 열면 탭 수만큼 최대 40초짜리 번역 요청과 refreshSite()가 돌았다 → localStorage 시각으로 바꿈(무료 한도). */
export default function TranslateRetry() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const stamp = (v: string | null) => { try { v === null ? localStorage.removeItem(RETRY_KEY) : localStorage.setItem(RETRY_KEY, v); } catch { /* 프라이빗 모드 등 — 막혀 있으면 그냥 한 번 시도 */ } };
    try { if (Date.now() - Number(localStorage.getItem(RETRY_KEY) || 0) < RETRY_WINDOW) return; } catch {}
    // 시각은 요청 전에 적어 동시에 열린 탭을 막고, 요청이 실패하면(네트워크·500) 지워서 한 번의 실패가 한 시간을 통째로 막지 않게 한다
    stamp(String(Date.now()));
    fetch('/api/admin/translate-missing', { method: 'POST' })
      .then((r) => { if (!r.ok) { stamp(null); return null; } return r.json(); })
      .then((r) => { if (r?.done) setMsg(`영문 번역이 빠져 있던 글 ${r.done}건을 자동으로 보완했습니다.`); })
      .catch(() => stamp(null));
  }, []);
  if (!msg) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border border-sg-line bg-white px-4 py-2.5 text-[13px] text-sg-gray11">
      <span>{msg}</span>
      <button onClick={() => setMsg(null)} className="text-sg-gray9 hover:text-sg-ink" aria-label="닫기">✕</button>
    </div>
  );
}
