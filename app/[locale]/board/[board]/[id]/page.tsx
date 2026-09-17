import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { fmtDate } from '@/components/PostCard';
import { getPost, getAdjacent } from '@/lib/data';
import { t, T, type Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import YouTube from '@/components/YouTube';
import ViewCounter from '@/components/ViewCounter';
import { toHtml, downloadUrl } from '@/lib/html';
import { boardSection, festivalCategories } from '@/lib/nav';
export const revalidate = 3600; // 관리자 저장 시 즉시 갱신되므로 길게 — 4,700여 글을 크롤러가 훑을 때 함수 호출을 줄인다

export default async function PostPage({ params }: { params: { locale: Locale; board: string; id: string } }) {
  const { locale: l, board } = params; const ko = l === 'ko';
  const p = await getPost(Number(params.id)); if (!p || p.board !== board) notFound();
  const { prev, next } = await getAdjacent(board, p.id, p.created_at);
  const html = toHtml(t(p, 'content', l));
  const [section, current] = boardSection[board] || ['board', board];
  const termLabel = (term: string) => { const m = term.match(/^(\d{4})-(\d)$/); return m ? (ko ? `${m[1]}학년도 ${m[2]}학기` : `${m[1]} ${m[2] === '1' ? 'Spring' : 'Fall'}`) : term; };
  const meta: [string, string][] = [];
  if (p.term) meta.push([ko ? '학년도·학기' : 'Term', termLabel(p.term)]);
  if (p.category) meta.push([ko ? '분야' : 'Category', festivalCategories.find((c) => c.id === p.category)?.[ko ? 'ko' : 'en'] || (ko ? p.category : (p as any).category_en || p.category)]);
  if (p.members) meta.push([ko ? '조원' : 'Members', p.members]);
  if (p.advisor) meta.push([ko ? '지도교수' : 'Advisor', p.advisor]);
  const images: { url: string; caption?: string }[] = p.images || [];
  const files: { name: string; url: string; size?: number }[] = p.attachments || [];
  const contentHasImg = /<img/i.test(html || '');
  return (<>
    <PageHero locale={l} section={section} current={current} image={p.thumbnail_url || images[0]?.url || undefined} />
    <ViewCounter id={p.id} />
    <article className="container-site py-14 max-w-4xl">
      <header className="border-b-2 border-sg-ink pb-7">
        <span className="eyebrow">{T(l, board as any) || board}</span>
        {/* 제목 크기 2.5rem→2rem (2026-09-17 박현주 선생님 요청: 본문 대비 제목이 너무 크다) */}
        <h1 className="mt-3 font-brand text-[1.6rem] md:text-[2rem] leading-snug break-keep">{t(p, 'title', l)}</h1>
        {!ko && !p.title_en && <p className="mt-2 text-[13px] text-sg-gray9">Korean original · English translation not yet available</p>}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-sg-gray9">
          <span>{T(l, 'author')} · {p.author}</span><span>{T(l, 'date')} · {fmtDate(p.created_at)}</span><span>{T(l, 'views')} · {p.view_count}</span>
        </div>
      </header>
      {meta.length > 0 && <dl className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-2 bg-sg-mist p-5 text-[14.5px]">{meta.map(([k, v]) => <div key={k} className="flex gap-3"><dt className="w-24 shrink-0 text-sg-gray9">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>}
      {p.video_url && <div className="mt-8"><YouTube url={p.video_url} title={p.title_ko} /><p className="mt-2 text-[13px] text-sg-gray9"><a href={p.video_url} target="_blank" rel="noreferrer" className="hover:text-sg-cardinal">YouTube {ko ? '에서 보기' : 'link'} ↗</a></p></div>}
      {!contentHasImg && images.length > 0 && (
        <div className={`mt-8 grid gap-3 ${images.length > 1 ? 'sm:grid-cols-2' : ''}`}>{images.map((im, i) => (
          <figure key={i}><img src={im.url} alt={im.caption || ''} className="w-full h-auto border border-sg-line" loading="lazy" />{im.caption && <figcaption className="text-[13px] text-sg-gray9 mt-1">{im.caption}</figcaption>}</figure>
        ))}</div>
      )}
      <div className="prose-sg mt-8 min-h-[120px]" dangerouslySetInnerHTML={{ __html: html || `<p class="text-sg-gray9">${ko ? '본문이 없습니다.' : 'No content.'}</p>` }} />
      {files.length > 0 && (
        <section className="mt-10 border border-sg-line p-5 bg-sg-mist/60">
          <p className="eyebrow">{T(l, 'attachments')}</p>
          <ul className="mt-3 space-y-2">{files.map((f, i) => <li key={i}><a href={downloadUrl(f.url, f.name)} download className="flex items-center gap-2 text-[15px] hover:text-sg-cardinal"><span className="text-sg-cardinal">↓</span>{f.name}{f.size ? <span className="text-[12px] text-sg-gray9">({Math.round(f.size / 1024)} KB)</span> : null}</a></li>)}</ul>
        </section>
      )}
      <nav className="mt-12 border-t border-b border-sg-line divide-y divide-sg-line text-[15px]">
        {next && <Link href={`/${l}/board/${board}/${next.id}`} className="flex gap-4 py-3.5 hover:text-sg-cardinal"><span className="w-14 shrink-0 text-sg-gray9">{ko ? '다음글' : 'Next'}</span><span className="truncate">{t(next, 'title', l)}</span></Link>}
        {prev && <Link href={`/${l}/board/${board}/${prev.id}`} className="flex gap-4 py-3.5 hover:text-sg-cardinal"><span className="w-14 shrink-0 text-sg-gray9">{ko ? '이전글' : 'Prev'}</span><span className="truncate">{t(prev, 'title', l)}</span></Link>}
      </nav>
      <p className="mt-8"><Link href={`/${l}/board/${board}`} className="btn-ghost">{T(l, 'list')}</Link></p>
    </article>
  </>);
}
