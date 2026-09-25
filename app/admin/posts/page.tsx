import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import { adminBase } from '@/lib/admin';
import { boards } from '@/lib/nav';
import { ui } from '@/lib/i18n';
import { fmtDate } from '@/components/PostCard';

/** 1 … (현재-2 ~ 현재+2) … 끝. 0은 생략 표시 */
function pageList(page: number, pages: number): number[] {
  const set = new Set([1, pages]); for (let p = page - 2; p <= page + 2; p++) if (p >= 1 && p <= pages) set.add(p);
  const out: number[] = []; let prev = 0;
  for (const p of Array.from(set).sort((a, b) => a - b)) { if (p - prev > 1) out.push(0); out.push(p); prev = p; }
  return out;
}

export default async function Posts({ searchParams }: { searchParams: { board?: string; page?: string; q?: string } }) {
  const sb = createClient(); const b = adminBase();
  const board = searchParams.board || 'notice'; const pageN = Number(searchParams.page); const page = Number.isFinite(pageN) && pageN >= 1 ? Math.floor(pageN) : 1; const per = 30;
  let q = sb.from('posts').select('id,title_ko,title_en,author,created_at,is_pinned,published,view_count', { count: 'exact' }).eq('board', board);
  if (searchParams.q) q = q.ilike('title_ko', `%${searchParams.q}%`);
  const { data, count } = await q.order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).range((page - 1) * per, page * per - 1);
  const pages = Math.ceil((count || 0) / per);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">게시판 관리</h1>
        <Link href={`${b}/posts/new?board=${board}`} className="btn-primary">+ 새 글</Link>
      </div>
      <div className="mt-5 flex flex-wrap gap-1">{boards.map((bd) => <Link key={bd} href={`${b}/posts?board=${bd}`} className={`px-3 py-1.5 text-[13px] border ${bd === board ? 'bg-sg-ink text-white border-sg-ink' : 'bg-white border-sg-line'}`}>{ui.ko[bd]}</Link>)}</div>
      <form className="mt-4 flex gap-0"><input type="hidden" name="board" value={board} /><input name="q" defaultValue={searchParams.q} placeholder="제목 검색" className="input !w-64" /><button className="btn-ghost !py-2 bg-white">검색</button></form>
      {/* 폰에서는 표만 가로로 밀린다(페이지 전체가 축소되지 않게) */}
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-[13px] bg-white border border-sg-line">
        <thead className="bg-sg-mist text-left font-mono text-[11px] uppercase tracking-wider text-sg-steel"><tr><th className="p-3 w-14">ID</th><th className="p-3">제목</th><th className="p-3 w-16">EN</th><th className="p-3 w-24">작성자</th><th className="p-3 w-28">날짜</th><th className="p-3 w-16">조회</th><th className="p-3 w-20">상태</th></tr></thead>
        <tbody>{(data || []).map((p: any) => (
          <tr key={p.id} className="border-t border-sg-line hover:bg-sg-mist">
            <td className="p-3 font-mono text-sg-steel">{p.id}</td>
            <td className="p-3"><Link href={`${b}/posts/${p.id}`} className="font-medium hover:text-sg-red">{p.is_pinned && <span className="text-sg-red font-mono text-[10px] mr-1">PIN</span>}{p.title_ko}</Link></td>
            <td className="p-3 font-mono text-[11px]">{p.title_en ? '✓' : <span className="text-sg-steel">—</span>}</td>
            <td className="p-3 text-sg-steel">{p.author}</td><td className="p-3 font-mono text-[12px]">{fmtDate(p.created_at)}</td><td className="p-3 font-mono">{p.view_count}</td>
            <td className="p-3">{p.published ? <span className="text-green-700">공개</span> : <span className="text-sg-steel">비공개</span>}</td>
          </tr>))}</tbody>
      </table></div>
      {/* 페이지 번호: 현재 앞뒤 2쪽 + 처음·끝만 보이고 줄바꿈된다(장학·취업정보처럼 40쪽이 넘으면 한 줄로 늘어서 화면 밖으로 넘치던 문제), 검색어 유지 */}
      {pages > 1 && <nav className="mt-4 flex flex-wrap items-center gap-1 font-mono text-[12px]" aria-label="페이지">
        {pageList(page, pages).map((p, i) => p === 0
          ? <span key={`gap${i}`} className="px-1 text-sg-steel">…</span>
          : <Link key={p} href={`${b}/posts?board=${board}&page=${p}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ''}`} aria-current={p === page ? 'page' : undefined} className={`min-w-[34px] text-center px-2.5 py-1 border ${p === page ? 'bg-sg-ink text-white border-sg-ink' : 'bg-white border-sg-line hover:border-sg-ink'}`}>{p}</Link>)}
      </nav>}
    </div>
  );
}
