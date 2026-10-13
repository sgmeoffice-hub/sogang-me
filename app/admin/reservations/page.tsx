import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { addReservation, updateReservation } from '@/app/admin/actions';
import { ReservationStatusButton } from '@/components/admin/ReservationButtons';
import ReservationCalendar from '@/components/ReservationCalendar';
import { facilities } from '@/lib/nav';
import { adminBase } from '@/lib/admin';
import { START_SLOTS, END_SLOTS, kstToday, monthRange } from '@/lib/reservation';

type SP = { f?: string; y?: string; m?: string; d?: string; edit?: string; note?: string };

export default async function ReservationsAdmin(props: { searchParams: Promise<SP> }) {
  const searchParams = await props.searchParams;
  const sb = await createClient();
  const base = `${adminBase()}/reservations`;
  const today = kstToday();
  // 화면 상태(시설·연월·마지막 입력 날짜)는 쿼리스트링에 유지 — 한 건 등록 후에도 같은 시설로 이어서 입력할 수 있게
  const facility = facilities.some((x) => x.id === searchParams.f) ? searchParams.f! : facilities[0].id;
  const yN = Number(searchParams.y); const mN = Number(searchParams.m);
  const y = Number.isInteger(yN) && yN >= 2000 && yN <= 2100 ? yN : Number(today.slice(0, 4));
  const m = Number.isInteger(mN) && mN >= 1 && mN <= 12 ? mN : Number(today.slice(5, 7));
  const lastDate = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d || '') ? searchParams.d! : today;
  const here = `${base}?f=${facility}&y=${y}&m=${m}&d=${lastDate}`;
  const fac = (id: string) => facilities.find((f) => f.id === id)?.ko || id;
  const { start, end } = monthRange(y, m);

  const [{ data: pending }, { data: approvedAll }, { data: monthRows }, editRes] = await Promise.all([
    sb.from('reservations').select('*').eq('status', 'pending').order('date').order('start_time'),
    sb.from('reservations').select('id,facility,date,start_time,end_time,user_name').eq('status', 'approved').gte('date', today),
    // 거절된 건도 목록에는 남긴다(복구·삭제 가능) — 달력에는 표시하지 않음
    sb.from('reservations').select('*').eq('facility', facility).gte('date', start).lte('date', end).order('date').order('start_time'),
    searchParams.edit ? sb.from('reservations').select('*').eq('id', Number(searchParams.edit)).maybeSingle() : Promise.resolve({ data: null } as any),
  ]);
  const editing = editRes?.data as any;
  /* 승인 대기 건이 이미 확정된 예약과 겹치는지 미리 계산해 경고합니다. */
  const clashOf = (r: any) => (approvedAll || []).filter((a: any) => a.id !== r.id && a.facility === r.facility && a.date === r.date && a.start_time < r.end_time && a.end_time > r.start_time);
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }; const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const nav = (yy: number, mm: number) => `${base}?f=${facility}&y=${yy}&m=${mm}&d=${lastDate}`;
  const editHref = (id: number) => `${here}&edit=${id}`;
  const btn = 'px-2 py-1 text-[12px]';

  /* 시작/종료는 짝이 없는 경계값을 빼고, 옛 사이트에서 이관된 30분 단위가 아닌 시각(09:15 등)은 '(기존)' 옵션으로 남겨 조용히 바뀌지 않게 한다 */
  const TimeSelect = ({ name, value, role }: { name: string; value?: string; role: 'start' | 'end' }) => {
    const v = value ? value.slice(0, 5) : ''; const slots = role === 'start' ? START_SLOTS : END_SLOTS;
    return (
      <select name={name} required defaultValue={v} className="input">
        <option value="" disabled>시간</option>
        {v && !slots.includes(v) && <option value={v}>{v} (기존)</option>}
        {slots.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    );
  };
  const Row = ({ r, warn, showFacility }: { r: any; warn?: any[]; showFacility?: boolean }) => (
    <tr className={`border-t border-sg-line ${warn && warn.length ? 'bg-red-50' : ''} ${r.status === 'rejected' ? 'opacity-60' : ''}`} style={editing?.id === r.id ? { backgroundColor: 'rgba(175,39,47,.06)' } : undefined}>
      {showFacility && <td className="p-3 whitespace-nowrap">{fac(r.facility)}</td>}
      <td className="p-3 font-mono text-[12px] whitespace-nowrap">{r.date} {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}</td>
      <td className="p-3">{r.user_name}<span className="block text-[11px] text-sg-steel">{r.contact} {r.purpose && `· ${r.purpose}`}</span>
        {r.status === 'pending' && <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-sg-cardinal text-white">승인 대기</span>}
        {r.status === 'rejected' && <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-sg-gray9 text-white">거절됨 · 달력 미표시</span>}
        {warn && warn.length > 0 && <span className="block mt-1 text-[11px] font-bold text-sg-red">⚠ 확정 예약과 중복: {warn.map((c: any) => `${c.start_time.slice(0, 5)}~${c.end_time.slice(0, 5)} ${c.user_name}`).join(', ')}</span>}</td>
      <td className="p-3"><div className="flex flex-wrap gap-1">
        <Link href={editHref(r.id)} className={`${btn} border border-sg-ink bg-white`}>수정</Link>
        {r.status !== 'approved' && <ReservationStatusButton id={r.id} status="approved" label="승인" back={here} className={`${btn} bg-sg-ink text-white`} />}
        {r.status !== 'rejected' && <ReservationStatusButton id={r.id} status="rejected" label="거절" back={here} className={`${btn} border border-sg-line bg-white`} />}
        <ReservationStatusButton id={r.id} status="delete" label="삭제" back={here} className={`${btn} text-sg-red`} />
      </div></td>
    </tr>);

  return (<div>
    <h1 className="text-2xl font-bold">시설 예약 관리</h1>
    {searchParams.note && <p className="mt-3 border-l-4 border-sg-cardinal px-4 py-2 text-[13px] font-semibold break-keep" style={{ backgroundColor: 'rgba(175,39,47,.06)' }}>{searchParams.note}</p>}

    <h2 className="mt-6 font-bold">승인 대기 <span className="font-mono text-sg-red">{pending?.length || 0}</span></h2>
    <div className="overflow-x-auto"><table className="mt-2 w-full text-[13px] bg-white border border-sg-line"><tbody>{(pending || []).map((r: any) => <Row key={r.id} r={r} warn={clashOf(r)} showFacility />)}{!pending?.length && <tr><td className="p-4 text-sg-steel">대기 중인 신청이 없습니다.</td></tr>}</tbody></table></div>

    {editing && (
      /* key: 다른 예약으로 바꿔 열 때 폼(특히 select의 defaultValue)이 새로 마운트되게 — 없으면 이전 예약의 시설·시간·상태가 남아 잘못 저장됨 */
      <section key={editing.id} className="mt-10 border-2 border-sg-cardinal bg-white p-4">
        <div className="flex items-center justify-between"><h2 className="font-bold">예약 수정 <span className="font-normal text-sg-steel text-[13px]">#{editing.id} · {fac(editing.facility)} {editing.date} {editing.user_name}</span></h2><Link href={here} className="text-[13px] underline">취소</Link></div>
        <form action={updateReservation} className="mt-3 grid gap-2 sm:grid-cols-6 text-[13px]">
          <input type="hidden" name="id" value={editing.id} />
          <select name="facility" defaultValue={editing.facility} className="input">{facilities.map((f) => <option key={f.id} value={f.id}>{f.ko}</option>)}</select>
          <input name="date" type="date" required defaultValue={editing.date} className="input" />
          <TimeSelect name="start_time" value={editing.start_time} role="start" /><TimeSelect name="end_time" value={editing.end_time} role="end" />
          <input name="user_name" required defaultValue={editing.user_name} placeholder="이름" className="input" /><input name="purpose" defaultValue={editing.purpose || ''} placeholder="목적" className="input" />
          <label className="sm:col-span-2 flex items-center gap-2">상태
            <select name="status" defaultValue={editing.status} className="input"><option value="approved">확정</option><option value="pending">승인 대기</option><option value="rejected">거절</option></select>
          </label>
          <button className="btn-primary sm:col-span-4 justify-center">저장</button>
        </form>
        <p className="mt-2 text-[12px] text-sg-steel">겹치는 예약이 있으면 저장되지 않고 안내가 표시됩니다.</p>
      </section>
    )}

    <h2 className="mt-10 font-bold">예약 직접 등록 <span className="font-normal text-sg-steel text-[13px]">(즉시 확정 · 등록 후에도 시설·날짜가 유지됩니다)</span></h2>
    <form action={addReservation} className="mt-2 grid gap-2 sm:grid-cols-6 bg-white border border-sg-line p-4 text-[13px]">
      <select name="facility" defaultValue={facility} className="input">{facilities.map((f) => <option key={f.id} value={f.id}>{f.ko}</option>)}</select>
      <input name="date" type="date" required defaultValue={lastDate} className="input" />
      <TimeSelect name="start_time" role="start" /><TimeSelect name="end_time" role="end" />
      <input name="user_name" required placeholder="이름" className="input" /><input name="purpose" placeholder="목적" className="input" />
      <div className="sm:col-span-6 flex flex-wrap items-center gap-3 border-t border-sg-line pt-3">
        <span className="font-semibold">반복 등록</span>
        <select name="repeat" defaultValue="none" className="input !w-auto"><option value="none">한 번만</option><option value="weekly">매주 (같은 요일)</option><option value="biweekly">격주</option></select>
        <label className="flex items-center gap-2">종료일 <input name="repeat_until" type="date" className="input !w-auto" /></label>
        <span className="text-[12px] text-sg-steel break-keep">랩미팅처럼 같은 시간을 여러 날짜에 넣을 때 사용 — 시작 날짜부터 종료일까지 같은 요일에 등록되며, 겹치는 날짜는 건너뛰고 알려줍니다 (최대 30건).</span>
      </div>
      <button className="btn-primary sm:col-span-6 justify-center">등록</button>
    </form>

    <h2 className="mt-10 font-bold">시설별 예약 달력</h2>
    <div className="mt-2 flex gap-1 flex-wrap">{facilities.map((f) => <Link key={f.id} href={`${base}?f=${f.id}&y=${y}&m=${m}&d=${lastDate}`} className={`px-3 py-1 text-[12px] border ${facility === f.id ? 'bg-sg-ink text-white' : 'bg-white border-sg-line'}`}>{f.ko}</Link>)}</div>
    <div className="mt-3">
      <ReservationCalendar y={y} m={m} rows={(monthRows || []).filter((r: any) => r.status !== 'rejected') as any} ko todayStr={today} title={`${y}년 ${m}월 · ${fac(facility)}`} prevHref={nav(prev.y, prev.m)} nextHref={nav(next.y, next.m)} itemHref={(r) => editHref(r.id)} />
      <p className="mt-2 text-[12px] text-sg-steel">달력의 예약을 클릭하면 위에 수정 폼이 열립니다. 점선은 승인 대기 건입니다.</p>
    </div>

    <h2 className="mt-8 font-bold">{y}년 {m}월 · {fac(facility)} 목록 <span className="font-mono text-sg-steel text-[13px]">{monthRows?.length || 0}건</span></h2>
    <div className="overflow-x-auto"><table className="mt-2 w-full text-[13px] bg-white border border-sg-line"><tbody>{(monthRows || []).map((r: any) => <Row key={r.id} r={r} />)}{!monthRows?.length && <tr><td className="p-4 text-sg-steel">이 달에는 예약이 없습니다.</td></tr>}</tbody></table></div>
  </div>);
}
