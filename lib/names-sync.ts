import type { SupabaseClient } from '@supabase/supabase-js';
import { enforceNames, type NameRow } from './names-core';
import { serviceClient, saveVersion } from './vault';

/**
 * 교수 영문 이름을 관리자 화면에서 저장하면, 그 교수의 한글 이름이 나오는 기존 게시글의 영문도 새 표기로 맞춘다.
 * (신임 교수 등록 전에 번역된 글·표기를 바꾼 경우 예전 글이 옛 표기로 남던 빈틈, 2026-09-25 책임자 제안)
 * 새 글은 번역할 때 교수진 표를 용어집으로 읽으므로(lib/names.ts) 여기서는 기존 글만 다룬다.
 * 고친 글(id·board)을 돌려주고, 호출하는 쪽이 그 글의 페이지만 갱신한다(lib/refresh.ts). 고치기 전 내용은 수정 이력(vault)에 남긴다(2026-10-13).
 */
export async function syncFacultyNameInPosts(sb: SupabaseClient, r: NameRow, by?: string): Promise<{ id: number; board: string }[]> {
  if (!r.ko?.trim() || !r.en?.trim() || !/^[가-힣]{2,5}$/.test(r.ko.trim())) return [];
  const ko = r.ko.trim(); const en = r.en.trim().replace(/\s+/g, ' ');
  // 수정 이력용 서비스 클라이언트 — 키가 없는 환경(미리보기 배포)에서는 이력 없이 최대 1,000건을 고쳐 쓰지 않도록 동기화 자체를 건너뛴다
  let svc: SupabaseClient; try { svc = serviceClient(); } catch { return []; }
  const { data } = await sb.from('posts').select('*')
    .or(`title_ko.ilike.%${ko}%,excerpt_ko.ilike.%${ko}%,content_ko.ilike.%${ko}%`).limit(1000);
  // 과잉 치환 차단: 국문 칸에 교수 이름이 n번이면 영문 칸의 공식 표기도 n번을 넘을 수 없다 — 자음 골격 매칭(names-core 2단계)이 성이 같은
  // 학생 이름(Seungwon Kang → Sungwon Kang 등)까지 교수로 바꾸던 사고를 저장 전에 거른다(2026-10-13). 걸린 칸은 손대지 않는다.
  const count = (s: string, needle: string) => (needle ? String(s || '').split(needle).length - 1 : 0);
  const changed: { id: number; board: string }[] = [];
  for (const p of data || []) {
    const upd: Record<string, string> = {};
    for (const [koF, enF] of [['title_ko', 'title_en'], ['excerpt_ko', 'excerpt_en'], ['content_ko', 'content_en']] as const) {
      const v = p[enF]; if (!v) continue;
      const nv = enforceNames([{ ...r, ko, en }], v);
      if (nv === v) continue;
      if (count(nv, en) > Math.max(1, count(p[koF], ko))) { console.warn(`names-sync: post ${p.id} ${enF} 건너뜀(교수 이름이 국문보다 많이 생김)`); continue; }
      upd[enF] = nv;
    }
    if (!Object.keys(upd).length) continue;
    try { await saveVersion(svc, p, by); } catch (e: any) { console.error('names-sync history', e?.message); continue; }   // 이력을 못 남기면 고치지 않는다
    const { error } = await sb.from('posts').update({ ...upd, updated_at: new Date().toISOString() }).eq('id', p.id);
    if (!error) changed.push({ id: p.id, board: p.board });
  }
  return changed;
}
