'use client';
import { useState } from 'react';
/** locale이 없으면 영문 보조 문구(이전 동작 유지) — 호출하는 페이지가 locale을 넘기면 국문 페이지에서 국문 aria-label·alt가 된다 */
export default function SlideDeck({ slides, download, label, locale }: { slides: string[]; download?: string; label?: string; locale?: 'ko' | 'en' }) {
  const [i, setI] = useState(0);
  const ko = locale === 'ko';
  const go = (d: number) => setI((i + d + slides.length) % slides.length);
  return (
    <div className="bg-sg-ink text-white p-3 md:p-4">
      <div className="relative aspect-[16/9] bg-black overflow-hidden">
        <img src={slides[i]} alt={ko ? `슬라이드 ${i + 1}` : `slide ${i + 1}`} className="absolute inset-0 w-full h-full object-contain" />
        <button onClick={() => go(-1)} aria-label={ko ? '이전 슬라이드' : 'previous slide'} className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center bg-black/50 hover:bg-sg-cardinal text-white text-xl">‹</button>
        <button onClick={() => go(1)} aria-label={ko ? '다음 슬라이드' : 'next slide'} className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center bg-black/50 hover:bg-sg-cardinal text-white text-xl">›</button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-[13px]">
        <span className="text-white/70">{label} · {i + 1} / {slides.length}</span>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">{slides.map((s, k) => <button key={k} onClick={() => setI(k)} aria-label={ko ? `${k + 1}번 슬라이드로` : `go to slide ${k + 1}`} className={`w-12 h-8 shrink-0 border ${k === i ? 'border-sg-cardinal' : 'border-white/20 opacity-60 hover:opacity-100'}`}><img src={s} alt="" className="w-full h-full object-cover" /></button>)}</div>
        {download && <a href={download} download className="shrink-0 btn-primary !py-2 !px-4 !text-[13px]">PDF ↓</a>}
      </div>
    </div>
  );
}
