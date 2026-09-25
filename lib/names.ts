import { unstable_cache } from 'next/cache';
import { createPublicClient } from './supabase-server';
import type { NameRow } from './names-core';
import { koNamesToEn } from './names-core';
import { romanizeNamesIn } from './romanize';
export { namesIn, namesPrompt, enforceNames, koNamesToEn, type NameRow } from './names-core';

/** 교수 공식 영문 이름 용어집 — faculty 테이블(name_ko/name_en, lab_ko/lab_en)에서 읽어 번역에 쓴다.
 *  행정선생님은 지금처럼 국문으로만 쓰면 되고, 번역기가 이름을 제멋대로 로마자화("Seok-Hwan Jeong", "Shin Chung-soo")하는 것을
 *  ① 프롬프트 용어집 ② 후처리 치환(lib/names-core.ts) 두 겹으로 막는다 (2026-09-24 책임자 요청). 교수 정보를 /adm에서 고치면 10분 안에 반영. */
let cache: { at: number; rows: NameRow[] } | null = null;
/** 관리자가 교수 정보를 저장하면 바로 새 이름표를 쓰도록 캐시를 비운다(같은 서버 인스턴스 기준, 나머지는 10분 안에 갱신) */
export function clearFacultyNamesCache() { cache = null; fresh = true; }
let fresh = false;

async function readFacultyNames(): Promise<NameRow[]> {
  const sb = createPublicClient();
  const { data, error } = await sb.from('faculty').select('name_ko,name_en,lab_ko,lab_en').eq('published', true);
  if (error) throw new Error(error.message);
  return (data || []).filter((r: any) => r.name_ko && r.name_en)
    .map((r: any) => ({ ko: String(r.name_ko).trim(), en: String(r.name_en).trim().replace(/\s+/g, ' '), labKo: r.lab_ko, labEn: r.lab_en }));
}
/** 요청마다 새로 그리는 목록·예약 페이지에서도 DB를 매번 읽지 않도록 1시간 캐시(태그 'site' — 교수 저장 시 refreshSite로 비움) */
const facultyNamesCached = unstable_cache(readFacultyNames, ['facultyNames'], { revalidate: 3600, tags: ['site'] });

export async function facultyNames(): Promise<NameRow[]> {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.rows;
  try {
    // 관리자가 교수 정보를 저장한 직후에는 캐시를 건너뛰고 DB에서 바로 읽는다(새 이름을 곧바로 번역에 쓰기 위해)
    const rows = fresh ? await readFacultyNames() : await facultyNamesCached();
    fresh = false;
    cache = { at: Date.now(), rows };
    return rows;
  } catch { return cache?.rows ?? []; }
}

/** 영문 페이지의 사람 이름 칸(조원·지도교수·예약자): 교수는 공식 영문 이름, 나머지 한글 이름은 로마자(표리원 → Riwon Pyo).
 *  minLen=3: 자유 입력 칸(예약자)에서는 두 글자 낱말을 이름으로 보지 않는다. */
export function peopleEn(rows: NameRow[], s: string | null | undefined, minLen = 2): string {
  return romanizeNamesIn(koNamesToEn(rows, s), minLen);
}
