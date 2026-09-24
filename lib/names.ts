import { createPublicClient } from './supabase-server';
import type { NameRow } from './names-core';
export { namesIn, namesPrompt, enforceNames, type NameRow } from './names-core';

/** 교수 공식 영문 이름 용어집 — faculty 테이블(name_ko/name_en, lab_ko/lab_en)에서 읽어 번역에 쓴다.
 *  행정선생님은 지금처럼 국문으로만 쓰면 되고, 번역기가 이름을 제멋대로 로마자화("Seok-Hwan Jeong", "Shin Chung-soo")하는 것을
 *  ① 프롬프트 용어집 ② 후처리 치환(lib/names-core.ts) 두 겹으로 막는다 (2026-09-24 책임자 요청). 교수 정보를 /adm에서 고치면 10분 안에 반영. */
let cache: { at: number; rows: NameRow[] } | null = null;

export async function facultyNames(): Promise<NameRow[]> {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.rows;
  try {
    const sb = createPublicClient();
    const { data } = await sb.from('faculty').select('name_ko,name_en,lab_ko,lab_en').eq('published', true);
    const rows: NameRow[] = (data || []).filter((r: any) => r.name_ko && r.name_en)
      .map((r: any) => ({ ko: String(r.name_ko).trim(), en: String(r.name_en).trim().replace(/\s+/g, ' '), labKo: r.lab_ko, labEn: r.lab_en }));
    cache = { at: Date.now(), rows };
    return rows;
  } catch { return cache?.rows ?? []; }
}
