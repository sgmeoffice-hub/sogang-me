import PageHero from '@/components/PageHero';
import FacultyCard from '@/components/FacultyCard';
import { getFaculty } from '@/lib/data';
import type { Locale } from '@/lib/i18n';
export const revalidate = 86400; // 관리자 저장 때 즉시 갱신되므로 시간 기준 갱신은 하루(Vercel 무료 한도 절약, 2026-09-26)
export default async function Emeritus({ params }: { params: { locale: Locale } }) {
  const list = await getFaculty(true);
  return (<>
    <PageHero locale={params.locale} section="faculty" current="emeritus" />
    <div className="container-site py-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((f: any) => <FacultyCard key={f.id} f={f} locale={params.locale} />)}</div>
  </>);
}
