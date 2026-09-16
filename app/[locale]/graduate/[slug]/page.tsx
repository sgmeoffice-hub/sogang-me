import Link from 'next/link';
import StaticPage from '@/components/StaticPage';
import AcademicCalendar from '@/components/Calendar';
import Reveal from '@/components/Reveal';
import { emblemOf } from '@/components/FieldEmblems';
import { researchAreas } from '@/content/pages-grad';
import { researchGroupDefs } from '@/lib/groups';
import { getFaculty } from '@/lib/data';
import { areas } from '@/content/areas';
import { formatOffice } from '@/lib/buildings';
import type { Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
export const revalidate = 3600;

export default async function Grad({ params }: { params: { locale: Locale; slug: string } }) {
  const { locale: l, slug } = params; const ko = l === 'ko';
  if (slug === 'calendar') return <StaticPage locale={l} section="graduate" slug="calendar"><AcademicCalendar locale={l} /></StaticPage>;

  /* 기초전공분야 — 연구실 목록은 교수진(DB)에서 자동 생성됩니다. 교수 정보만 수정하면 이 표가 따라 바뀝니다. */
  if (slug === 'areas') {
    const faculty = await getFaculty(false);
    return (
      <StaticPage locale={l} section="graduate" slug="areas">
        <div className="space-y-16">
          {researchAreas.map((a) => {
            const E = emblemOf[a.id];
            const labs = faculty.filter((f: any) => f.field === a.id && f.lab_ko);
            const color = areas.find((x) => x.id === a.id)?.color;
            return (
              <section key={a.id} id={a.id} className="scroll-mt-40">
                <div className="flex items-center gap-5 border-t-2 border-sg-ink pt-6">
                  {E && <div className="w-[110px] h-[74px] shrink-0" style={{ color }}><E className="w-full h-full" /></div>}
                  <div>
                    <h2 className="font-brand text-[1.7rem] md:text-[2.1rem] leading-tight">{ko ? a.ko : a.en}</h2>
                    <p className="text-[13.5px] text-sg-gray9 mt-1">{ko ? `${a.en} · ${labs.length}개 연구실` : `${labs.length} ${labs.length === 1 ? 'laboratory' : 'laboratories'}`}</p>
                  </div>
                </div>
                <p className="mt-4 text-[15.5px] leading-relaxed text-[#2a2d33]">{ko ? a.descKo : a.descEn}</p>
                {a.courses && ko && <p className="mt-2 text-[13.5px] text-sg-gray9"><span className="font-semibold text-sg-ink">교과목:</span> {a.courses}</p>}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-[14.5px]">
                    <thead><tr className="text-left text-[12px] uppercase tracking-wider text-sg-gray9 border-b border-sg-line">
                      <th className="py-2 pr-3">{ko ? '연구실' : 'Laboratory'}</th><th className="py-2 pr-3">{ko ? '지도교수' : 'Advisor'}</th><th className="py-2 pr-3">{ko ? '위치' : 'Office'}</th><th className="py-2">{ko ? '전화' : 'Phone'}</th></tr></thead>
                    <tbody>
                      {labs.map((f: any) => (
                        <tr key={f.id} className="border-b border-sg-line align-top">
                          <td className="py-3 pr-3">
                            {f.lab_url ? <a href={f.lab_url} target="_blank" rel="noreferrer" className="font-semibold hover:text-sg-cardinal">{ko ? f.lab_ko : f.lab_en || f.lab_ko}</a> : <span className="font-semibold">{ko ? f.lab_ko : f.lab_en || f.lab_ko}</span>}
                            {ko && f.lab_en && <span className="block text-[12.5px] text-sg-gray9">{f.lab_en}</span>}
                          </td>
                          <td className="py-3 pr-3 whitespace-nowrap"><Link href={`/${l}/faculty/${f.id}`} className="hover:text-sg-cardinal">{ko ? f.name_ko : f.name_en || f.name_ko}</Link></td>
                          <td className="py-3 pr-3 text-[13.5px]">{formatOffice(f, ko)}</td>
                          <td className="py-3 text-[13.5px]">{f.tel}</td>
                        </tr>
                      ))}
                      {labs.length === 0 && <tr><td colSpan={4} className="py-4 text-sg-gray9">{ko ? '등록된 연구실이 없습니다.' : 'No laboratories registered.'}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </StaticPage>
    );
  }

  /* 융합 및 응용연구 그룹 — 교수 정보의 "소속 연구그룹" 값으로 자동 구성됩니다. */
  if (slug === 'groups') {
    const faculty = await getFaculty(false);
    return (
      <StaticPage locale={l} section="graduate" slug="groups">
        <p className="prose-sg">{ko ? '서강대학교 기계공학과는 설계 및 재료역학, 열·유체 및 에너지, 제어·진동·로보틱스, 생산공학 등 4개의 기초전공분야를 바탕으로 다음과 같은 융합 및 응용연구를 수행하고 있습니다.' : 'Building on four foundational areas — design & mechanics, thermal-fluids & energy, control-vibration-robotics and manufacturing — the department conducts the following convergence and applied research.'}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {researchGroupDefs.map((g, i) => {
            const members = faculty.filter((f: any) => Array.isArray(f.groups) && f.groups.includes(g.id));
            if (!members.length) return null;
            return (
              <Reveal key={g.id} delay={i * 60}>
                <section className="card p-6 h-full">
                  <div className="flex items-baseline justify-between gap-3 border-b border-sg-line pb-3">
                    <h2 className="text-[19px] font-bold">{ko ? g.ko : g.en}</h2>
                    <span className="text-[12.5px] text-sg-gray9 shrink-0">{members.length}{ko ? '명' : ''}</span>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {members.map((f: any) => (
                      <li key={f.id} className="text-[14.5px]">
                        <Link href={`/${l}/faculty/${f.id}`} className="font-semibold hover:text-sg-cardinal">{ko ? f.name_ko : f.name_en || f.name_ko}</Link>
                        <span className="block text-[13px] text-sg-gray11">{ko ? f.lab_ko : f.lab_en || f.lab_ko}{formatOffice(f, ko) ? ` · ${formatOffice(f, ko)}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            );
          })}
        </div>
      </StaticPage>
    );
  }

  if (!['admission', 'curriculum'].includes(slug)) notFound();
  return <StaticPage locale={l} section="graduate" slug={slug} />;
}
