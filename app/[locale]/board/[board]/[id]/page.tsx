import Link from '@/components/Link';
import PageHero from '@/components/PageHero';
import { fmtDate } from '@/components/PostCard';
import { getPost, getAdjacent, isCanonicalId } from '@/lib/data';
import { t, T, authorLabel, isLocale, type Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import YouTube from '@/components/YouTube';
import ViewCounter from '@/components/ViewCounter';
import { toHtml, wrapTables, downloadUrl } from '@/lib/html';
import { normalizeHtml } from '@/lib/html-normalize';
import { boardSection, festivalCategories } from '@/lib/nav';
import { facultyNames, peopleEn } from '@/lib/names';
import { termLabel } from '@/components/BoardViews';   // 목록(캡스톤·학술제)과 같은 표기(Spring 2026 / 2026학년도 1학기)
import { pageMeta, plainExcerpt } from '@/lib/seo';
export function generateStaticParams() { return []; }   // 선언해야 요청 시 만든 페이지가 캐시된다(ISR) — 없으면 매 요청 DB 조회
export const revalidate = 604800; // 관리자 저장·자동 번역·일괄 수정(/api/admin/revalidate) 때 즉시 갱신되므로 시간 기준 갱신은 1주 — 4,700여 글을 크롤러가 훑을 때 DB 전송량(2026-09-25)과 Vercel 무료 한도(재생성 CPU, 2026-09-26)를 아낀다

export async function generateMetadata(props: { params: Promise<{ locale: Locale; board: string; id: string }> }) {
  const params = await props.params;
  // 점이 든 로케일 조각(/x.y/board/…)은 미들웨어를 거치지 않고 여기까지 온다 — 레이아웃의 notFound()보다 먼저 돌아가는 generateMetadata가 DB에 묻지 않게 로케일부터 검사(2026-10-13: 오류가 캐시되지 않는 500으로 새어 탐침마다 호출 비용이 들던 것)
  if (!isLocale(params.locale) || !isCanonicalId(params.id)) notFound(); // '02420'·'2420.0' 같은 별칭 주소는 DB 조회 없이 404(별칭마다 ISR 항목이 따로 쌓이던 것, 2026-10-13 무료 한도)
  const l = params.locale; const p = await getPost(Number(params.id), l);
  if (!p || p.board !== params.board) return {};
  return pageMeta(l, `/board/${p.board}/${p.id}`, { title: t(p, 'title', l), description: t(p, 'excerpt', l) || plainExcerpt(t(p, 'content', l)) || undefined });
}

export default async function PostPage(props: { params: Promise<{ locale: Locale; board: string; id: string }> }) {
  const params = await props.params;
  const { locale: l, board } = params; const ko = l === 'ko';
  if (!isLocale(l) || !isCanonicalId(params.id)) notFound(); // generateMetadata와 같은 검사
  const p = await getPost(Number(params.id), l); if (!p || p.board !== board) notFound();
  const { prev, next } = await getAdjacent(board, p.id, p.created_at);
  const html = wrapTables(normalizeHtml(toHtml(t(p, 'content', l))));
  const [section, current] = boardSection[board] || ['board', board];
  const meta: [string, string][] = [];
  if (p.term) meta.push([ko ? '학년도·학기' : 'Term', termLabel(p.term, ko)]);
  if (p.category) meta.push([ko ? '분야' : 'Category', festivalCategories.find((c) => c.id === p.category)?.[ko ? 'ko' : 'en'] || (ko ? p.category : (p as any).category_en || p.category)]);
  // 조원·지도교수는 국문으로 입력되므로 영문 페이지에서는 교수는 공식 영문 이름("정석환 교수" → "Prof. Seokhwan Jeong"), 학생은 로마자로
  const names = !ko && (p.members || p.advisor) ? await facultyNames() : [];
  if (p.members) meta.push([ko ? '조원' : 'Members', ko ? p.members : peopleEn(names, p.members)]);
  if (p.advisor) meta.push([ko ? '지도교수' : 'Advisor', ko ? p.advisor : peopleEn(names, p.advisor)]);
  const images: { url: string; caption?: string }[] = p.images || [];
  const files: { name: string; url: string; size?: number }[] = p.attachments || [];
  // '대표 이미지 / 갤러리 사진'에 올린 사진은 본문 위에 자동으로 보인다 — 본문에 이미 들어 있는 사진(같은 주소)만 뺀다.
  // 예전에는 본문에 사진이 한 장이라도 있으면 갤러리 사진을 전부 숨겨, 공지에 사진을 올려도 안 보였다(2026-10-30 박현주 선생님 요청).
  const body = html || '';
  const topImages = images.filter((im) => im?.url && !body.includes(im.url) && !body.includes(im.url.replace(/&/g, '&amp;')));
  return (<>
    <PageHero locale={l} section={section} current={current} image={p.thumbnail_url || images[0]?.url || undefined} />
    <ViewCounter id={p.id} />
    <article className="container-site py-14 max-w-4xl">
      <header className="border-b-2 border-sg-ink pb-7">
        <span className="eyebrow">{T(l, board as any) || board}</span>
        {/* 제목 크기 2.5rem→2rem (2026-09-17 박현주 선생님 요청: 본문 대비 제목이 너무 크다) */}
        <h1 className="mt-3 font-brand text-[1.6rem] md:text-[2rem] leading-snug break-keep break-words">{t(p, 'title', l)}</h1>
        {!ko && (!p.title_en || (!p.content_en && /[가-힣]/.test((p.content_ko || '').replace(/<[^>]+>/g, '')))) && <p className="mt-2 text-[13px] text-sg-gray9">Korean original · English translation not yet available</p>}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-sg-gray9">
          <span>{T(l, 'author')} · {authorLabel(p.author, l)}</span><span>{T(l, 'date')} · {fmtDate(p.created_at)}</span><span>{T(l, 'views')} · {p.view_count}</span>
        </div>
      </header>
      {meta.length > 0 && <dl className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-2 bg-sg-mist p-5 text-[14.5px]">{meta.map(([k, v]) => <div key={k} className="flex gap-3"><dt className="w-24 shrink-0 text-sg-gray9">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>}
      {p.video_url && <div className="mt-8"><YouTube url={p.video_url} title={p.title_ko} /><p className="mt-2 text-[13px] text-sg-gray9"><a href={p.video_url} target="_blank" rel="noreferrer" className="hover:text-sg-cardinal">{ko ? 'YouTube에서 보기' : 'YouTube link'} ↗</a></p></div>}
      {/* 갤러리 게시판은 사진첩처럼 2열, 그 밖의 게시판(공지 포스터 등)은 옛 홈페이지처럼 한 장씩 본문 폭으로 */}
      {topImages.length > 0 && (
        <div className={`mt-8 grid gap-3 ${board === 'gallery' && topImages.length > 1 ? 'sm:grid-cols-2' : ''}`}>{topImages.map((im, i) => (
          <figure key={im.url + i}><img src={im.url} alt={im.caption || ''} className="w-full h-auto border border-sg-line" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />{im.caption && <figcaption className="text-[13px] text-sg-gray9 mt-1 break-keep">{im.caption}</figcaption>}</figure>
        ))}</div>
      )}
      <div className="prose-sg mt-8 min-h-[120px]" dangerouslySetInnerHTML={{ __html: html || `<p class="text-sg-gray9">${ko ? '본문이 없습니다.' : 'No content.'}</p>` }} />
      {files.length > 0 && (
        <section className="mt-10 border border-sg-line p-5 bg-[#fafafa]">
          <p className="eyebrow">{T(l, 'attachments')}</p>
          <ul className="mt-3 space-y-2">{files.map((f, i) => <li key={i}><a href={downloadUrl(f.url, f.name)} download className="flex items-start gap-2 text-[15px] hover:text-sg-cardinal"><span className="text-sg-cardinal shrink-0">↓</span><span className="min-w-0 break-all">{f.name}{f.size ? <span className="ml-1.5 whitespace-nowrap text-[12px] text-sg-gray9">({Math.round(f.size / 1024)} KB)</span> : null}</span></a></li>)}</ul>
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
