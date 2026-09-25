/** 영문 페이지 표시용 한글 이름 로마자 표기 — 게시글 영문 번역과 같은 관례(이름 먼저, 붙여 쓰기: 표리원 → Riwon Pyo).
 *  교수는 교수진 표의 공식 영문 이름(lib/names-core koNamesToEn)을 먼저 적용하고, 남은 학생 이름에만 쓴다.
 *  이름처럼 생긴 낱말(성씨로 시작하는 2~4음절)만 바꾸고 일반 낱말은 그대로 둔다. DB에는 저장하지 않는다. */

const SURNAME: Record<string, string> = {
  김: 'Kim', 이: 'Lee', 박: 'Park', 최: 'Choi', 정: 'Jeong', 강: 'Kang', 조: 'Cho', 윤: 'Yoon', 장: 'Jang', 임: 'Lim',
  한: 'Han', 오: 'Oh', 서: 'Seo', 신: 'Shin', 권: 'Kwon', 황: 'Hwang', 안: 'Ahn', 송: 'Song', 전: 'Jeon', 홍: 'Hong',
  유: 'Yoo', 고: 'Ko', 문: 'Moon', 양: 'Yang', 손: 'Son', 배: 'Bae', 백: 'Baek', 허: 'Heo', 노: 'Noh', 남: 'Nam',
  심: 'Shim', 하: 'Ha', 곽: 'Kwak', 성: 'Seong', 차: 'Cha', 주: 'Joo', 우: 'Woo', 구: 'Koo', 민: 'Min', 류: 'Ryu',
  나: 'Na', 진: 'Jin', 지: 'Ji', 엄: 'Eom', 채: 'Chae', 원: 'Won', 천: 'Cheon', 방: 'Bang', 공: 'Kong', 현: 'Hyun',
  함: 'Ham', 변: 'Byun', 염: 'Yeom', 여: 'Yeo', 추: 'Choo', 도: 'Do', 석: 'Seok', 설: 'Seol', 마: 'Ma', 길: 'Gil',
  연: 'Yeon', 위: 'Wi', 표: 'Pyo', 명: 'Myung', 기: 'Ki', 반: 'Ban', 왕: 'Wang', 금: 'Keum', 옥: 'Ok', 육: 'Yuk',
  인: 'In', 맹: 'Maeng', 제: 'Je', 모: 'Mo', 탁: 'Tak', 국: 'Kook', 어: 'Eo', 은: 'Eun', 편: 'Pyeon', 용: 'Yong',
  예: 'Ye', 경: 'Kyung', 봉: 'Bong', 사: 'Sa', 부: 'Boo', 소: 'So', 선: 'Sun', 라: 'Ra', 피: 'Pi', 빈: 'Bin',
};
const DOUBLE_SURNAME: Record<string, string> = { 황보: 'Hwangbo', 남궁: 'Namgung', 제갈: 'Jegal', 선우: 'Sunwoo', 독고: 'Dokgo', 사공: 'Sagong', 서문: 'Seomun' };

const INI = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const MED = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const FIN = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

/** 국어의 로마자 표기법(음절별, 이름은 동화 없이) + 이름에서 흔한 관용 표기 두 가지: 받침 없는 '우' → woo(진우 Jinwoo), '현' → hyun */
function syllables(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c > 11171) { out += ch; continue; }
    const i = Math.floor(c / 588), m = Math.floor((c % 588) / 28), f = c % 28;
    if (i === 11 && m === 13 && f === 0) { out += 'woo'; continue; }
    out += INI[i] + MED[m] + FIN[f];
  }
  return out.replace(/hyeon/g, 'hyun');
}
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "구지훈" → "Jihun Koo", "황보민" → "Min Hwangbo". 이름 모양이 아니면 null */
export function romanizeName(ko: string): string | null {
  const s = ko.trim();
  if (!/^[가-힣]{2,4}$/.test(s)) return null;
  const two = s.slice(0, 2);
  if (s.length >= 3 && DOUBLE_SURNAME[two]) return `${cap(syllables(s.slice(2)))} ${DOUBLE_SURNAME[two]}`;
  const fam = SURNAME[s[0]];
  if (!fam || s.length > 3) return null;   // 4음절은 복성만 인정(일반 낱말 오변환 방지)
  return `${cap(syllables(s.slice(1)))} ${fam}`;
}

/** 성씨 글자로 시작하지만 이름이 아닌 흔한 낱말(예약 신청자 칸 등에 섞여 들어올 수 있음) */
const STOP = new Set(['연구실', '사무실', '조교', '전공', '정기', '기타', '구조', '이상', '이하', '정보', '정리', '조사', '조립', '신청', '신입', '장비', '장학', '강의', '강의실', '회의', '회의실', '세미나', '미팅', '학과', '학생', '교수', '교수님', '대학원', '학부', '학부생', '석사', '박사', '인턴', '연구', '연구원', '연구팀', '발표', '시험', '면접', '행사', '수업', '전체', '공동', '공용', '서버', '기계', '기계과', '설명회', '유지', '보수', '정비', '고장', '안전', '교육', '진행', '예약', '변경', '취소']);

/** 쉼표·공백·괄호로 나뉜 목록 안의 한글 이름만 로마자로("김선빈, 이창호" → "Seonbin Kim, Changho Lee").
 *  minLen=3이면 두 글자 낱말은 건드리지 않는다(자유 입력 칸용 — '조교' 같은 낱말 오변환 방지). */
export function romanizeNamesIn(s: string | null | undefined, minLen = 2): string {
  const v = s || '';
  if (!/[가-힣]/.test(v)) return v;
  return v.replace(/(^|[\s,·/(])([가-힣]{2,4})(?=$|[\s,·/)])/g, (m, pre, name) => {
    if (name.length < minLen || STOP.has(name)) return m;
    const r = romanizeName(name);
    return r ? pre + r : m;
  });
}
