'use client';
import { useEffect, useRef, useState } from 'react';

const INTERVAL_MS = 5500;

type HeroVideoItem = { src: string; poster: string; field?: string };

/** 분야별 그룹을 각각 섞은 뒤 라운드로빈으로 끼워 넣는다 — 같은 분야가 연속으로 나오지 않게. */
function interleavedOrder(videos: HeroVideoItem[]) {
  const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const groups = new Map<string, number[]>();
  videos.forEach((v, i) => { const k = v.field ?? String(i); if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(i); });
  const fields = shuffle([...groups.keys()]);
  const members = fields.map((f) => shuffle(groups.get(f)!));
  const out: number[] = [];
  const rounds = Math.max(...members.map((m) => m.length));
  for (let r = 0; r < rounds; r++) for (const m of members) if (m[r] !== undefined) out.push(m[r]);
  return out;
}

/** 홈 히어로 배경: 분야 영상들을 랜덤(분야 교차) 순서로 5초 남짓 간격 크로스페이드 순환.
 *  아래 CSS 전용 포스터 슬라이드쇼가 항상 깔려 있어, JS 하이드레이션 실패·자동재생 차단 등
 *  어떤 환경에서도 최소한 정지 화면에 갇히지는 않는다.
 *
 *  트래픽 주의(2026-09-16 Vercel 무료 한도 초과로 사이트가 멈춘 원인 중 하나):
 *  예전엔 직전·현재·다음 3개만 마운트하고 5.5초마다 <video>를 갈아끼웠는데, 갈아끼울 때마다 영상·포스터 요청이
 *  다시 나가서 홈 탭 하나가 열려 있는 동안 계속 요청이 쌓였다. 지금은 영상 요소를 한 번만 만들고(preload="none")
 *  차례가 온 것만 재생한다 — 한 영상은 한 탭에서 딱 한 번만 내려받는다. 영상 파일 자체도 Vercel이 아닌 R2에서 온다. */
export default function HeroRotator({ videos }: { videos: HeroVideoItem[] }) {
  const [order, setOrder] = useState<number[] | null>(null);
  const [pos, setPos] = useState(0);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const loaded = useRef<Set<number>>(new Set());

  useEffect(() => {
    // 순서 셔플은 클라이언트에서만 (SSR 마크업 불일치 방지)
    setOrder(interleavedOrder(videos));
  }, [videos.length]);

  useEffect(() => {
    if (!order || order.length < 2) return;
    const t = setInterval(() => setPos((p) => p + 1), INTERVAL_MS);
    return () => clearInterval(t);
  }, [order]);

  const n = order?.length || 0;
  const active = order ? order[pos % n] : -1;
  const nextIdx = order ? order[(pos + 1) % n] : -1;

  // 현재 것은 재생, 다음 것은 미리 불러오기(첫 1회만), 나머지는 정지. 요소는 절대 갈아끼우지 않는다.
  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        if (!loaded.current.has(i)) { loaded.current.add(i); v.preload = 'auto'; v.load(); }
        try { v.currentTime = 0; } catch {}
        v.play().catch(() => {});
      } else {
        if (i === nextIdx && !loaded.current.has(i)) { loaded.current.add(i); v.preload = 'auto'; v.load(); }
        if (!v.paused) v.pause();
      }
    });
  }, [active, nextIdx]);

  const cycle = videos.length * 5.5;
  return (
    <div className="absolute inset-0">
      {/* CSS 전용 포스터 슬라이드쇼 (JS 없이도 분야 교차로 순환) */}
      {videos.map((v, i) => (
        <img key={v.poster} src={v.poster} alt="" className="hero-fade absolute inset-0 w-full h-full object-cover"
          style={{ animationDuration: `${cycle}s`, animationDelay: `${i * 5.5 - cycle}s` }} />
      ))}
      {/* JS가 살아 있으면 영상 레이어가 위에서 재생·순환 — 모든 요소를 한 번만 마운트, 차례가 올 때만 로드 */}
      {order && videos.map((v, i) => (
        <video key={v.src} ref={(el) => { refs.current[i] = el; }} src={v.src} poster={v.poster} muted playsInline loop preload="none"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${i === active ? 'opacity-100' : 'opacity-0'}`} />
      ))}
    </div>
  );
}
