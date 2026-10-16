/**
 * 서강대 건물 목록 (국문 / 공식 영문 표기 / 약칭).
 * 영문명은 서강대 영문 홈페이지 Campus Information 표기를 따랐습니다.
 * 교수 정보에는 building 코드 + room 번호만 저장하고, 화면에서 언어에 맞게 조합합니다.
 */
export type Building = { code: string; ko: string; en: string };
export const buildings: Building[] = [
  { code: 'AS', ko: '아담샬관', en: 'Adam Schall Hall' },
  { code: 'R', ko: '리치과학관', en: 'Ricci Hall' },
  { code: 'RA', ko: '리치별관', en: 'Ricci Annex' },
  { code: 'TE', ko: '떼이야르관', en: 'Teilhard Hall' },
  { code: 'K', ko: '김대건관', en: 'Kim Daegon Hall' },
  { code: 'CY', ko: '최양업관', en: 'Choi Yangeop Hall' },
  { code: 'F', ko: '포스코 프란치스코관', en: 'POSCO Francis Hall' },
  { code: 'J', ko: '정하상관', en: 'Jeong Hasang Hall' },
  { code: 'X', ko: '하비에르관', en: 'Xavier Hall' },
  { code: 'A', ko: '본관', en: 'Administration Building' },
  { code: 'AR', ko: '아루페관', en: 'Arrupe Hall' },
  { code: 'D', ko: '다산관', en: 'Dasan Hall' },
  { code: 'MA', ko: '마태오관', en: 'Matthew Hall' },
  { code: 'E', ko: '엠마오관', en: 'Emmaus Hall' },
  { code: 'GA', ko: '삼성가브리엘관', en: 'Samsung Gabriel Hall' },
  { code: 'PA', ko: '금호아시아나바오로관', en: 'Kumho Asiana Paulus Hall' },
  { code: 'BW', ko: '베르크만스 우정원', en: 'Berchmans Woojung Hall' },
  { code: 'L', ko: '로욜라도서관', en: 'Loyola Library' },
  { code: 'GN', ko: '게페르트남덕우경제관', en: 'Geppert-Nam Duck-woo Economics Hall' },
  { code: 'IG', ko: '이냐시오관', en: 'Ignatius Hall' },
  { code: 'GO', ko: '곤자가국제학사', en: 'Gonzaga Hall' },
  { code: 'ETC', ko: '기타', en: 'Other' },
];
export const buildingOf = (code?: string | null) => buildings.find((b) => b.code === code) || null;

/** 화면 표시용 위치 문자열. building/room이 없으면 예전 자유입력(office)을 그대로 씁니다. */
export function formatOffice(f: { building?: string | null; room?: string | null; office?: string | null }, ko: boolean) {
  const b = buildingOf(f.building);
  if (b && f.room) return ko ? `${b.ko}(${b.code}) ${f.room}호` : `${b.en} (${b.code}) Room ${f.room}`;
  if (b) return ko ? `${b.ko}(${b.code})` : `${b.en} (${b.code})`;
  return f.office || '';
}
/** 기존 '아담샬관(AS) 603호' 형식 문자열을 building/room으로 분해 (마이그레이션·초기값용). */
export function parseOffice(office?: string | null): { building: string | null; room: string | null } {
  const s = (office || '').trim(); if (!s) return { building: null, room: null };
  const m = s.match(/\(([A-Z]{1,3})\)\s*([\w\-]+)\s*호?/);
  if (m) return { building: m[1], room: m[2] };
  const b = buildings.find((x) => s.startsWith(x.ko));
  const r = s.match(/([\w\-]+)\s*호/);
  return { building: b?.code || null, room: r ? r[1] : null };
}
// 2026-10-16 Hobby 전환 뒤 커밋 작성자(claude) 배포 허용 여부 확인용 주석 — 삭제해도 됨
