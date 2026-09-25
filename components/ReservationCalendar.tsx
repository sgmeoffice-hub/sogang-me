import Link from 'next/link';
import { monthRange } from '@/lib/reservation';

export type CalRow = { id: number; date: string; start_time: string; end_time: string; user_name: string; status: string; purpose?: string | null };

/** 시설별 월간 달력 — 공개 예약 현황과 관리자 화면이 같이 쓴다.
 *  itemHref를 주면 각 예약을 클릭할 수 있게(관리자 수정) 렌더링한다. */
export default function ReservationCalendar({ y, m, rows, ko, title, prevHref, nextHref, itemHref, todayStr }: {
  y: number; m: number; rows: CalRow[]; ko: boolean; title: string; prevHref: string; nextHref: string;
  itemHref?: (r: CalRow) => string; todayStr: string;
}) {
  const { days } = monthRange(y, m);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const byDay: Record<number, CalRow[]> = {};
  rows.forEach((r) => { const d = Number(r.date.slice(8, 10)); (byDay[d] ||= []).push(r); });
  const dow = ko ? ['일', '월', '화', '수', '목', '금', '토'] : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const pendingLabel = ko ? '승인 대기' : 'pending';
  return (
    <div className="border border-sg-line bg-white">
      <div className="flex items-center justify-between px-4 py-3 bg-sg-ink text-white">
        <Link href={prevHref} className="font-mono px-2 hover:text-sg-red" aria-label="prev">‹</Link>
        <p className="font-semibold">{title}</p>
        <Link href={nextHref} className="font-mono px-2 hover:text-sg-red" aria-label="next">›</Link>
      </div>
      <div className="grid grid-cols-7 bg-sg-mist border-b border-sg-line">{dow.map((d, i) => <div key={d} className={`py-2 text-center font-mono text-[11px] tracking-wider ${i === 0 ? 'text-sg-red' : i === 6 ? 'text-blue-700' : 'text-sg-steel'}`}>{d}</div>)}</div>
      <div className="grid grid-cols-7 auto-rows-[minmax(88px,auto)]">
        {/* 커스텀 색상 토큰은 /N 투명도 수식이 동작하지 않아 인라인 rgba 사용 */}
        {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} className="border-b border-r border-sg-line" style={{ backgroundColor: 'rgba(26,26,26,.03)' }} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          return (
            <div key={d} className={`border-b border-r border-sg-line p-1.5 ${ds === todayStr ? 'bg-[rgba(175,39,47,0.05)]' : ''}`}>
              <span className={`font-mono text-[12px] ${(first + d - 1) % 7 === 0 ? 'text-sg-red' : ''}`}>{d}</span>
              <ul className="mt-1 space-y-1">{(byDay[d] || []).map((r) => {
                const cls = `block text-[11px] leading-tight px-1 py-0.5 border-l-2 break-keep ${r.status === 'approved' ? 'border-sg-red bg-white' : 'border-dashed border-sg-cardinal bg-sg-mist text-sg-gray11'} ${itemHref ? 'hover:bg-sg-mist hover:text-sg-cardinal cursor-pointer' : ''}`;
                const body = <><span className="font-mono">{r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}</span> {r.user_name}{r.status !== 'approved' && ` (${pendingLabel})`}</>;
                return <li key={r.id} title={r.purpose || ''}>{itemHref ? <Link href={itemHref(r)} className={cls}>{body}</Link> : <span className={cls}>{body}</span>}</li>;
              })}</ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
