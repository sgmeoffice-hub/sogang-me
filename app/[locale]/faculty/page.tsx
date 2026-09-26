import PageHero from '@/components/PageHero';
import FacultyCard from '@/components/FacultyCard';
import Reveal from '@/components/Reveal';
import { emblemOf } from '@/components/FieldEmblems';
import { getFaculty } from '@/lib/data';
import { areas } from '@/content/areas';
import type { Locale } from '@/lib/i18n';
export const revalidate = 86400; // 관리자 저장 때 즉시 갱신되므로 시간 기준 갱신은 하루(Vercel 무료 한도 절약, 2026-09-26)

export default async function Faculty({ params, searchParams }: { params: { locale: Locale }; searchParams: { field?: string } }) {
  const l = params.locale; const ko = l === 'ko';
  const all = await getFaculty(false);
  const field = searchParams.field || '';
  const shown = field ? areas.filter((a) => a.id === field) : areas;
  return (<>
    <PageHero locale={l} section="faculty" current="professors" />
    <div className="container-site py-12">
      <div className="flex flex-wrap items-center gap-2 mb-10">
        <a href={`/${l}/faculty`} className={`px-4 py-2.5 text-[14px] font-semibold border ${!field ? 'bg-sg-ink text-white border-sg-ink' : 'border-sg-line hover:border-sg-ink'}`}>{ko ? '전체' : 'All'} <span className="opacity-60">{all.length}</span></a>
        {areas.map((a) => <a key={a.id} href={`/${l}/faculty?field=${a.id}`} className={`px-4 py-2.5 text-[14px] font-semibold border ${field === a.id ? 'text-white border-transparent' : 'border-sg-line hover:border-sg-ink'}`} style={field === a.id ? { background: a.color } : {}}>{ko ? a.ko : a.en}</a>)}
      </div>
      {all.length === 0 && <p className="text-sg-gray9">{ko ? '교수진 정보가 아직 등록되지 않았습니다.' : 'No faculty records yet.'}</p>}
      <div className="space-y-16">
        {shown.map((a) => {
          const E = emblemOf[a.id]; const list = all.filter((f: any) => f.field === a.id);
          if (!list.length) return null;
          return (
            <section key={a.id} id={a.id} className="scroll-mt-40">
              <Reveal className="flex items-center gap-5 mb-6 border-b-2 pb-4" >
                <div className="w-[120px] h-[80px] shrink-0" style={{ color: a.color }}><E className="w-full h-full" /></div>
                <div><h2 className="font-brand text-[1.8rem] md:text-[2.2rem] leading-tight">{ko ? a.ko : a.en}</h2><p className="text-[14px] text-sg-gray9 mt-1">{ko ? `${a.en} · ${list.length}명` : `${list.length} ${list.length === 1 ? 'professor' : 'professors'}`}</p></div>
              </Reveal>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((f: any, i: number) => <Reveal key={f.id} delay={i * 50} className="min-w-0"><FacultyCard f={f} locale={l} /></Reveal>)}</div>
            </section>
          );
        })}
        {!field && all.filter((f: any) => !areas.some((a) => a.id === f.field)).length > 0 && (
          <section><h2 className="font-brand text-[1.8rem] mb-6 border-b-2 pb-4">{ko ? '기타' : 'Other'}</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{all.filter((f: any) => !areas.some((a) => a.id === f.field)).map((f: any) => <FacultyCard key={f.id} f={f} locale={l} />)}</div></section>
        )}
      </div>
    </div>
  </>);
}
