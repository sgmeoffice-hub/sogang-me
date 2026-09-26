import Link from '@/components/Link';
import { t, T, type Locale } from '@/lib/i18n';
import { areas } from '@/content/areas';
import { formatOffice } from '@/lib/buildings';

export default function FacultyCard({ f, locale }: { f: any; locale: Locale }) {
  const ko = locale === 'ko';
  const area = areas.find((a) => a.id === f.field);
  return (
    <Link href={`/${locale}/faculty/${f.id}`} className="card group relative flex min-w-0 gap-5 p-5 md:p-6 overflow-hidden">
      <span className="absolute left-0 top-0 h-full w-1.5" style={{ background: area?.color || 'var(--sg-gray5)' }} />
      <div className="w-[104px] h-[124px] shrink-0 bg-sg-mist overflow-hidden relative">
        {f.photo_url ? <img src={f.photo_url} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="absolute inset-0 grid place-items-center text-sg-gray5 text-3xl font-brand">{(f.name_ko || '').slice(0, 1)}</div>}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[20px] font-bold leading-tight group-hover:text-sg-cardinal transition-colors">{t(f, 'name', locale)} <span className="text-[14px] font-medium text-sg-gray9">{t(f, 'title', locale)}</span></h3>
        {f.name_en && ko && <p className="text-[12.5px] text-sg-gray9 tracking-wide">{f.name_en}</p>}
        <p className="mt-2 text-[14.5px] font-medium leading-snug">{t(f, 'lab', locale)}</p>
        {area && <p className="mt-1 text-[12.5px] font-semibold" style={{ color: area.color }}>{ko ? area.ko : area.en}</p>}
        <dl className="mt-3 space-y-0.5 text-[13px] text-sg-gray11">
          {formatOffice(f, ko) && <div className="flex gap-2"><dt className="w-10 shrink-0 text-sg-gray9">{T(locale, 'office')}</dt><dd className="truncate">{formatOffice(f, ko)}</dd></div>}
          {f.tel && <div className="flex gap-2"><dt className="w-10 shrink-0 text-sg-gray9">{T(locale, 'tel')}</dt><dd>{f.tel}</dd></div>}
          {f.email && <div className="flex gap-2"><dt className="w-10 shrink-0 text-sg-gray9">{T(locale, 'email')}</dt><dd className="truncate">{f.email}</dd></div>}
        </dl>
      </div>
    </Link>
  );
}
