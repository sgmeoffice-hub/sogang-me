'use client';
import { useState } from 'react';
import { urecaTerms } from '@/lib/nav';
import type { Locale } from '@/lib/i18n';

type Lab = { id: number; lab_ko: string; lab_en: string | null; name_ko: string; name_en: string | null };

export default function UrecaForm({ locale, labs }: { locale: Locale; labs: Lab[] }) {
  const ko = locale === 'ko';
  const now = new Date();
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [ranks, setRanks] = useState<Record<number, string>>({});
  const [replaced, setReplaced] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget); const row: any = Object.fromEntries(fd.entries());
    const choices = Object.entries(ranks).filter(([, r]) => r).map(([id, r]) => { const l = labs.find((x) => x.id === Number(id))!; return { rank: Number(r), lab: l.lab_ko, prof: l.name_ko }; }).sort((a, b) => a.rank - b.rank);
    const rs = choices.map((c) => c.rank);
    if (!choices.length || new Set(rs).size !== rs.length) { setMsg(ko ? '지망 순위(1·2·3)를 중복 없이 지정해 주세요.' : 'Assign unique ranks 1–3 to your preferred labs.'); setState('error'); return; }
    setState('saving');
    const r = await fetch('/api/ureca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...row, choices }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error || 'error'); setState('error'); } else { setReplaced(!!j.replaced); setState('done'); }
  }
  if (state === 'done') return <div className="border-l-4 border-sg-cardinal bg-sg-mist p-6"><p className="font-bold text-[17px]">{ko ? (replaced ? '지원서가 수정되었습니다.' : 'URECA 인턴 지원서가 접수되었습니다.') : (replaced ? 'Your application has been updated.' : 'Your URECA application has been received.')}</p><p className="text-[14.5px] text-sg-gray11 mt-1">{ko ? (replaced ? '같은 학기에 이전에 제출하신 지원서는 이번 내용으로 대체되었습니다. 지망 순서대로 해당 교수님께서 선발 여부를 결정하며, 결과는 이메일로 안내드립니다.' : '지망 순서대로 해당 교수님께서 선발 여부를 결정하며, 결과는 이메일로 안내드립니다.') : 'Professors review applications in order of preference; results will be sent by email.'}</p></div>;
  return (
    <form onSubmit={submit} className="border border-sg-line bg-white p-6 md:p-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-[13px]"><span className="eyebrow">{ko ? '지원 연도' : 'Year'}</span><select name="year" defaultValue={now.getFullYear()} className="input mt-1">{[now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
        <label className="text-[13px]"><span className="eyebrow">{ko ? '지원 기간 *' : 'Term *'}</span><select name="term" required className="input mt-1" defaultValue=""><option value="" disabled>{ko ? '선택하세요' : 'Select'}</option>{urecaTerms.map((t) => <option key={t.id} value={t.id}>{ko ? t.ko : t.en}</option>)}</select></label>
        <label className="text-[13px]"><span className="eyebrow">{ko ? '이름 *' : 'Name *'}</span><input name="name" required className="input mt-1" /></label>
        <label className="text-[13px]"><span className="eyebrow">{ko ? '학번 *' : 'Student ID *'}</span><input name="student_id" required className="input mt-1" /></label>
        <label className="text-[13px]"><span className="eyebrow">{ko ? '현재 학기 *' : 'Current semester *'}</span><input name="semester" required className="input mt-1" placeholder={ko ? '예: 5학기' : 'e.g. 5th'} /></label>
        <label className="text-[13px]"><span className="eyebrow">{ko ? '연락처 *' : 'Phone *'}</span><input name="phone" required className="input mt-1" placeholder="010-0000-0000" /></label>
        <label className="text-[13px] sm:col-span-2"><span className="eyebrow">{ko ? '이메일 *' : 'Email *'}</span><input name="email" type="email" required className="input mt-1" /></label>
      </div>
      <div>
        <p className="eyebrow">{ko ? '지원 연구실 (지망 순서 1·2·3 선택) *' : 'Preferred labs (rank 1–3) *'}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {labs.map((l) => (
            <div key={l.id} className={`min-w-0 flex items-center gap-3 border p-3 ${ranks[l.id] ? 'border-sg-cardinal bg-[rgba(175,39,47,0.05)]' : 'border-sg-line'}`}>
              <select value={ranks[l.id] || ''} onChange={(e) => setRanks({ ...ranks, [l.id]: e.target.value })} className="border border-sg-line px-2 py-1.5 text-[13px] bg-white w-[72px]">
                <option value="">—</option><option value="1">1{ko ? '지망' : 'st'}</option><option value="2">2{ko ? '지망' : 'nd'}</option><option value="3">3{ko ? '지망' : 'rd'}</option>
              </select>
              <div className="min-w-0"><p className="text-[14px] font-medium leading-tight truncate">{ko ? l.lab_ko : l.lab_en || l.lab_ko}</p><p className="text-[12px] text-sg-gray9">{ko ? `${l.name_ko} 교수` : l.name_en || l.name_ko}</p></div>
            </div>
          ))}
        </div>
      </div>
      <label className="block text-[13px]"><span className="eyebrow">{ko ? '지원 동기 / 하고 싶은 말' : 'Motivation / notes'}</span><textarea name="message" rows={4} className="input mt-1" /></label>
      <div className="flex items-center gap-4">
        <button disabled={state === 'saving'} className="btn-primary">{state === 'saving' ? '…' : ko ? 'URECA Intern 지원하기' : 'Apply for URECA Intern'}</button>
        {state === 'error' && <p className="text-[13px] text-sg-cardinal">{msg}</p>}
      </div>
      <p className="text-[12.5px] text-sg-gray9">{ko ? '※ 같은 학기에 다시 제출하면 마지막 제출본으로 자동 대체됩니다. 지원 내용을 바꾸고 싶으면 같은 학번으로 다시 제출해 주세요.' : '※ Submitting again for the same term replaces your previous application. To change your choices, simply submit again with the same student ID.'}</p>
      <p className="text-[12.5px] text-sg-gray9">{ko ? '제출된 정보는 URECA 선발 목적으로만 사용되며 학과사무실과 지망 연구실 교수에게 전달됩니다.' : 'Submitted information is used only for URECA selection and shared with the department office and the chosen professors.'}</p>
    </form>
  );
}
