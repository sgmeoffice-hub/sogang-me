/** 학과 고유명사 표기 통일표. AI 번역 프롬프트와 후처리에 함께 사용합니다. */
export const glossary: [string, string][] = [
  ['서강대학교', 'Sogang University'],
  ['기계공학과', 'Department of Mechanical Engineering'],
  ['학과사무실', 'the department office'],
  ['자유전공학부', 'the School of Liberal Studies'],
  ['대한기계학회', 'the Korean Society of Mechanical Engineers (KSME)'],
  ['한국소음진동공학회', 'the Korean Society for Noise and Vibration Engineering (KSNVE)'],
  ['한국연구재단', 'the National Research Foundation of Korea (NRF)'],
  ['과학기술정보통신부', 'the Ministry of Science and ICT'],
  ['아담샬관', 'Adam Schall Hall'],
  ['리치과학관', 'New Ricci Hall'],
  ['리치별관', 'Ricci Annex'],
  ['떼이야르관', 'Teilhard Hall'],
  ['김대건관', 'Kim Daegon Hall'],
  ['최양업관', 'Choi Yangeop Hall'],
  ['포스코 프란치스코관', 'POSCO Francis Hall'],
  ['정하상관', 'Jeong Hasang Hall'],
  ['하비에르관', 'Xavier Hall'],
  ['로욜라도서관', 'Loyola Library'],
  ['창의적종합설계', 'Creative Integrated Design (Capstone Design)'],
  ['학부연구프로그램', 'the Undergraduate Research Program (URECA)'],
  ['석박통합과정', 'the integrated MS–PhD program'],
  ['석사과정', "the master's program"],
  ['박사과정', 'the doctoral program'],
  ['학술제', 'the department research festival'],
  ['교학팀', 'the academic affairs team'],
  ['공과대학', 'the College of Engineering'],
];

/** 무료 번역기에 보내기 전 국문 원문에 먼저 적용하는 치환 — 번역기가 자주 틀리는 고유명사·표현을 영어로 박아 둔다.
 *  (2026-09-25 전체 점검에서 발견: 인지컨트롤스 → "Cognitive Controls", "26년 하반기" → "the 26th year", "전기 일반대학원" → "Electric General Graduate School")
 *  한글 낱말만 바꾸므로 번역 단위의 서식 표지(⟦n⟧)에는 영향이 없다. 긴 이름을 먼저 적는다. */
const preKoRules: [RegExp, string][] = [
  // 두 자리 연도: "26년 하반기", "26년도" → 2026 (번역기가 '26번째 해'로 옮김)
  [/(^|[^0-9])(2\d)년\s*(상반기|하반기)/g, '$120$2년 $3'],
  [/(^|[^0-9])(2\d)년도/g, '$120$2년도'],
  // 대학원 입시의 전기/후기 = 봄/가을 학기 입학 (전기(電氣)로 오역)
  [/전기\s*(?=(일반|특수|전문)?\s*대학원|모집|신입생|입학|입시|원서)/g, '봄학기 입학 '],
  [/후기\s*(?=(일반|특수|전문)?\s*대학원|모집|신입생|입학|입시|원서)/g, '가을학기 입학 '],
  // 회사·기관 고유명사
  [/인지컨트롤스/g, 'INZI Controls'],
  [/두산에너빌리티/g, 'Doosan Enerbility'],
  [/현대모비스/g, 'Hyundai Mobis'],
  [/현대자동차그룹/g, 'Hyundai Motor Group'],
  [/현대자동차/g, 'Hyundai Motor Company'],
  [/한화오션/g, 'Hanwha Ocean'],
  [/한화에어로스페이스/g, 'Hanwha Aerospace'],
  [/한화에너지/g, 'Hanwha Energy'],
  [/금호석유화학그룹/g, 'Kumho Petrochemical Group'],
  [/금호석유화학/g, 'Kumho Petrochemical'],
  [/삼성전자/g, 'Samsung Electronics'],
  [/SK하이닉스/g, 'SK hynix'],
  [/LG이노텍/g, 'LG Innotek'],
  [/LG전자/g, 'LG Electronics'],
  [/LG디스플레이/g, 'LG Display'],
  [/한국전력공사/g, 'Korea Electric Power Corporation (KEPCO)'],
  // 교내 건물(번역기가 음역을 망가뜨림) — 후처리 표와 같은 표기
  [/포스코\s*프란치스코관/g, 'POSCO Francis Hall'],
  [/아담샬관/g, 'Adam Schall Hall'],
  [/리치과학관/g, 'New Ricci Hall'],
  [/떼이야르관/g, 'Teilhard Hall'],
  [/김대건관/g, 'Kim Daegon Hall'],
  [/정하상관/g, 'Jeong Hasang Hall'],
];
export function preKo(s: string): string {
  let out = s;
  for (const [re, to] of preKoRules) out = out.replace(re, to);
  return out;
}

export const glossaryPrompt = glossary.map(([k, v]) => `${k} = ${v}`).join('\n');

/** 번역 결과에 남은 한국어 고유명사·표기 오류를 보정합니다. */
export function polishEnglish(s: string): string {
  let out = s;
  for (const [ko, en] of glossary) out = out.split(ko).join(en);
  return out
    .replace(/Adam Shall Hall/g, 'Adam Schall Hall')
    .replace(/(\d+)\s*호/g, 'Room $1')
    .replace(/([A-Za-z)\]])\s*교수/g, '$1')
    .replace(/\s{2,}/g, ' ');
}
