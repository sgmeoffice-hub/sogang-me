/** 시설 예약 공통 규칙 — 공개 신청 폼·API·관리자 화면이 같은 값을 쓴다. */

/** 30분 단위 시간 슬롯 (06:00 ~ 23:30). 그 외 분 단위는 입력 불가. */
export const TIME_SLOTS: string[] = Array.from({ length: (24 - 6) * 2 }, (_, i) => {
  const h = 6 + Math.floor(i / 2); const m = i % 2 ? '30' : '00';
  return `${String(h).padStart(2, '0')}:${m}`;
});
/** 시작은 마지막 슬롯(23:30) 제외, 종료는 첫 슬롯 제외 + 자정(24:00) 허용 — 짝이 없는 경계값을 폼에서 아예 고를 수 없게. */
export const START_SLOTS = TIME_SLOTS.slice(0, -1);
export const END_SLOTS = [...TIME_SLOTS.slice(1), '24:00'];
/** 운영 시간(06:00~23:30, 종료는 24:00까지) 안의 30분 단위만 — '25:00'·'00:00' 같은 값이 통과하던 문제(2026-10-13). 관리자 수정의 '(기존)' 시각은 readResv의 kept()가 따로 허용. */
export const isHalfHour = (t: string) => /^(?:(?:0[6-9]|1\d|2[0-3]):(?:00|30)|24:00)(?::00)?$/.test(t);
export const isDateStr = (s: string | null | undefined) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

export const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

/** 'YYYY-MM-DD'에 n일을 더한다 (UTC 기준 계산이라 날짜 문자열만 다룬다). */
export const addDays = (d: string, n: number) => {
  const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

export type Repeat = 'none' | 'weekly' | 'biweekly';
export const REPEAT_MAX = 30;

/** 반복 등록 날짜 목록: 시작일부터 종료일까지 매주/격주. 최대 REPEAT_MAX건. */
export function repeatDates(start: string, repeat: Repeat, until?: string | null): string[] {
  if (repeat === 'none' || !until || until < start) return [start];
  const step = repeat === 'weekly' ? 7 : 14;
  const out: string[] = [];
  for (let d = start; d <= until && out.length < REPEAT_MAX; d = addDays(d, step)) out.push(d);
  return out;
}

export const monthRange = (y: number, m: number) => {
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const endD = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start, end: `${y}-${String(m).padStart(2, '0')}-${endD}`, days: endD };
};
