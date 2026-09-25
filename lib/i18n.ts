export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';
export function isLocale(x: string): x is Locale { return (locales as readonly string[]).includes(x); }

/** Pick the localized field; falls back to Korean when the English version is missing. */
export function t<T extends Record<string, any>>(row: T, key: string, locale: Locale): string {
  const v = locale === 'en' ? row[`${key}_en`] || row[`${key}_ko`] : row[`${key}_ko`];
  return v ?? '';
}

/** 게시글 작성자 표시. 옛 사이트 글의 '최고관리자'(옛 게시판 프로그램의 기본 계정명)와 기본값 '기계공학과'는 학과 이름으로,
 *  영문 페이지에서는 영문으로 보여 준다(영문 목록에 한글 작성자가 남던 문제, 2026-09-25 전체 점검). 그 밖의 이름은 입력한 그대로. */
export function authorLabel(author: string | null | undefined, locale: Locale): string {
  const a = (author || '').trim();
  if (!a || a === '최고관리자' || a === '관리자' || a === '기계공학과') return locale === 'en' ? 'Dept. of ME' : '기계공학과';
  return a;
}

export const ui = {
  ko: {
    home: '홈', more: '더보기', all: '전체', search: '검색', date: '날짜', views: '조회', author: '작성자',
    attachments: '첨부파일', list: '목록', prev: '이전', next: '다음', noPosts: '등록된 게시물이 없습니다.',
    notice: '일반공지', academic: '학사공지', research: '연구성과', award: '수상', scholarship: '장학·취업정보', major: '심화전공',
    gallery: '갤러리', archive: '자료실', events: '외부 행사', reservation: '사용시설 예약', alumni_news: '동문·구성원 소식', promo: '전공 홍보자료', capstone: '창의적종합설계', festival: '학술제 학부생 발표', videos: '추천 영상',
    quick: '바로가기', seminar: '세미나실', meeting: '학과회의실', drafting: '제도실', server: '공용서버',
    ugAdmission: '학부 입학', gradAdmission: '대학원 입학', ureca: 'URECA 인턴', contact: '문의',
    readMore: '자세히 보기', professors: '전임교수', emeritus: '명예교수', lab: '연구실', office: '위치', tel: '전화',
    email: '이메일', website: '홈페이지', field: '연구분야', reserve: '예약 신청', pending: '승인 대기', approved: '확정',
    officeHours: '학과사무실', address: '주소', fax: '팩스', privacy: '개인정보처리방침', terms: '이용약관', emailPolicy: '이메일무단수집거부',
    hero1: '움직이는 모든 것의', hero2: '원리를 설계합니다',
    heroSub: '서강대학교 기계공학과는 설계·재료역학, 열·유체·에너지, 제어·진동·로보틱스, 생산공학 네 기초 분야를 바탕으로 Physical AI 시대의 융합 연구를 이끕니다.',
    since: '1993년 설립', labs: '개 연구실', profs: '명 전임교수', bk21: '4단계 BK21 교육연구팀',
    newsTitle: '학과 소식', programsTitle: '교육 프로그램', galleryTitle: '갤러리', areasTitle: '연구 분야',
    // 홈 히어로 '최신 소식' 위젯 (pinned는 게시글 고정 칩 — 예약 '승인 대기' pending과 다른 키)
    latestTitle: '최신 소식', latestSub: '모든 게시판의 최신 글', latestAll: '전체 소식', pinned: '중요',
    ug: '학부과정', grad: '대학원과정', industry: '산학협력',
    ugDesc: '130학점 심화전공과 5개 세부 분야 로드맵', gradDesc: '석사·박사·통합과정',
    urecaDesc: '학부생 연구 참여 프로그램 (Intern / Fellow)', industryDesc: '삼성전자·LG·현대모비스 채용연계 트랙',
  },
  en: {
    home: 'Home', more: 'More', all: 'All', search: 'Search', date: 'Date', views: 'Views', author: 'Author',
    attachments: 'Attachments', list: 'List', prev: 'Prev', next: 'Next', noPosts: 'No posts yet.',
    notice: 'General Notice', academic: 'Academic Notice', research: 'Research', award: 'Awards', scholarship: 'Scholarship & Careers', major: 'Advanced Major',
    gallery: 'Gallery', archive: 'Downloads', events: 'External Events', reservation: 'Facility Reservation', alumni_news: 'Alumni & Community', promo: 'Intro Materials', capstone: 'Capstone Design', festival: 'Student Research Festival', videos: 'Recommended Videos',
    quick: 'Quick links', seminar: 'Seminar room', meeting: 'Meeting room', drafting: 'Drafting room', server: 'Shared servers',
    ugAdmission: 'Undergraduate Admission', gradAdmission: 'Graduate Admission', ureca: 'URECA Intern', contact: 'Contact',
    readMore: 'Read more', professors: 'Professors', emeritus: 'Emeritus', lab: 'Laboratory', office: 'Office', tel: 'Phone',
    email: 'Email', website: 'Website', field: 'Research field', reserve: 'Request a reservation', pending: 'Pending', approved: 'Confirmed',
    officeHours: 'Department Office', address: 'Address', fax: 'Fax', privacy: 'Privacy Policy', terms: 'Terms of Use', emailPolicy: 'No Unauthorized Email Collection',
    hero1: 'We design the principles', hero2: 'behind everything that moves',
    heroSub: 'Built on four foundations — design & mechanics, thermal-fluid & energy, control-vibration-robotics, and manufacturing — Sogang Mechanical Engineering leads convergence research for the age of Physical AI.',
    since: 'Founded 1993', labs: 'research labs', profs: 'full-time faculty', bk21: 'BK21 FOUR program',
    newsTitle: 'News', programsTitle: 'Programs', galleryTitle: 'Gallery', areasTitle: 'Research areas',
    latestTitle: 'Latest News', latestSub: 'Latest across all boards', latestAll: 'All news', pinned: 'PIN',
    ug: 'Undergraduate', grad: 'Graduate', industry: 'Industry',
    ugDesc: '130-credit intensive major with five specialization roadmaps', gradDesc: 'MS, PhD and integrated programs',
    urecaDesc: 'Undergraduate research experience (Intern / Fellow)', industryDesc: 'Samsung, LG and Hyundai Mobis hiring-linked tracks',
  },
} as const;
export type UIKey = keyof typeof ui.ko;
export const T = (l: Locale, k: UIKey) => ui[l][k];
