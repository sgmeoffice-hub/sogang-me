import Link from '@/components/Link';
import YouTube from './YouTube';
import { type Post, fmtDate } from './PostCard';
import { t, type Locale } from '@/lib/i18n';
import { festivalCategories } from '@/lib/nav';
import { youtubeThumb, downloadUrl } from '@/lib/html';
import { coverFor } from '@/lib/placeholder';

const termLabel = (term: string | null | undefined, ko: boolean) => {
  if (!term) return '';
  const m = term.match(/^(\d{4})-(\d)$/);
  if (m) return ko ? `${m[1]}학년도 ${m[2]}학기` : `${m[1]} · ${m[2] === '1' ? 'Spring' : 'Fall'}`;
  return term;
};
const groupBy = <T,>(arr: T[], key: (x: T) => string) => { const g: Record<string, T[]> = {}; arr.forEach((x) => { (g[key(x)] ||= []).push(x); }); return g; };

/** 전공 홍보자료: large document cards with PDF download */
export function PromoView({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const ko = locale === 'ko';
  if (!posts.length) return <p className="py-16 text-center text-sg-gray9 border border-dashed border-sg-line">{ko ? '등록된 자료가 없습니다.' : 'No materials yet.'}</p>;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {posts.map((p) => { const file = (p.attachments || [])[0]; return (
        <article key={p.id} className="card flex flex-col md:flex-row overflow-hidden">
          <Link href={`/${locale}/board/promo/${p.id}`} className="md:w-[46%] aspect-[4/3] md:aspect-auto bg-sg-mist shrink-0 overflow-hidden"><img src={p.thumbnail_url || coverFor('research', t(p, 'title', locale), p.id)} alt="" className="w-full h-full object-cover" /></Link>
          <div className="p-6 flex flex-col">
            <h3 className="text-[19px] font-bold leading-snug"><Link href={`/${locale}/board/promo/${p.id}`} className="hover:text-sg-cardinal">{t(p, 'title', locale)}</Link></h3>
            <p className="mt-2 text-[14px] text-sg-gray11 leading-relaxed line-clamp-4">{t(p, 'excerpt', locale)}</p>
            <div className="mt-auto pt-5 flex flex-wrap gap-2">
              <Link href={`/${locale}/board/promo/${p.id}`} className="btn-ghost !py-2 !px-4 !text-[13px]">{ko ? '자세히 보기' : 'Details'}</Link>
              {file && <a href={downloadUrl(file.url, (file as any).name)} download className="btn-primary !py-2 !px-4 !text-[13px]">PDF {ko ? '내려받기' : 'download'} ↓</a>}
              {file && <a href={file.url} target="_blank" rel="noreferrer" className="btn-ghost !py-2 !px-4 !text-[13px]">{ko ? '열람' : 'View'}</a>}
            </div>
          </div>
        </article>
      ); })}
    </div>
  );
}

