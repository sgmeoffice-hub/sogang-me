import { createClient } from '@/lib/supabase-server';
import { setUreca } from '@/app/admin/actions';
import { urecaTerms } from '@/lib/nav';

// 셀이 = + - @ 로 시작하면 엑셀이 수식으로 해석한다(수식 주입) — 앞에 '를 붙여 무력화
const csvCell = (v: any) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
export default async function UrecaAdmin({ searchParams }: { searchParams: { year?: string; term?: string } }) {
  const sb = createClient();
  let q = sb.from('ureca_applications').select('*').order('created_at', { ascending: false }).limit(2500);
  if (searchParams.year) q = q.eq('year', Number(searchParams.year));
  if (searchParams.term) q = q.eq('term', searchParams.term);
  const { data } = await q;
  const rows = data || [];
  const years = Array.from(new Set(rows.map((r: any) => r.year))).sort().reverse();
  const tk = (t: string) => urecaTerms.find((x) => x.id === t)?.ko || t;
  const csv = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(['연도,기간,이름,학번,현재학기,연락처,이메일,1지망,2지망,3지망,상태,신청일', ...rows.map((r: any) => [r.year, tk(r.term), r.name, r.student_id, r.semester, r.phone, r.email, ...[1, 2, 3].map((k) => { const c = (r.choices || []).find((c: any) => c.rank === k); return c ? `${c.lab}(${c.prof})` : ''; }), r.status, String(r.created_at).slice(0, 10)].map(csvCell).join(','))].join('\n'));
  return (<div>
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">URECA 인턴 지원 관리</h1><a href={csv} download={`ureca_${searchParams.year || 'all'}.csv`} className="btn-ghost !py-2 bg-white">CSV 내려받기</a></div>
    <div className="mt-4 flex flex-wrap gap-1 text-[13px]">
      <a href="?" className={`px-3 py-1.5 border ${!searchParams.year && !searchParams.term ? 'bg-sg-ink text-white' : 'bg-white border-sg-line'}`}>전체</a>
      {years.map((y) => <a key={y} href={`?year=${y}`} className={`px-3 py-1.5 border ${searchParams.year == String(y) ? 'bg-sg-ink text-white' : 'bg-white border-sg-line'}`}>{y}</a>)}
      {urecaTerms.map((t) => <a key={t.id} href={`?${searchParams.year ? `year=${searchParams.year}&` : ''}term=${t.id}`} className={`px-3 py-1.5 border ${searchParams.term === t.id ? 'bg-sg-cardinal text-white border-sg-cardinal' : 'bg-white border-sg-line'}`}>{t.ko}</a>)}
    </div>
    <p className="mt-3 text-[13px] text-sg-steel">{rows.length}건 · 신청이 접수되면 설정에 등록한 이메일로 알림이 발송됩니다.</p>
    <div className="mt-4 space-y-3">
      {rows.map((r: any) => (
        <div key={r.id} className={`bg-white border p-4 grid gap-3 md:grid-cols-[1fr_1.4fr_auto] ${r.status === 'pending' ? 'border-[rgba(175,39,47,0.4)]' : 'border-sg-line'}`}>
          <div className="text-[14px]">
            <p className="font-bold">{r.name} <span className="font-normal text-sg-steel">{r.student_id} · {r.semester}</span></p>
            <p className="text-[13px] text-sg-steel mt-1">{r.year} {tk(r.term)} · {String(r.created_at).slice(0, 10)}</p>
            <p className="text-[13px] mt-1">{r.phone} · <a href={`mailto:${r.email}`} className="underline">{r.email}</a></p>
            <p className="mt-1 text-[12px]"><span className={`px-2 py-0.5 ${r.status === 'accepted' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-gray-200' : r.status === 'archived' ? 'bg-sg-mist text-sg-gray11' : 'bg-sg-cardinal text-white'}`}>{r.status === 'accepted' ? '선발' : r.status === 'rejected' ? '미선발' : r.status === 'archived' ? '이관 기록' : '검토 중'}</span></p>
          </div>
          <div className="text-[13px]">
            <ol className="space-y-1">{(r.choices || []).sort((a: any, b: any) => a.rank - b.rank).map((c: any) => <li key={c.rank}><span className="font-bold text-sg-cardinal">{c.rank}지망</span> {c.lab} <span className="text-sg-steel">({c.prof})</span></li>)}</ol>
            {r.message && <p className="mt-2 text-sg-steel whitespace-pre-line border-l-2 border-sg-line pl-2">{r.message}</p>}
          </div>
          <div className="flex md:flex-col gap-1 text-[12px]">
            {r.status !== 'accepted' && <form action={setUreca}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="accepted" /><button className="px-2 py-1 bg-sg-ink text-white w-full">선발</button></form>}
            {r.status !== 'rejected' && <form action={setUreca}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="rejected" /><button className="px-2 py-1 border border-sg-line bg-white w-full">미선발</button></form>}
            {r.status !== 'pending' && <form action={setUreca}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="pending" /><button className="px-2 py-1 border border-sg-line bg-white w-full">검토 중</button></form>}
            <form action={setUreca}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="delete" /><button className="px-2 py-1 text-sg-red w-full">삭제</button></form>
          </div>
        </div>
      ))}
      {!rows.length && <p className="p-6 bg-white border border-sg-line text-sg-steel text-[14px]">지원서가 없습니다.</p>}
    </div>
  </div>);
}
