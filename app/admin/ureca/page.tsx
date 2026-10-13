import { requireAdmin } from '@/lib/admin';
import { setUreca } from '@/app/admin/actions';
import SubmitButton from '@/components/admin/SubmitButton';
import { urecaTerms } from '@/lib/nav';

// 셀이 = + - @ 로 시작하면 엑셀이 수식으로 해석한다(수식 주입) — 앞에 '를 붙여 무력화
const csvCell = (v: any) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
export default async function UrecaAdmin(props: { searchParams: Promise<{ year?: string; term?: string }> }) {
  const auth = await requireAdmin(); if (!auth) return null;
  const searchParams = await props.searchParams;
  const { sb } = auth;
  // PostgREST max-rows(1,000)가 .limit(2500)을 조용히 잘라 1,162건 중 옛 162건이 목록·CSV에서 빠지던 문제(2026-10-13) — lib/backup.ts dumpTable처럼
  // 1,000행씩 range()로 이어 읽는다. created_at이 같은 이관 행이 경계에서 중복·누락되지 않게 id를 2차 정렬로 둔다. 첫 페이지에서 전체 건수도 받아 잘림이 보이게 한다.
  const rows: any[] = []; let total: number | null = null;
  for (let from = 0; ; from += 1000) {
    let q = sb.from('ureca_applications').select('*', from === 0 ? { count: 'exact' } : undefined).order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, from + 999);
    if (searchParams.year) q = q.eq('year', Number(searchParams.year));
    if (searchParams.term) q = q.eq('term', searchParams.term);
    const { data, count, error } = await q;
    if (error) throw new Error(`URECA 지원서 조회 실패: ${error.message}`);   // 조용히 짧은 CSV를 내려주지 않는다
    if (from === 0) total = count;
    rows.push(...(data || []));
    if ((data || []).length < 1000) break;
  }
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
    <p className="mt-3 text-[13px] text-sg-steel">{rows.length}건{total != null && total !== rows.length ? ` (전체 ${total}건 중 일부만 표시됨)` : ''} · 신청이 접수되면 설정에 등록한 이메일로 알림이 발송됩니다.</p>
    <div className="mt-4 space-y-3">
      {rows.map((r: any) => (
        <div key={r.id} className={`bg-white border p-4 grid gap-3 md:grid-cols-[1fr_1.4fr_auto] ${r.status === 'pending' ? 'border-[rgba(175,39,47,0.4)]' : 'border-sg-line'}`}>
          <div className="text-[14px]">
            <p className="font-bold">{r.name} <span className="font-normal text-sg-steel">{r.student_id} · {r.semester}</span></p>
            <p className="text-[13px] text-sg-steel mt-1">{r.year} {tk(r.term)} · {String(r.created_at).slice(0, 10)}</p>
            <p className="text-[13px] mt-1">{r.phone} · <a href={`mailto:${r.email}`} className="underline">{r.email}</a></p>
            <p className="mt-1 text-[12px]"><span className={`px-2 py-0.5 ${r.status === 'accepted' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-gray-200' : r.status === 'archived' || r.status === 'superseded' ? 'bg-sg-mist text-sg-gray11' : 'bg-sg-cardinal text-white'}`}>{r.status === 'accepted' ? '선발' : r.status === 'rejected' ? '미선발' : r.status === 'archived' ? '이관 기록' : r.status === 'superseded' ? '재제출로 대체' : '검토 중'}</span></p>
          </div>
          <div className="text-[13px]">
            <ol className="space-y-1">{(r.choices || []).sort((a: any, b: any) => a.rank - b.rank).map((c: any) => <li key={c.rank}><span className="font-bold text-sg-cardinal">{c.rank}지망</span> {c.lab} <span className="text-sg-steel">({c.prof})</span></li>)}</ol>
            {r.message && <p className="mt-2 text-sg-steel whitespace-pre-line border-l-2 border-sg-line pl-2">{r.message}</p>}
          </div>
          <div className="flex md:flex-col gap-1 text-[12px]">
            {r.status !== 'accepted' && <form action={setUreca}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="accepted" /><button className="px-2 py-1 bg-sg-ink text-white w-full">선발</button></form>}
            {r.status !== 'rejected' && <form action={setUreca}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="rejected" /><button className="px-2 py-1 border border-sg-line bg-white w-full">미선발</button></form>}
            {r.status !== 'pending' && <form action={setUreca}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="pending" /><button className="px-2 py-1 border border-sg-line bg-white w-full">검토 중</button></form>}
            <form action={setUreca}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="delete" /><SubmitButton className="px-2 py-1 text-sg-red w-full" pendingText="…" confirm="이 지원서를 삭제할까요? 되돌릴 수 없습니다.">삭제</SubmitButton></form>
          </div>
        </div>
      ))}
      {!rows.length && <p className="p-6 bg-white border border-sg-line text-sg-steel text-[14px]">지원서가 없습니다.</p>}
    </div>
  </div>);
}
