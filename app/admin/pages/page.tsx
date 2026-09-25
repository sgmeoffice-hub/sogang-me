import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { adminBase } from '@/lib/admin';
import { staticPages } from '@/content';
import { nav } from '@/lib/nav';
export default async function PagesAdmin() {
  const sb = createClient(); const b = adminBase();
  const { data } = await sb.from('pages').select('slug,updated_at');
  const edited = new Map((data || []).map((p: any) => [p.slug, p.updated_at]));
  const rows = Object.keys(staticPages).map((slug) => {
    const [sec, sub] = slug.split('/'); const s = nav.find((n) => n.id === sec)?.sub?.find((x) => x.id === sub);
    return { slug, label: s ? `${nav.find((n) => n.id === sec)!.ko} › ${s.ko}` : slug, edited: edited.get(slug) };
  });
  return (<div>
    <h1 className="text-2xl font-bold">페이지 내용 관리</h1>
    <p className="mt-2 text-[13px] text-sg-steel">소개·교과과정·산학협력 등 고정 페이지의 본문을 수정합니다. 수정하지 않은 페이지는 코드에 내장된 기본 내용을 표시합니다. (연혁·학사일정·기초전공분야·연구그룹은 구조화 데이터라 코드 내 content/ 폴더에서 관리)</p>
    <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[560px] text-[13px] bg-white border border-sg-line">
      <thead className="bg-sg-mist text-left font-mono text-[11px] uppercase tracking-wider text-sg-steel"><tr><th className="p-3">페이지</th><th className="p-3 w-40">경로</th><th className="p-3 w-40">상태</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.slug} className="border-t border-sg-line hover:bg-sg-mist"><td className="p-3"><Link href={`${b}/pages/${encodeURIComponent(r.slug)}`} className="font-medium hover:text-sg-red">{r.label}</Link></td><td className="p-3 font-mono text-[12px] text-sg-steel">/{r.slug}</td><td className="p-3">{r.edited ? <span className="text-green-700">수정됨 · {String(r.edited).slice(0, 10)}</span> : <span className="text-sg-steel">기본</span>}</td></tr>)}</tbody>
    </table></div>
  </div>);
}
