/** 교수 영문 이름 정규화 — 순수 함수(DB 접근 없음). 번역 후처리(lib/translate.ts)와 일괄 보정 스크립트가 함께 쓴다. */
export type NameRow = { ko: string; en: string; labKo?: string | null; labEn?: string | null };

const esc = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** "Seokhwan" → S[-\s]?e[-\s]?o… : 하이픈·공백이 어디에 끼어도, 대소문자가 달라도 잡는다 */
const loose = (w: string) => w.replace(/[-\s]/g, '').split('').map(esc).join('[-\\s]?');

/** 흔한 성씨 이형 — 번역기가 정(Jeong)을 Jung/Chung으로, 신(Shin)을 Sin으로 쓰는 경우 */
const FAMILY_ALIASES: Record<string, string[]> = {
  jeong: ['jung', 'chung', 'jeoung', 'cheong', 'jong'], kim: ['gim', 'ghim'], lee: ['yi', 'rhee', 'li', 'ri'], choi: ['choe', 'choy', 'chwe'],
  park: ['bak', 'pak'], shin: ['sin', 'synn'], cho: ['jo', 'joe', 'joh'], son: ['sohn', 'sonn'], hur: ['heo', 'huh', 'her', 'ho'],
  jeon: ['chun', 'jun', 'jeun', 'chon', 'chen'], kang: ['gang', 'khang'], song: ['soung'], chung: ['jeong', 'jung'], kwon: ['gwon', 'kweon'],
  jang: ['chang'], yoon: ['yun', 'youn'], lim: ['im', 'rim'], han: ['hahn'], oh: ['o'], seo: ['suh', 'sur'], moon: ['mun'], yang: ['ryang'],
};
/** 이름(given name)의 자음 골격: 모음·하이픈 제거, 유사 자음 통합 → Seokhwan/Suk-hwan/Seok-Hwan 이 모두 같은 키 */
export function skeleton(given: string): string {
  return given.toLowerCase().replace(/[^a-z]/g, '')
    .replace(/ch/g, 'j').replace(/sh/g, 's').replace(/ph/g, 'p').replace(/th/g, 't')
    .replace(/k/g, 'g').replace(/p/g, 'b').replace(/t/g, 'd').replace(/r/g, 'l').replace(/c/g, 'g')
    .replace(/[aeiouwyh]/g, '');   // h도 제거: Nahmkeon/Nam-geon, Seokhwan/Suk-hwan 이 같은 키가 되게
}

/** 번역 결과의 변형 로마자를 공식 표기로 바꾼다. rows 는 원문에 등장하는 교수만 넘길 것.
 *  1단계: 같은 철자에 하이픈·공백·성-이름 순서만 다른 경우 (Seok-Hwan Jeong / Jeong Seok-hwan / Jeong, Seokhwan)
 *  2단계: 성이 같거나 흔한 이형이고 이름의 자음 골격이 같은 경우 (Shin Chung-soo → Choongsoo Shin, Jung Suk-hwan → Seokhwan Jeong) */
export function enforceNames(rows: NameRow[], s: string): string {
  let out = s;
  for (const r of rows) {
    const parts = r.en.split(' ');
    if (parts.length < 2) continue;
    const family = parts[parts.length - 1]; const given = parts.slice(0, -1).join('');
    const g = loose(given), f = loose(family);
    out = out.replace(new RegExp(`(^|[^A-Za-z])(?:${g}\\s+${f}|${f},?\\s+${g})(?![A-Za-z])`, 'gi'), (_m, pre) => pre + r.en);

    const fams = [family.toLowerCase(), ...(FAMILY_ALIASES[family.toLowerCase()] || [])].map(esc).join('|');
    const sk = skeleton(given);
    const cand = '[A-Z][a-z]+(?:[- ]?[A-Za-z][a-z]*)?'; // Chung-soo / Chung Soo / Chungsoo
    // 대소문자 무시로 찾되, 성·이름 모두 대문자로 시작하는 토큰만 인정한다 ("sin 함수" 같은 일반 단어 배제)
    const cap = (w: string) => /^[A-Z]/.test(w);
    // 성 + 이름
    out = out.replace(new RegExp(`(^|[^A-Za-z])(${fams}),?\\s+(${cand})(?![A-Za-z])`, 'gi'), (m, pre, fam, gv) => cap(fam) && cap(gv) && skeleton(gv) === sk ? pre + r.en : m);
    // 이름 + 성
    out = out.replace(new RegExp(`(^|[^A-Za-z])(${cand})\\s+(${fams})(?![A-Za-z])`, 'gi'), (m, pre, gv, fam) => cap(fam) && cap(gv) && skeleton(gv) === sk ? pre + r.en : m);
  }
  return out;
}

/** 원문(국문)에 실제로 등장하는 교수만 추린다 — 프롬프트를 짧게 유지하고 엉뚱한 'Kim'을 건드리지 않기 위해 */
export function namesIn(rows: NameRow[], koText: string): NameRow[] {
  return rows.filter((r) => koText.includes(r.ko) || (r.labKo && koText.includes(r.labKo)));
}

export function namesPrompt(rows: NameRow[]): string {
  if (!rows.length) return '';
  return `\n- Faculty names: use EXACTLY these official romanizations (given name first, this spelling and hyphenation). Never re-romanize them:\n` +
    rows.map((r) => `  ${r.ko} = ${r.en}${r.labKo && r.labEn ? `; ${r.labKo} = ${r.labEn}` : ''}`).join('\n');
}
