import PageHero from '@/components/PageHero';
import { getFacultyOne } from '@/lib/data';
import { t, T, type Locale } from '@/lib/i18n';
import { areas } from '@/content/areas';
import { researchGroupDefs } from '@/lib/groups';
import { formatOffice } from '@/lib/buildings';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { toHtml } from '@/lib/html';
export const revalidate = 3600;

export default async function FacultyDetail({ params }: { params: { locale: Locale; id: string } }) {
  const l = params.locale; const ko = l === 'ko';
  const f = await getFacultyOne(Number(params.id)); if (!f) notFound();
  const area = areas.find((a) => a.id === f.field);
  const research = toHtml(t(f, 'research', l)); const bio = toHtml(t(f, 'bio', l));
  return (<>
    <PageHero locale={l} section="faculty" current={f.is_emeritus ? 'emeritus' : f.field === 'chair' ? 'chair' : 'professors'} title={`${t(f, 'name', l)} ${t(f, 'title', l)}`} />
    <div className="container-site py-14 grid lg:grid-cols-[300px_1fr] gap-12 items-start">
      <aside>
        <div className="aspect-[3/4] max-w-[280px] bg-sg-mist overflow-hidden border border-sg-line">{f.photo_url ? <img src={f.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center font-brand text-6xl text-sg-gray5">{(f.name_ko||"").slice(0,1)}</div>}</div>
        <dl className="mt-6 space-y-3 text-[14px]">
          {f.name_en && ko && <div><dt className="eyebrow">Name</dt><dd className="mt-1">{f.name_en}</dd></div>}
          {area && <div><dt className="eyebrow">{T(l, 'field')}</dt><dd className="mt-1"><Link href={`/${l}/graduate/areas#${area.id}`} className="hover:text-sg-red">{ko ? area.ko : area.en}</Link></dd></div>}
          {t(f, 'lab', l) && <div><dt className="eyebrow">{T(l, 'lab')}</dt><dd className="mt-1">{t(f, 'lab', l)}</dd></div>}
          {formatOffice(f, ko) && <div><dt className="eyebrow">{T(l, 'office')}</dt><dd className="mt-1">{formatOffice(f, ko)}</dd></div>}
          {f.tel && <div><dt className="eyebrow">{T(l, 'tel')}</dt><dd className="mt-1 font-mono">{f.tel}</dd></div>}
          {f.email && <div><dt className="eyebrow">{T(l, 'email')}</dt><dd className="mt-1"><a href={`mailto:${f.email}`} className="hover:text-sg-red">{f.email}</a></dd></div>}
          {Array.isArray(f.groups) && f.groups.length > 0 && <div><dt className="eyebrow">{ko ? '융합연구 그룹' : 'Research groups'}</dt><dd className="mt-1 flex flex-wrap gap-1.5">{f.groups.map((g: string) => { const d = researchGroupDefs.find((x) => x.id === g); return d ? <Link key={g} href={`/${l}/graduate/groups`} className="text-[12.5px] px-2 py-0.5 bg-sg-mist border border-sg-line hover:border-sg-ink">{ko ? d.ko : d.en}</Link> : null; })}</dd></div>}
          {f.lab_url && <div><dt className="eyebrow">{T(l, 'website')}</dt><dd className="mt-1"><a href={f.lab_url} target="_blank" rel="noreferrer" className="text-sg-red underline underline-offset-4 break-all">{f.lab_url.replace(/^https?:\/\//, '')}</a></dd></div>}
        </dl>
      </aside>
      <div className="prose-sg">
        {research ? <><h2 className="!mt-0">{T(l, 'field')}</h2><div dangerouslySetInnerHTML={{ __html: research }} /></> : null}
        {bio ? <><h2>{ko ? '약력' : 'Biography'}</h2><div dangerouslySetInnerHTML={{ __html: bio }} /></> : null}
        {!research && !bio && <p className="text-sg-steel">{ko ? '상세 정보는 연구실 홈페이지를 참고해 주세요.' : 'See the laboratory website for details.'}</p>}
        <p className="mt-10"><Link href={`/${l}/faculty${f.is_emeritus ? '/emeritus' : f.field === 'chair' ? '/chair' : ''}`} className="btn-ghost !no-underline">← {T(l, 'list')}</Link></p>
      </div>
    </div>
  </>);
}
