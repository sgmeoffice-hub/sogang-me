import Link from '@/components/Link';
import PageHero from '@/components/PageHero';
import ReservationForm from '@/components/ReservationForm';
import ReservationCalendar from '@/components/ReservationCalendar';
import { getReservations, first } from '@/lib/data';
import { facilities } from '@/lib/nav';
import { T, type Locale } from '@/lib/i18n';
import { facultyNames, peopleEn } from '@/lib/names';
import { pageMeta, navLabel } from '@/lib/seo';
export const revalidate = 3600; // 신청(/api/reservations)·관리자 처리 때 즉시 갱신되므로 30초 → 1시간(2026-09-25 전송량 절감)

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  return pageMeta(params.locale, '/reservation', { title: navLabel(params.locale, '/reservation') });
}
export default async function Reservation(
  props: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ f?: string | string[]; y?: string | string[]; m?: string | string[] }> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const l = params.locale; const ko = l === 'ko';
  // 같은 키가 반복된 주소(?f=a&f=b)는 배열로 오므로 first()로 첫 값만(2026-10-13). 기본 시설은 사용 빈도가 가장 높은 첫 항목(학과회의실)
  const fq = first(searchParams.f);
  const facility = facilities.some((x) => x.id === fq) ? fq : facilities[0].id;
  const now = new Date(Date.now() + 9 * 3600 * 1000); // KST 기준 (서버는 UTC)
  const cur = now.getUTCFullYear();
  // 연도는 작년~내년만 — 2000~2100을 허용하던 때는 달력의 이전/다음 달 링크가 끝없는 크롤 공간이 되어 스크레이퍼가 월마다 함수 호출·조회 캐시를 쌓았다(2026-10-13 무료 한도).
  // 예약 자료는 1년 보관(개인정보처리방침)이라 그 밖의 달은 어차피 비어 있다. 범위 밖·잘못된 값이면 404 대신 이번 달로(봇도 같은 한 페이지로 모이고 사용자는 달력을 잃지 않는다).
  const minY = cur - 1, maxY = cur + 1;
  const yN = Number(first(searchParams.y)); const mN = Number(first(searchParams.m));
  const y = Number.isInteger(yN) && yN >= minY && yN <= maxY ? yN : cur;
  const m = Number.isInteger(mN) && mN >= 1 && mN <= 12 ? mN : now.getUTCMonth() + 1;
  const raw = await getReservations(facility, y, m);
  // 예약자 칸은 국문으로 입력된다("정헌재 교수님") → 영문 페이지에서는 교수는 공식 영문 이름, 학생 이름은 로마자로(일반 낱말은 그대로)
  const names = ko ? [] : await facultyNames();
  const rows = ko ? raw : (raw as any[]).map((r) => ({ ...r, user_name: peopleEn(names, r.user_name, 3) }));
  // 이전/다음 달 링크도 위 범위를 벗어나지 않는다(끝에서는 제자리 링크)
  const prev = m === 1 ? (y > minY ? { y: y - 1, m: 12 } : { y, m }) : { y, m: m - 1 };
  const next = m === 12 ? (y < maxY ? { y: y + 1, m: 1 } : { y, m }) : { y, m: m + 1 };
  const fac = facilities.find((x) => x.id === facility)!;
  const todayStr = now.toISOString().slice(0, 10);
  const href = (yy: number, mm: number) => `/${l}/reservation?f=${facility}&y=${yy}&m=${mm}`;
  return (<>
    <PageHero locale={l} section="board" current="reservation" />
    <div className="container-site py-12">
      <div className="flex flex-wrap gap-2 mb-6">
        {facilities.map((f) => <Link key={f.id} href={`/${l}/reservation?f=${f.id}&y=${y}&m=${m}`} className={`px-4 py-2 text-[13px] border ${f.id === facility ? 'bg-sg-ink text-white border-sg-ink' : 'border-sg-line hover:border-sg-ink'}`}>{ko ? f.ko : f.en}</Link>)}
      </div>
      <div className="text-[13px] text-sg-steel mb-6 space-y-1 break-keep">
        <p>{ko ? '* 예약은 아래 신청 양식으로 요청하시거나 학과사무실(02-705-8631)로 문의해 주세요. 신청 즉시 캘린더에 「승인 대기」로 표시되어 겹치는 시간에는 신청할 수 없으며, 학과사무실 승인 후 확정으로 바뀝니다.' : '* Request a reservation with the form below or contact the department office (+82-2-705-8631). New requests appear on the calendar immediately as “pending”, overlapping requests are blocked, and slots are confirmed once approved.'}</p>
        <p>{ko ? '* 랩미팅처럼 같은 시간에 여러 날짜를 한 번에 예약(정기 예약)하거나 여러 건을 묶어 예약하려면 학과사무실(02-705-8631, mechadmin@sogang.ac.kr)로 연락해 주세요.' : '* For recurring bookings (e.g. weekly lab meetings) or multiple bookings at once, please contact the department office (+82-2-705-8631, mechadmin@sogang.ac.kr).'}</p>
      </div>
      <ReservationCalendar y={y} m={m} rows={rows as any} ko={ko} todayStr={todayStr}
        title={`${ko ? `${y}년 ${m}월` : new Date(y, m - 1).toLocaleString('en', { month: 'long', year: 'numeric' })} · ${ko ? fac.ko : fac.en}`}
        prevHref={href(prev.y, prev.m)} nextHref={href(next.y, next.m)} />
      <h2 className="h-section mt-14 mb-6">{T(l, 'reserve')}</h2>
      {/* key: 시설 탭은 같은 경로 안의 이동이라 폼이 재사용된다 — key가 없으면 select의 defaultValue(마운트 때만 적용)와 '접수 완료' 상태가 이전 시설 것으로 남아 다른 시설로 신청됐다 */}
      <ReservationForm key={facility} locale={l} facility={facility} />
    </div>
  </>);
}
