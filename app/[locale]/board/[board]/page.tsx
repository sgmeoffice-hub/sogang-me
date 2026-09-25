import Link from 'next/link';
import PageHero from '@/components/PageHero';
import PostCard, { fmtDate } from '@/components/PostCard';
import { PromoView, CapstoneView, FestivalView, VideosView } from '@/components/BoardViews';
import { getPosts } from '@/lib/data';
import { boards, boardSection } from '@/lib/nav';
import { t, T, authorLabel, type Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import { facultyNames, peopleEn } from '@/lib/names';
export const revalidate = 60;
const PER = 15;
const intros: Record<string, [string, string]> = {
  promo: ['고등학생·자유전공학부 학생을 위한 기계공학과 소개 자료입니다. 클릭하면 자료 소개와 PDF 열람·다운로드로 이동합니다.', 'Introductory materials for prospective and liberal-major students. Open a card to read more or download the PDF.'],
  capstone: ['4학년 창의적종합설계(캡스톤디자인) 프로젝트를 학기별로 축적합니다. 각 조의 주제·조원·지도교수와 포스터를 확인할 수 있습니다.', 'Senior capstone design projects, archived by semester with topic, members, advisor and poster.'],
  festival: ['기계공학과 학술제에 출품된 학부생 연구(URECA 인턴 · 창의적종합설계 · 연구프로젝트)와 학부생 수상 명단을 연도별로 게시합니다.', 'Undergraduate research presented at the department festival — URECA, capstone and research projects — plus award lists by year.'],
  videos: ['자유전공학부 학생과 기계공학과 학부생이 전공 분야를 쉽게 이해할 수 있는 영상을 모았습니다. NASA 출신 Mark Rober, 로봇·Physical AI, 세부분야별 영상으로 구성되어 있습니다.', 'Videos that make mechanical engineering easy to grasp: Mark Rober, robotics & Physical AI, and one per sub-field.'],
};

export default async function BoardList({ params, searchParams }: { params: { locale: Locale; board: string }; searchParams: { page?: string; q?: string; year?: string } }) {
  const { locale: l, board } = params; const ko = l === 'ko';
  if (!(boards as readonly string[]).includes(board)) notFound();
  const special = ['promo', 'capstone', 'festival', 'videos'].includes(board);
  const pageN = Number(searchParams.page); // 숫자가 아니면 NaN → 1페이지로 (NaN이 range()에 흘러가 빈 화면이 되지 않게)
  const page = Number.isFinite(pageN) && pageN >= 1 ? Math.floor(pageN) : 1; const q = searchParams.q || '';
  const { posts: raw, total } = await getPosts(board, special ? 1 : page, special ? 200 : PER, q);
  // 캡스톤·학술제의 조원·지도교수는 국문으로 입력된다 → 영문 페이지에서는 교수는 공식 영문 이름, 학생은 로마자로
  const people = !ko && raw.some((p) => p.advisor || p.members);
  const names = people ? await facultyNames() : [];
  const posts = people ? raw.map((p) => ({ ...p, advisor: p.advisor && peopleEn(names, p.advisor), members: p.members && peopleEn(names, p.members) })) : raw;
  const pages = Math.max(1, Math.ceil(total / PER));
  const [section, current] = boardSection[board] || ['board', board];
  const href = (p: number) => `/${l}/board/${board}?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
  return (<>
    <PageHero locale={l} section={section} current={current} />
    <div className="container-site py-12">
      {intros[board] && <p className="mb-8 max-w-3xl text-[16px] leading-relaxed text-sg-gray11">{ko ? intros[board][0] : intros[board][1]}</p>}
      {!special && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-[13px] text-sg-gray9">{ko ? `총 ${total}건` : `${total} posts`}</p>
          <form className="flex" action={`/${l}/board/${board}`}><input name="q" defaultValue={q} placeholder={T(l, 'search')} className="input !w-56" /><button className="btn-primary !py-2">{T(l, 'search')}</button></form>
        </div>
      )}
      {board === 'promo' ? <PromoView posts={posts} locale={l} />
       : board === 'capstone' ? <CapstoneView posts={posts} locale={l} />
       : board === 'festival' ? <FestivalView posts={posts} locale={l} year={searchParams.year} />
       : board === 'videos' ? <VideosView posts={posts} locale={l} />
       : posts.length === 0 ? <p className="py-16 text-center text-sg-gray9 border border-dashed border-sg-line">{T(l, 'noPosts')}</p>
       : board === 'gallery' ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{posts.map((p) => <PostCard key={p.id} post={p} locale={l} />)}</div>
      ) : (
        <table className="w-full text-[15px] border-t-2 border-sg-ink">
          <thead className="hidden md:table-header-group"><tr className="text-[12px] uppercase tracking-wider text-sg-gray9 border-b border-sg-line">
            <th className="py-3 w-16 text-left">No.</th><th className="py-3 text-left">{ko ? '제목' : 'Title'}</th><th className="py-3 w-28 text-left">{T(l, 'author')}</th><th className="py-3 w-28 text-left">{T(l, 'date')}</th><th className="py-3 w-16 text-right">{T(l, 'views')}</th></tr></thead>
          <tbody>
            {posts.map((p, i) => (
              <tr key={p.id} className={`border-b border-sg-line ${p.is_pinned ? 'bg-[#f9f9f9]' : ''}`}>
                <td className="py-3.5 pr-2 text-[13px] text-sg-gray9 hidden md:table-cell">{p.is_pinned ? <span className="text-sg-cardinal font-bold">{ko ? '공지' : 'PIN'}</span> : total - (page - 1) * PER - i}</td>
                <td className="py-3.5 pr-3">
                  <Link href={`/${l}/board/${board}/${p.id}`} className="font-medium hover:text-sg-cardinal line-clamp-2">
                    {p.is_pinned && <span className="md:hidden text-[11px] text-sg-cardinal font-bold mr-2">{ko ? '공지' : 'PIN'}</span>}{t(p, 'title', l)}
                    {(p.attachments?.length ?? 0) > 0 && <span className="ml-2 text-[12px] text-sg-gray9">📎</span>}{p.video_url && <span className="ml-2 text-[12px] text-sg-cardinal">▶</span>}
                  </Link>
                  <span className="md:hidden block text-[12px] text-sg-gray9 mt-1">{fmtDate(p.created_at)}</span>
                </td>
                <td className="py-3.5 pr-3 text-sg-gray11 hidden md:table-cell">{authorLabel(p.author, l)}</td>
                <td className="py-3.5 pr-3 text-[13px] text-sg-gray9 hidden md:table-cell">{fmtDate(p.created_at)}</td>
                <td className="py-3.5 text-right text-[13px] text-sg-gray9 hidden md:table-cell">{p.view_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!special && pages > 1 && (
        <nav className="mt-10 flex justify-center gap-1 text-[14px]" aria-label="Pagination">
          {page > 1 && <Link href={href(page - 1)} className="px-3 py-2 border border-sg-line hover:border-sg-ink">‹</Link>}
          {Array.from({ length: pages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 3 || p === 1 || p === pages).map((p, i, arr) => (
            <span key={p} className="flex">{i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 py-2 text-sg-gray9">…</span>}<Link href={href(p)} className={`px-3 py-2 border ${p === page ? 'bg-sg-ink text-white border-sg-ink' : 'border-sg-line hover:border-sg-ink'}`}>{p}</Link></span>
          ))}
          {page < pages && <Link href={href(page + 1)} className="px-3 py-2 border border-sg-line hover:border-sg-ink">›</Link>}
        </nav>
      )}
    </div>
  </>);
}
