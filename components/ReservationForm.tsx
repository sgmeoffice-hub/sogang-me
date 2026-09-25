'use client';
import { useState } from 'react';
import { facilities } from '@/lib/nav';
import { START_SLOTS, END_SLOTS } from '@/lib/reservation';
import type { Locale } from '@/lib/i18n';

const todayStr = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

export default function ReservationForm({ locale, facility, date }: { locale: Locale; facility: string; date?: string }) {
  const ko = locale === 'ko';
  const [state, setState] = useState<'idle' | 'checking' | 'saving' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [warn, setWarn] = useState('');

  /** 시간을 고르는 즉시 중복 여부를 알려줍니다 (제출 전 경고). */
  async function check(form: HTMLFormElement) {
    const f = new FormData(form); const g = (k: string) => String(f.get(k) || '');
    if (!g('date') || !g('start_time') || !g('end_time')) return setWarn('');
    if (g('date') < todayStr()) return setWarn(ko ? '지난 날짜는 예약할 수 없습니다.' : 'Past dates cannot be booked.');
    if (g('start_time') >= g('end_time')) return setWarn(ko ? '종료 시간이 시작 시간보다 늦어야 합니다.' : 'End time must be after start time.');
    const r = await fetch(`/api/reservations?facility=${g('facility')}&date=${g('date')}&start=${g('start_time')}&end=${g('end_time')}`);
    const j = await r.json();
    if (j.conflicts?.length) {
      const list = j.conflicts.map((c: any) => `${c.start_time.slice(0, 5)}~${c.end_time.slice(0, 5)} ${c.user_name}${c.status === 'pending' ? (ko ? ' (승인 대기)' : ' (pending)') : ''}`).join(', ');
      setWarn(ko ? `⚠ 이미 예약된 시간과 겹칩니다 — ${list}` : `⚠ Conflicts with an existing booking — ${list}`);
    } else setWarn('');
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState('saving'); setMsg('');
    const row = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    const r = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error || 'error'); setState('error'); } else setState('done');
  }

  if (state === 'done') return <div className="border-l-4 border-sg-cardinal bg-sg-mist p-6"><p className="font-bold text-[17px]">{ko ? '예약 신청이 접수되었습니다.' : 'Your request has been received.'}</p><p className="text-[14.5px] text-sg-gray11 mt-1 break-keep">{ko ? '신청하신 시간이 캘린더에 「승인 대기」로 바로 표시되며, 학과사무실 확인 후 확정됩니다. (02-705-8631)' : 'Your slot now appears on the calendar as “pending” and will be confirmed by the department office. (+82-2-705-8631)'}</p></div>;

  return (
    <form onSubmit={submit} onChange={(e) => check(e.currentTarget)} className="grid gap-4 sm:grid-cols-2 border border-sg-line p-6 bg-white">
      <label className="text-[13px]"><span className="eyebrow">{ko ? '시설' : 'Facility'}</span><select name="facility" defaultValue={facility} className="input mt-1">{facilities.map((f) => <option key={f.id} value={f.id}>{ko ? f.ko : f.en}</option>)}</select></label>
      <label className="text-[13px]"><span className="eyebrow">{ko ? '날짜' : 'Date'}</span><input name="date" type="date" required min={todayStr()} defaultValue={date} className="input mt-1" /></label>
      {/* 30분 단위만 선택 가능 (학과사무실 요청) */}
      <label className="text-[13px]"><span className="eyebrow">{ko ? '시작' : 'Start'}</span><select name="start_time" required defaultValue="" className="input mt-1"><option value="" disabled>{ko ? '선택' : 'Select'}</option>{START_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
      <label className="text-[13px]"><span className="eyebrow">{ko ? '종료' : 'End'}</span><select name="end_time" required defaultValue="" className="input mt-1"><option value="" disabled>{ko ? '선택' : 'Select'}</option>{END_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
      <label className="text-[13px]"><span className="eyebrow">{ko ? '이름 (소속)' : 'Name (lab)'}</span><input name="user_name" required className="input mt-1" placeholder={ko ? '홍길동 (OO연구실)' : 'Name (lab)'} /></label>
      <label className="text-[13px]"><span className="eyebrow">{ko ? '연락처' : 'Contact'}</span><input name="contact" required className="input mt-1" placeholder={ko ? '이메일 또는 전화' : 'Email or phone'} /></label>
      <label className="text-[13px] sm:col-span-2"><span className="eyebrow">{ko ? '사용 목적' : 'Purpose'}</span><input name="purpose" className="input mt-1" /></label>
      {warn && <p className="sm:col-span-2 border-l-4 border-sg-cardinal bg-[rgba(175,39,47,0.05)] px-4 py-3 text-[14px] text-sg-cardinal font-semibold">{warn}</p>}
      <div className="sm:col-span-2 flex items-center gap-4">
        <button disabled={state === 'saving' || !!warn} className="btn-primary disabled:opacity-50">{state === 'saving' ? '…' : ko ? '예약 신청' : 'Request reservation'}</button>
        {state === 'error' && <p className="text-[13px] text-sg-cardinal font-semibold">{msg}</p>}
      </div>
    </form>
  );
}
