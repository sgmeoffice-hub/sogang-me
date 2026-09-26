import Link from '@/components/Link';
import StaticPage from '@/components/StaticPage';
import AcademicCalendar from '@/components/Calendar';
import UrecaForm from '@/components/UrecaForm';
import SlideDeck from '@/components/SlideDeck';
import Reveal from '@/components/Reveal';
import { emblemOf } from '@/components/FieldEmblems';
import { majorFields, introCourse, introSlides } from '@/content/majors';
import { getFaculty } from '@/lib/data';
import type { Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';
export const revalidate = 86400; // 관리자 저장 때 즉시 갱신되므로 시간 기준 갱신은 하루(Vercel 무료 한도 절약, 2026-09-26)
export function generateStaticParams() { return []; }   // 선언해야 요청 시 만든 페이지가 캐시된다(ISR) — 없으면 매 요청 DB 조회(2026-09-25)
const slugs = ['admission', 'majors', 'curriculum', 'competency', 'calendar', 'activities', 'ureca'];

export default async function UG({ params }: { params: { locale: Locale; slug: string } }) {
  const { locale: l, slug } = params; const ko = l === 'ko';
  if (!slugs.includes(slug)) notFound();
  if (slug === 'calendar') return <StaticPage locale={l} section="undergraduate" slug="calendar"><AcademicCalendar locale={l} /></StaticPage>;
  if (slug === 'ureca') {
    const labs = (await getFaculty(false)).filter((f: any) => f.lab_ko);
    return (
      <StaticPage locale={l} section="undergraduate" slug="ureca">
        <div className="mt-12 border-t-2 border-sg-ink pt-8">
          <p className="eyebrow">URECA Intern</p>
          <h2 className="h-sub mt-2 mb-2">{ko ? 'URECA 인턴 지원하기' : 'Apply for URECA Intern'}</h2>
          <p className="text-[15px] text-sg-gray11 mb-6">{ko ? '기계공학과 2~4학년 학생은 아래 양식으로 지원할 수 있습니다. 지원 기간(봄학기·여름방학·가을학기·겨울방학)을 선택하고 지망 연구실을 1·2·3순위로 표시하세요. 1지망부터 순서대로 해당 교수님께서 선발 여부를 결정하며, 선발되면 학과사무실에 서약서를 제출한 후 인턴이 시작됩니다.' : 'ME students in years 2–4 may apply below. Choose the term and rank up to three labs. Professors decide in order of preference; selected students submit a pledge to the department office before starting.'}</p>
          <UrecaForm locale={l} labs={labs as any} />
        </div>
      </StaticPage>
    );
  }
  if (slug === 'majors') return (
    <StaticPage locale={l} section="undergraduate" slug="majors">
      <div className="-mt-2">
        <p className="eyebrow">{ko ? '전공소개' : 'Major Fields'}</p>
        <h2 className="h-section mt-2">{ko ? '기계공학의 네 가지 기초 분야' : 'Four foundational fields of mechanical engineering'}</h2>
        <p className="mt-4 text-[17px] leading-relaxed text-sg-gray11 max-w-3xl">{ko ? '기계공학은 설계·역학, 열·유체, 제어·진동·로보틱스, 생산·제조라는 네 기둥 위에 서 있습니다. 각 분야는 고유한 학문 체계를 바탕으로 자동차, 항공우주, 에너지, 반도체, 바이오 등 모든 산업을 떠받치며, 네 분야가 만나 로봇과 Physical AI 같은 융합 영역으로 확장됩니다.' : 'Mechanical engineering stands on four pillars — design and mechanics, thermal and fluids, control-vibration-robotics, and manufacturing. Each is a discipline in its own right, underpinning every industry from automotive and aerospace to energy, semiconductors and bio, and together they converge into fields such as robotics and Physical AI.'}</p>
        <div className="mt-10 border border-sg-line bg-[#fcfcfc] p-5 md:p-10">
          <div className="max-w-xl mx-auto bg-sg-ink text-white text-center px-6 py-5">
            <div className="flex items-center justify-center gap-3">
              <svg viewBox="0 0 48 48" className="w-9 h-9 md:w-11 md:h-11 shrink-0" aria-hidden>
                <g stroke="currentColor" strokeWidth=".7" opacity=".35">
                  <line x1="9" y1="12" x2="24" y2="9" /><line x1="9" y1="12" x2="24" y2="24" /><line x1="9" y1="12" x2="24" y2="39" />
                  <line x1="9" y1="24" x2="24" y2="9" /><line x1="9" y1="24" x2="24" y2="24" /><line x1="9" y1="24" x2="24" y2="39" />
                  <line x1="9" y1="36" x2="24" y2="9" /><line x1="9" y1="36" x2="24" y2="24" /><line x1="9" y1="36" x2="24" y2="39" />
                  <line x1="24" y1="9" x2="39" y2="18" /><line x1="24" y1="9" x2="39" y2="30" />
                  <line x1="24" y1="24" x2="39" y2="18" /><line x1="24" y1="24" x2="39" y2="30" />
                  <line x1="24" y1="39" x2="39" y2="18" /><line x1="24" y1="39" x2="39" y2="30" />
                </g>
                <g fill="currentColor">
                  <circle cx="9" cy="12" r="2.4"><animate attributeName="opacity" values=".55;1;.55" dur="2.4s" begin="0s" repeatCount="indefinite" /></circle>
                  <circle cx="9" cy="24" r="2.4"><animate attributeName="opacity" values=".55;1;.55" dur="2.4s" begin=".4s" repeatCount="indefinite" /></circle>
                  <circle cx="9" cy="36" r="2.4"><animate attributeName="opacity" values=".55;1;.55" dur="2.4s" begin=".8s" repeatCount="indefinite" /></circle>
                  <circle cx="24" cy="9" r="2.4"><animate attributeName="opacity" values=".55;1;.55" dur="2.4s" begin=".6s" repeatCount="indefinite" /></circle>
                  <circle cx="24" cy="24" r="2.4"><animate attributeName="opacity" values=".55;1;.55" dur="2.4s" begin="1s" repeatCount="indefinite" /></circle>
                  <circle cx="24" cy="39" r="2.4"><animate attributeName="opacity" values=".55;1;.55" dur="2.4s" begin="1.4s" repeatCount="indefinite" /></circle>
                  <circle cx="39" cy="18" r="2.4"><animate attributeName="opacity" values=".55;1;.55" dur="2.4s" begin="1.2s" repeatCount="indefinite" /></circle>
                  <circle cx="39" cy="30" r="2.4"><animate attributeName="opacity" values=".55;1;.55" dur="2.4s" begin="1.6s" repeatCount="indefinite" /></circle>
                </g>
                <circle r="1.4" fill="#d86018"><animateMotion dur="2.4s" repeatCount="indefinite" path="M9 12 L24 24 L39 18" /></circle>
                <circle r="1.4" fill="#d86018"><animateMotion dur="3s" begin="1.1s" repeatCount="indefinite" path="M9 36 L24 9 L39 30" /></circle>
              </svg>
              <p className="font-brand text-[1.35rem] md:text-[1.6rem] leading-tight">Physical AI</p>
            </div>
            <p className="mt-1.5 text-[13.5px] md:text-[14px] leading-relaxed text-white/80 break-keep">{ko ? '실제 세계에서 작동하는 지능형 기계 — 디지털 지능과 기계공학 하드웨어가 하나의 시스템으로 만납니다.' : 'Intelligent machines that work in the real world — digital intelligence and mechanical hardware meet as one system.'}</p>
          </div>
          <div className="hidden md:block h-6 w-px mx-auto" style={{ backgroundColor: 'rgba(26,26,26,.3)' }} />
          <div className="hidden md:block h-px mx-[12.5%]" style={{ backgroundColor: 'rgba(26,26,26,.3)' }} />
          <div className="hidden md:grid grid-cols-4">{[0, 1, 2, 3].map((n) => <div key={n} className="h-6 w-px mx-auto" style={{ backgroundColor: 'rgba(26,26,26,.3)' }} />)}</div>
          <div className="mt-5 md:mt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {(ko ? [
              { id: 'design', name: '설계 · 역학', role: '골격과 근육', desc: '하중을 견디고 정밀하게 움직이는 몸체와 구동 구조를 설계합니다.' },
              { id: 'thermal', name: '열 · 유체', role: '혈관과 호흡', desc: '모터·배터리·반도체의 발열을 관리해 지속적인 구동을 보장합니다.' },
              { id: 'control', name: '제어 · 진동 · 로보틱스', role: '두뇌와 신경', desc: '센서와 AI를 기계에 연결해 판단하고 움직임을 제어합니다.' },
              { id: 'manufacturing', name: '생산 · 제조', role: '실체로 만드는 손', desc: '정밀 가공과 신소재로 설계를 실제 기계로 구현하고 양산합니다.' },
            ] : [
              { id: 'design', name: 'Design & Mechanics', role: 'Skeleton & Muscles', desc: 'Designs bodies and drive structures that bear loads and move with precision.' },
              { id: 'thermal', name: 'Thermal & Fluids', role: 'Circulation & Breathing', desc: 'Manages the heat of motors, batteries and chips for sustained operation.' },
              { id: 'control', name: 'Control, Vibration & Robotics', role: 'Brain & Nerves', desc: 'Connects sensors and AI to machines to decide and control motion.' },
              { id: 'manufacturing', name: 'Manufacturing', role: 'Hands that Build', desc: 'Realizes and mass-produces designs with precision machining and new materials.' },
            ]).map((c) => (
              <a key={c.id} href={`#${c.id}`} className="block bg-white border border-sg-line p-4 md:p-5 hover:border-sg-cardinal hover:shadow-sm transition-all">
                <p className="text-[11.5px] font-semibold tracking-wider text-sg-cardinal uppercase">{c.role}</p>
                <p className="mt-1 font-bold text-[15px] leading-snug break-keep">{c.name}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-sg-gray11 break-keep">{c.desc}</p>
              </a>
            ))}
          </div>
          <p className="mt-5 text-center text-[12.5px] text-sg-gray9">{ko ? '각 분야를 누르면 아래 상세 설명으로 이동합니다' : 'Select a field to jump to its details below'}</p>
        </div>
      </div>
      <div className="mt-16 space-y-10">
        {majorFields.map((f, i) => { const E = emblemOf[f.id]; return (
          <Reveal key={f.id}>
            <section id={f.id} className="scroll-mt-40 grid md:grid-cols-[220px_1fr] gap-6 md:gap-10 border-t border-sg-line pt-8">
              <div><div className="w-full max-w-[220px] text-sg-cardinal"><E className="w-full h-auto" /></div><p className="mt-2 text-[13px] font-semibold text-sg-gray9">{String(i + 1).padStart(2, '0')}{ko ? ` · ${f.en}` : ''}</p></div>
              <div>
                <p className="eyebrow">{ko ? f.tagKo : f.tagEn}</p>
                <h3 className="font-brand text-[1.7rem] md:text-[2.1rem] mt-1 leading-tight">{ko ? f.ko : f.en}</h3>
                {ko && <p className="mt-2 text-[15px] font-semibold text-sg-gray11">{f.summaryKo}</p>}
                <p className="mt-4 text-[16px] leading-[1.85]">{ko ? f.bodyKo : f.bodyEn}</p>
                <div className="mt-5"><p className="text-[12.5px] font-semibold tracking-wider text-sg-gray9 uppercase mb-2">{ko ? '관련 교과목' : 'Related courses'}</p><ul className="flex flex-wrap gap-2">{(ko ? f.courses : (f as any).coursesEn || f.courses).map((c: string) => <li key={c} className="text-[13px] px-3 py-1 bg-sg-mist border border-sg-line">{c}</li>)}</ul></div>
              </div>
            </section>
          </Reveal>
        ); })}
      </div>
      <section className="mt-16 bg-sg-mist border-l-4 border-sg-cardinal p-6 md:p-8">
        <p className="eyebrow">{ko ? '1학년·자유전공학부 학생 추천 교과목' : 'Recommended for first-year & liberal-major students'}</p>
        <h3 className="text-[20px] font-bold mt-2">{ko ? introCourse.ko.name : introCourse.en.name} <span className="text-[13px] font-normal text-sg-gray9">MEE1006</span></h3>
        <p className="mt-3 text-[15.5px] leading-relaxed">{ko ? introCourse.ko.desc : introCourse.en.desc}</p>
      </section>
      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div><p className="eyebrow">{ko ? '전공소개 자료' : 'Introduction deck'}</p><h3 className="h-sub mt-1">{ko ? '자유전공학부 학생을 위한 전공 안내' : 'Major guide for liberal-major students'}</h3></div>
          <Link href={`/${l}/board/promo`} className="text-[14px] font-semibold text-sg-cardinal hover:underline">{ko ? '전공 홍보자료 게시판 →' : 'All intro materials →'}</Link>
        </div>
        <SlideDeck slides={introSlides} download="/docs/sogang-me-physical-ai-intro.pdf" label={ko ? '서강대 기계공학과 전공소개 (Physical AI)' : 'Sogang ME · Physical AI'} />
      </section>
    </StaticPage>
  );
  return <StaticPage locale={l} section="undergraduate" slug={slug} />;
}
