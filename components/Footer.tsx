import Link from '@/components/Link';
import { T, type Locale } from '@/lib/i18n';

export default function Footer({ locale }: { locale: Locale }) {
  const ko = locale === 'ko';
  return (
    <footer className="bg-sg-gray11 text-white mt-28">
      <div className="border-b border-white/10">
        <div className="container-site py-4 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-white/75">
          <Link href={`/${locale}/policy/privacy`} className="font-semibold text-white hover:underline">{T(locale, 'privacy')}</Link>
          <Link href={`/${locale}/policy/email`} className="hover:underline">{T(locale, 'emailPolicy')}</Link>
          <Link href={`/${locale}/policy/terms`} className="hover:underline">{T(locale, 'terms')}</Link>
          <a href="https://www.sogang.ac.kr" target="_blank" rel="noreferrer" className="hover:underline">{ko ? '서강대학교' : 'Sogang University'}</a>
          <a href="https://admission.sogang.ac.kr" target="_blank" rel="noreferrer" className="hover:underline">{ko ? '입학처' : 'Admissions'}</a>
          <a href="https://gradsch.sogang.ac.kr" target="_blank" rel="noreferrer" className="hover:underline">{ko ? '대학원' : 'Graduate School'}</a>
          <a href="http://bk21me.sogang.ac.kr" target="_blank" rel="noreferrer" className="hover:underline">{ko ? 'BK21 교육연구팀' : 'BK21 FOUR'}</a>
          <a href="https://saint.sogang.ac.kr" target="_blank" rel="noreferrer" className="hover:underline">SAINT</a>
          <a href="https://library.sogang.ac.kr" target="_blank" rel="noreferrer" className="hover:underline">{ko ? '로욜라도서관' : 'Loyola Library'}</a>
        </div>
      </div>
      <div className="container-site py-10 flex flex-col md:flex-row md:items-center gap-8">
        <img src="/images/brand/signature-kor-eng-white.png" alt="서강대학교 Sogang University" className="h-12 w-auto opacity-95" />
        <div className="md:border-l md:border-white/20 md:pl-8 text-[13.5px] leading-relaxed text-white/80">
          <p className="font-semibold text-white text-[15px]">{ko ? '기계공학과' : 'Department of Mechanical Engineering'}</p>
          <p>{ko ? '04107 서울특별시 마포구 백범로 35 (신수동) 리치과학관 618호' : 'Ricci Hall 618, 35 Baekbeom-ro, Mapo-gu, Seoul 04107, Republic of Korea'}</p>
          <p>{T(locale, 'tel')} 02-705-8631 · {T(locale, 'fax')} 02-712-0799 · Email <a href="mailto:mechadmin@sogang.ac.kr" className="hover:underline text-white/90">mechadmin@sogang.ac.kr</a></p>
          <p className="mt-2 text-white/50 text-[12.5px]">COPYRIGHT © {new Date().getFullYear()} DEPARTMENT OF MECHANICAL ENGINEERING, SOGANG UNIVERSITY. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
}