/** 창의적종합설계: grouped by term, project table with poster thumbnails */
export function CapstoneView({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const ko = locale === 'ko';
  const groups = groupBy(posts, (p) => p.term || '');
  const terms = Object.keys(groups).sort().reverse();
  return (
    <div className="space-y-14">
      {terms.map((term) => (
        <section key={term}>
          <h2 className="font-brand text-[1.6rem] md:text-[2rem] border-b-2 border-sg-ink pb-3 mb-5 flex items-baseline gap-3">{termLabel(term, ko)}<span className="text-[13px] font-sans text-sg-gray9">{groups[term].length}{ko ? '개 조' : ' teams'}</span></h2>
          <div className="grid gap-4 md:grid-cols-2">
            {groups[term].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id).map((p, i) => {
              const poster = p.thumbnail_url || p.images?.[0]?.url;
              return (
                <Link key={p.id} href={`/${locale}/board/capstone/${p.id}`} className="card group flex gap-4 p-4">
                  <div className="w-[96px] h-[128px] shrink-0 bg-sg-mist border border-sg-line overflow-hidden grid place-items-center">{poster ? <img src={poster} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="font-brand text-3xl text-sg-gray5">{p.sort_order || i + 1}</span>}</div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-sg-cardinal">{ko ? `${p.sort_order || i + 1}조` : `Team ${p.sort_order || i + 1}`}</p>
                    <h3 className="mt-1 font-bold text-[15.5px] leading-snug group-hover:text-sg-cardinal">{t(p, 'title', locale)}</h3>
                    <dl className="mt-2 text-[13px] text-sg-gray11 space-y-0.5">
                      {p.members && <div className="flex gap-2"><dt className="shrink-0 text-sg-gray9 w-14">{ko ? '조원' : 'Members'}</dt><dd>{p.members}</dd></div>}
                      {p.advisor && <div className="flex gap-2"><dt className="shrink-0 text-sg-gray9 w-14">{ko ? '지도교수' : 'Advisor'}</dt><dd>{p.advisor}</dd></div>}
                    </dl>
                    {!poster && <p className="mt-2 text-[12px] text-sg-gray9">{ko ? '포스터 준비 중' : 'Poster coming soon'}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      {terms.length === 0 && <p className="py-16 text-center text-sg-gray9 border border-dashed border-sg-line">{ko ? '등록된 프로젝트가 없습니다.' : 'No projects yet.'}</p>}
    </div>
  );
}

/** 학술제 학부생 발표: year tabs → category groups; awards listed separately */
export function FestivalView({ posts, locale, year }: { posts: Post[]; locale: Locale; year?: string }) {
  const ko = locale === 'ko';
  const years = Array.from(new Set(posts.map((p) => (p.term || '').slice(0, 4)).filter(Boolean))).sort().reverse();
  const cur = year && years.includes(year) ? year : years[0];
  const list = posts.filter((p) => (p.term || '').startsWith(cur || ''));
  return (
    <div>
      {years.length > 0 && <div className="flex flex-wrap gap-2 mb-8">{years.map((y) => <Link key={y} href={`/${locale}/board/festival?year=${y}`} className={`px-4 py-2 text-[14px] font-semibold border ${y === cur ? 'bg-sg-ink text-white border-sg-ink' : 'border-sg-line hover:border-sg-ink'}`}>{y}</Link>)}</div>}
      {years.length === 0 && (
        <div className="py-14 px-6 text-center border border-dashed border-sg-line bg-[#fbfbfb]">
          <p className="font-bold text-[17px]">{ko ? '학술제 자료를 준비 중입니다.' : 'Festival records are being prepared.'}</p>
          <p className="mt-2 text-[14px] text-sg-gray11">{ko ? 'URECA 학부인턴 연구 · 창의적종합설계팀 연구 · 연구프로젝트팀 연구 · 학부생 수상 명단을 연도별로 등록할 수 있는 구조가 준비되어 있으며, 학과 행정팀이 보유한 과거 자료가 확보되는 대로 게시됩니다.' : 'The board is ready for URECA, capstone and research-project presentations plus award lists by year; past records will be posted once provided by the department office.'}</p>
        </div>
      )}
      {festivalCategories.map((c) => {
        const items = list.filter((p) => p.category === c.id); if (!items.length) return null;
        return (
          <section key={c.id} className="mb-12">
            <h2 className="font-brand text-[1.5rem] md:text-[1.8rem] border-b-2 border-sg-ink pb-3 mb-5">{ko ? c.ko : c.en} <span className="text-[13px] font-sans text-sg-gray9">{items.length}</span></h2>
            {c.id === 'award' ? (
              <table className="w-full text-[14.5px]"><thead><tr className="text-left text-[12px] uppercase tracking-wider text-sg-gray9 border-b border-sg-line"><th className="py-2 pr-3">{ko ? '수상' : 'Award'}</th><th className="py-2 pr-3">{ko ? '수상자' : 'Recipient'}</th><th className="py-2">{ko ? '지도교수' : 'Advisor'}</th></tr></thead>
                <tbody>{items.map((p) => <tr key={p.id} className="border-b border-sg-line"><td className="py-3 pr-3"><Link href={`/${locale}/board/festival/${p.id}`} className="font-semibold hover:text-sg-cardinal">{t(p, 'title', locale)}</Link></td><td className="py-3 pr-3">{p.members}</td><td className="py-3">{p.advisor}</td></tr>)}</tbody></table>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => { const poster = p.thumbnail_url || p.images?.[0]?.url; return (
                <Link key={p.id} href={`/${locale}/board/festival/${p.id}`} className="card group flex flex-col overflow-hidden">
                  <div className="aspect-[3/4] max-h-[260px] bg-sg-mist overflow-hidden">{poster ? <img src={poster} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-sg-gray5 text-[13px]">{ko ? '포스터 없음' : 'No poster'}</div>}</div>
                  <div className="p-4"><h3 className="font-bold text-[15px] leading-snug group-hover:text-sg-cardinal">{t(p, 'title', locale)}</h3><p className="mt-2 text-[13px] text-sg-gray11">{p.members}{p.advisor && ` · ${ko ? '지도' : 'Advisor'} ${p.advisor}`}</p></div>
                </Link>
              ); })}</div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** 기계공학도가 봐야 할 영상: grouped by category, YouTube thumbnails; first video plays inline */
export function VideosView({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const ko = locale === 'ko';
  const sorted = [...posts].sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100) || a.id - b.id);
  const groups = groupBy(sorted, (p) => (ko ? p.category : (p as any).category_en || p.category) || (ko ? '기타' : 'Other'));
  const featured = sorted[0];
  if (!sorted.length) return <p className="py-16 text-center text-sg-gray9 border border-dashed border-sg-line">{ko ? '등록된 영상이 없습니다.' : 'No videos yet.'}</p>;
  return (
    <div>
      {featured?.video_url && (
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-14 items-start">
          <YouTube url={featured.video_url} title={featured.title_ko} />
          <div><p className="eyebrow">{ko ? '추천 영상' : 'Featured'}</p><h2 className="text-[22px] font-bold mt-2 leading-snug">{t(featured, 'title', locale)}</h2>{featured.category && <p className="mt-1 text-[13px] text-sg-cardinal font-semibold">{ko ? featured.category : (featured as any).category_en || featured.category}</p>}<p className="mt-3 text-[15px] leading-relaxed text-sg-gray11">{t(featured, 'excerpt', locale)}</p></div>
        </div>
      )}
      {Object.entries(groups).map(([cat, items]) => (
        <section key={cat} className="mb-12">
          <h2 className="font-brand text-[1.5rem] md:text-[1.8rem] border-b-2 border-sg-ink pb-3 mb-5">{cat}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <Link key={p.id} href={`/${locale}/board/videos/${p.id}`} className="card group flex flex-col overflow-hidden">
                <div className="relative aspect-video bg-sg-ink overflow-hidden">
                  <img src={youtubeThumb(p.video_url) || p.thumbnail_url || coverFor('notice', t(p, 'title', locale), p.id)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <span className="absolute inset-0 grid place-items-center"><span className="w-14 h-14 rounded-full bg-[rgba(175,39,47,0.9)] grid place-items-center text-white text-xl pl-1 shadow-lg">▶</span></span>
                </div>
                <div className="p-4"><h3 className="font-bold text-[15px] leading-snug group-hover:text-sg-cardinal line-clamp-2">{t(p, 'title', locale)}</h3><p className="mt-2 text-[13px] text-sg-gray11 line-clamp-2">{t(p, 'excerpt', locale)}</p></div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
