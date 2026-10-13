'use client';
import { useRef, useState } from 'react';
import { facilities } from '@/lib/nav';
import { START_SLOTS, END_SLOTS } from '@/lib/reservation';
import type { Locale } from '@/lib/i18n';

const todayStr = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
/** 중복 확인 쿼리에 영향을 주는 칸만 — 이름·연락처·목적 입력(한 글자마다 change 이벤트)에는 API를 부르지 않는다 (2026-10-13 무료 한도: 신청 1건에 함수 호출 30~50회 → 3회 안팎) */
const CHECK_FIELDS = new Set(['facility', 'date', 'start_time', 'end_time']);

/** 서버의 오류 코드(app/api/reservations)를 보는 언어로 — 모르는 코드는 서버 문구를 그대로 쓴다 */
function errorText(code: string | undefined, fallback: string | undefined, ko: boolean, conflicts: string) {
  const m: Record<string, [string, string]> = {
    rate_limited: ['요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.', 'Too many requests. Please try again in a few minutes.'],
    missing: ['필수 항목이 비어 있습니다.', 'Please fill in all required fields.'],
    invalid: ['입력값이 올바르지 않습니다. 다시 확인해 주세요.', 'Some of the entered values are invalid. Please check and try again.'],
    not_half_hour: ['시간은 30분 단위로만 예약할 수 있습니다.', 'Times must be on the half hour (30-minute steps).'],
    end_before_start: ['종료 시간이 시작 시간보다 늦어야 합니다.', 'End time must be after start time.'],
    past_date: ['지난 날짜는 예약할 수 없습니다.', 'Past dates cannot be booked.'],
    overlap: [`이미 예약된 시간과 겹칩니다${conflicts ? ` — ${conflicts}` : ''}. 다른 시간을 선택해 주세요.`, `Conflicts with an existing booking${conflicts ? ` — ${conflicts}` : ''}. Please choose another time.`],
    race: ['방금 같은 시간에 다른 신청이 접수되었습니다. 다른 시간을 선택해 주세요.', 'Another request for the same time was just received. Please choose another time.'],
    db: ['저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'Could not save your request. Please try again later.'],
  };
  const pair = code && m[code];
  return pair ? pair[ko ? 0 : 1] : fallback || (ko ? '오류가 발생했습니다. 다시 시도해 주세요.' : 'Something went wrong. Please try again.');
}

export default function ReservationForm({ locale, facility, date }: { locale: Locale; facility: string; date?: string }) {
  const ko = locale === 'ko';
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [warn, setWarn] = useState('');
  const lastKey = useRef('');   // 마지막으로 확인한 시설|날짜|시작|종료 — 같은 조합은 다시 묻지 않는다
  const seq = useRef(0);        // 요청 순번 — 늦게 도착한 옛 응답이 최신 경고를 덮어쓰지 않게
  const conflictList = (conflicts: any[]) => conflicts.map((c: any) => `${c.start_time.slice(0, 5)}~${c.end_time.slice(0, 5)} ${c.user_name}${c.status === 'pending' ? (ko ? ' (승인 대기)' : ' (pending)') : ''}`).join(', ');

  /** 시간을 고르는 즉시 중복 여부를 알려줍니다 (제출 전 경고). */
  async function check(form: HTMLFormElement) {
    const f = new FormData(form); const g = (k: string) => String(f.get(k) || '');
    if (!g('date') || !g('start_time') || !g('end_time')) { lastKey.current = ''; return setWarn(''); }
    // 검증 경고로 빠질 때는 메모를 비운다 — 안 그러면 직전에 조회한 조합으로 되돌렸을 때 44행 메모에 걸려 경고가 안 지워진다
    if (g('date') < todayStr()) { lastKey.current = ''; return setWarn(ko ? '지난 날짜는 예약할 수 없습니다.' : 'Past dates cannot be booked.'); }
    if (g('start_time') >= g('end_time')) { lastKey.current = ''; return setWarn(ko ? '종료 시간이 시작 시간보다 늦어야 합니다.' : 'End time must be after start time.'); }
    const key = [g('facility'), g('date'), g('start_time'), g('end_time')].join('|');
    if (key === lastKey.current) return;
    lastKey.current = key;
    const my = ++seq.current;
    try {
      const r = await fetch(`/api/reservations?facility=${g('facility')}&date=${g('date')}&start=${g('start_time')}&end=${g('end_time')}`);
      const j = await r.json();
      if (my !== seq.current) return;
      if (j.conflicts?.length) setWarn(ko ? `⚠ 이미 예약된 시간과 겹칩니다 — ${conflictList(j.conflicts)}` : `⚠ Conflicts with an existing booking — ${conflictList(j.conflicts)}`);
      else setWarn('');
    } catch {
      // 일시 장애면 경고를 지우고 제출은 막지 않는다 — 겹침은 제출 때 서버가 다시 검사한다
      if (my === seq.current) { lastKey.current = ''; setWarn(''); }
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState('saving'); setMsg('');
    const row = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    try {
      const r = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(errorText(j.code, j.error, ko, Array.isArray(j.conflicts) ? conflictList(j.conflicts) : '')); setState('error'); } else setState('done');
    } catch {
      // 네트워크 오류·게이트웨이 시간 초과 — 버튼이 '…'에 갇히지 않게 상태를 되돌린다
      setMsg(ko ? '네트워크 오류로 전송하지 못했습니다. 다시 시도해 주세요.' : 'Network error — please try again.'); setState('error');
    }
  }

  if (state === 'done') return <div className="border-l-4 border-sg-cardinal bg-sg-mist p-6"><p className="font-bold text-[17px]">{ko ? '예약 신청이 접수되었습니다.' : 'Your request has been received.'}</p><p className="text-[14.5px] text-sg-gray11 mt-1 break-keep">{ko ? '신청하신 시간이 캘린더에 「승인 대기」로 바로 표시되며, 학과사무실 확인 후 확정됩니다. (02-705-8631)' : 'Your slot now appears on the calendar as “pending” and will be confirmed by the department office. (+82-2-705-8631)'}</p></div>;

  return (
    <form onSubmit={submit} onChange={(e) => { if (CHECK_FIELDS.has((e.target as unknown as HTMLInputElement).name)) check(e.currentTarget); }} className="grid gap-4 sm:grid-cols-2 border border-sg-line p-6 bg-white">
      <label className="text-[13px]"><span className="eyebrow">{ko ? '시설' : 'Facility'}</span><select name="facility" defaultValue={facility} className="input mt-1">{facilities.map((f) => <option key={f.id} value={f.id}>{ko ? f.ko : f.en}</option>)}</select></label>
      <label className="text-[13px]"><span className="eyebrow">{ko ? '날짜' : 'Date'}</span><input name="date" type="date" required min={todayStr()} defaultValue={date} className="input mt-1" /></label>
      {/* 30분 단위만 선택 가능 (학과사무실 요청) */}
      <label className="text-[13px]"><span className="eyebrow">{ko ? '시작' : 'Start'}</span><select name="start_time" required defaultValue="" className="input mt-1"><option value="" disabled>{ko ? '선택' : 'Select'}</option>{START_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
      <label className="text-[13px]"><span className="eyebrow">{ko ? '종료' : 'End'}</span><select name="end_time" required defaultValue="" className="input mt-1"><option value="" disabled>{ko ? '선택' : 'Select'}</option>{END_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
      {/* maxLength는 API(app/api/reservations)의 slice 상한과 같게 — 서버가 말없이 자르던 것을 입력 단계에서 막는다 */}
      <label className="text-[13px]"><span className="eyebrow">{ko ? '이름 (소속)' : 'Name (lab)'}</span><input name="user_name" required maxLength={80} className="input mt-1" placeholder={ko ? '홍길동 (OO연구실)' : 'Name (lab)'} /></label>
      <label className="text-[13px]"><span className="eyebrow">{ko ? '연락처' : 'Contact'}</span><input name="contact" required maxLength={120} className="input mt-1" placeholder={ko ? '이메일 또는 전화' : 'Email or phone'} /></label>
      <label className="text-[13px] sm:col-span-2"><span className="eyebrow">{ko ? '사용 목적' : 'Purpose'}</span><input name="purpose" maxLength={300} className="input mt-1" /></label>
      {warn && <p className="sm:col-span-2 border-l-4 border-sg-cardinal bg-[rgba(175,39,47,0.05)] px-4 py-3 text-[14px] text-sg-cardinal font-semibold break-keep">{warn}</p>}
      <div className="sm:col-span-2 flex items-center gap-4">
        <button disabled={state === 'saving' || !!warn} className="btn-primary disabled:opacity-50">{state === 'saving' ? '…' : ko ? '예약 신청' : 'Request reservation'}</button>
        {state === 'error' && <p className="text-[13px] text-sg-cardinal font-semibold break-keep">{msg}</p>}
      </div>
    </form>
  );
}
