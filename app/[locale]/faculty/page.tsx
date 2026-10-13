import PageHero from '@/components/PageHero';
import FacultyCard from '@/components/FacultyCard';
import Reveal from '@/components/Reveal';
import { emblemOf } from '@/components/FieldEmblems';
import { getFaculty } from '@/lib/data';
import { areas } from '@/content/areas';
import type { Locale } from '@/lib/i18n';
import { pageMeta, navLabel } from '@/lib/seo';
export const revalidate = 86400; // 관리자 저장 때 즉시 갱신되므로 시간 기준 갱신은 하루(Vercel 무료 한도 절약, 2026-09-26)

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  return pageMeta(params.locale, '/faculty', { title: navLabel(params.locale, '/faculty') });
}
/** 분야 칩은 같은 페이지 안의 앵커(#design 등)다. 예전의 ?field= 필터는 searchParams를 읽는 탓에 메뉴·히어로에서 바로 오는 이 페이지를
 *  방문마다 새로 그리게 해(140KB 렌더링, 위 revalidate가 무의미) Vercel 무료 한도를 갉아먹었다(2026-10-13). 옛 ?field= 주소는 무시되고 전체가 보인다. */
export default async function Faculty(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  const l = params.locale; const ko = l === 'ko';
  const all = await getFaculty(false);
  return (<>
    <PageHero locale={l} section="faculty" current="professors" />
    <div className="container-site py-12">
      <div className="flex flex-wrap items-center gap-2 mb-10">
        <a href={`/${l}/faculty`} className="px-4 py-2.5 text-[14px] font-semibold border bg-sg-ink text-white border-sg-ink">{ko ? '전체' : 'All'} <span className="opacity-60">{all.length}</span></a>
        {areas.map((a) => <a key={a.id} href={`#${a.id}`} className="px-4 py-2.5 text-[14px] font-semibold border border-sg-line hover:border-sg-ink">{ko ? a.ko : a.en}</a>)}
      </div>
      {all.length === 0 && <p className="text-sg-gray9">{ko ? '교수진 정보가 아직 등록되지 않았습니다.' : 'No faculty records yet.'}</p>}
      <div className="space-y-16">
        {areas.map((a) => {
          const E = emblemOf[a.id]; const list = all.filter((f: any) => f.field === a.id);
          if (!list.length) return null;
          return (
            <section key={a.id} id={a.id} className="scroll-mt-40">
              {/* 모바일(390px)은 엠블럼 아래로 제목을 내린다 — 긴 분야명이 120px 엠블럼 옆에서 2~3줄로 꺾이지 않게 */}
              <Reveal className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 mb-6 border-b-2 pb-4" >
                <div className="w-[84px] h-[56px] sm:w-[120px] sm:h-[80px] shrink-0" style={{ color: a.color }}><E className="w-full h-full" /></div>
                <div className="min-w-0"><h2 className="font-brand text-[1.8rem] md:text-[2.2rem] leading-tight break-keep">{ko ? a.ko : a.en}</h2><p className="text-[14px] text-sg-gray9 mt-1">{ko ? `${a.en} · ${list.length}명` : `${list.length} ${list.length === 1 ? 'professor' : 'professors'}`}</p></div>
              </Reveal>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((f: any, i: number) => <Reveal key={f.id} delay={i * 50} className="min-w-0"><FacultyCard f={f} locale={l} /></Reveal>)}</div>
            </section>
          );
        })}
        {all.filter((f: any) => !areas.some((a) => a.id === f.field)).length > 0 && (
          <section><h2 className="font-brand text-[1.8rem] mb-6 border-b-2 pb-4 break-keep">{ko ? '기타' : 'Other'}</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{all.filter((f: any) => !areas.some((a) => a.id === f.field)).map((f: any) => <FacultyCard key={f.id} f={f} locale={l} />)}</div></section>
        )}
      </div>
    </div>
  </>);
}
