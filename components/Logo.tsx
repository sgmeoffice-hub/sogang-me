import Link from '@/components/Link';
import type { Locale } from '@/lib/i18n';

/**
 * Official Sogang signature (좌우조합 국문·영문) + department name, following the
 * signature-block hierarchy (교표 → 학교 로고 → 대학/부서명) from the Sogang UI guide.
 */
export default function Logo({ locale, light = false, size = 'md' }: { locale: Locale; light?: boolean; size?: 'md' | 'lg' }) {
  const h = size === 'lg' ? 'h-14' : 'h-11';
  return (
    <Link href={`/${locale}`} className="flex items-center gap-3 md:gap-4 shrink-0" aria-label="서강대학교 기계공학과 Sogang University Department of Mechanical Engineering">
      <img src={light ? '/images/brand/signature-kor-eng-white.png' : '/images/brand/signature-kor-eng.png'} alt="서강대학교 Sogang University" className={`${h} w-auto`} />
      <span className={`hidden sm:block border-l pl-3 md:pl-4 leading-tight ${light ? 'border-white/40 text-white' : 'border-sg-gray4 text-sg-ink'}`}>
        <span className="block font-bold text-[17px] md:text-[19px] tracking-tight">{locale === 'en' ? 'Mechanical Engineering' : '기계공학과'}</span>
        <span className={`block text-[10.5px] md:text-[11px] tracking-[0.04em] ${light ? 'text-white/70' : 'text-sg-gray9'}`}>{locale === 'en' ? '서강대학교 기계공학과' : 'Department of Mechanical Engineering'}</span>
      </span>
    </Link>
  );
}
