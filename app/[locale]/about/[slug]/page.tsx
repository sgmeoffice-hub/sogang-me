import StaticPage from '@/components/StaticPage';
import { history } from '@/content/pages-about';
import type { Locale } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export const revalidate = 86400; // 관리자 저장 때 즉시 갱신되므로 시간 기준 갱신은 하루(Vercel 무료 한도 절약, 2026-09-26)
// 빈 배열이라도 선언해야 요청 시 한 번 만든 페이지를 캐시(ISR)한다 — 없으면 매 요청 DB 조회(2026-09-25 Supabase 전송량 원인)
export function generateStaticParams() { return []; }

export default async function AboutPage({ params }: { params: { locale: Locale; slug: string } }) {
  const { locale: l, slug } = params;
  const ko = l === 'ko';
  if (slug === 'history') {
    const decades = ['1990', '2000', '2010', '2020'];
    return (
      <StaticPage locale={l} section="about" slug={slug}>
        <p className="eyebrow">SINCE 1993</p>
        <div className="mt-8 space-y-12">
          {decades.map((d) => {
            const items = history.filter((h) => h.y.startsWith(d.slice(0, 3)));
            if (!items.length) return null;
            return (
              <section key={d} className="grid md:grid-cols-[120px_1fr] gap-6">
                <h2 className="font-mono text-3xl font-medium text-sg-red">{d}s</h2>
                <ol className="relative border-l border-sg-line pl-8 space-y-5">
                  {items.map((h, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[37px] top-1.5 w-2.5 h-2.5 bg-sg-red rounded-full ring-4 ring-white" />
                      <span className="font-mono text-[12px] text-sg-steel">{h.y}.{h.m}</span>
                      <p className="mt-0.5 text-[15px]">{ko ? h.ko : h.en}</p>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      </StaticPage>
    );
  }
  if (slug === 'location') {
    const addr = ko ? '04107 서울특별시 마포구 백범로 35 (신수동) 리치과학관 618호 기계공학과 학과사무실' : 'Ricci Hall (R) Room 618, 35 Baekbeom-ro, Mapo-gu, Seoul 04107, Korea';
    return (
      <StaticPage locale={l} section="about" slug={slug}>
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
          <div className="prose-sg">
            <h2 className="!mt-0">{ko ? '학과사무실' : 'Department office'}</h2>
            <table><tbody>
              <tr><th>{ko ? '주소' : 'Address'}</th><td>{addr}</td></tr>
              <tr><th>{ko ? '전화' : 'Phone'}</th><td><a href="tel:+8227058631">02-705-8631</a></td></tr>
              <tr><th>{ko ? '팩스' : 'Fax'}</th><td>02-712-0799</td></tr>
            </tbody></table>
            <h2>{ko ? '대중교통' : 'Public transport'}</h2>
            <table><tbody>
              <tr><th>{ko ? '지하철' : 'Subway'}</th><td>{ko ? '2호선 신촌역 6번 출구 도보 8분 · 6호선 대흥역 1번 출구 도보 12분' : 'Line 2 Sinchon Station Exit 6, 8 min walk · Line 6 Daeheung Station Exit 1, 12 min walk'}</td></tr>
              <tr><th>{ko ? '버스' : 'Bus'}</th><td>110, 153, 604, 740, 5714, 7016, 7613, 921</td></tr>
            </tbody></table>
            <p><a href="https://www.sogang.ac.kr/ko/campus-map" target="_blank" rel="noreferrer">{ko ? '학내 건물 배치도 →' : 'Campus map →'}</a></p>
          </div>
          <div className="border border-sg-line aspect-[4/3] bg-sg-mist overflow-hidden">
            <iframe title="map" className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src="https://maps.google.com/maps?q=%EC%84%9C%EA%B0%95%EB%8C%80%ED%95%99%EA%B5%90+%EB%A6%AC%EC%B9%98%EA%B3%BC%ED%95%99%EA%B4%80&t=&z=16&ie=UTF8&iwloc=&output=embed" />
          </div>
        </div>
      </StaticPage>
    );
  }
  if (!['goals', 'intro'].includes(slug)) notFound();
  return <StaticPage locale={l} section="about" slug={slug} />;
}
