import type { SupabaseClient } from '@supabase/supabase-js';
import { enforceNames, type NameRow } from './names-core';

/**
 * 교수 영문 이름(또는 연구실 영문명)을 관리자 화면에서 저장하면, 그 교수의 한글 이름이 나오는 기존 게시글의 영문도 새 표기로 맞춘다.
 * (신임 교수 등록 전에 번역된 글·표기를 바꾼 경우 예전 글이 옛 표기로 남던 빈틈, 2026-09-25 책임자 제안)
 * 새 글은 번역할 때 교수진 표를 용어집으로 읽으므로(lib/names.ts) 여기서는 기존 글만 다룬다.
 */
export async function syncFacultyNameInPosts(sb: SupabaseClient, r: NameRow): Promise<number> {
  if (!r.ko?.trim() || !r.en?.trim() || !/^[가-힣]{2,5}$/.test(r.ko.trim())) return 0;
  const ko = r.ko.trim();
  const { data } = await sb.from('posts').select('id,title_en,excerpt_en,content_en')
    .or(`title_ko.ilike.%${ko}%,excerpt_ko.ilike.%${ko}%,content_ko.ilike.%${ko}%`).limit(1000);
  let changed = 0;
  for (const p of data || []) {
    const upd: Record<string, string> = {};
    for (const f of ['title_en', 'excerpt_en', 'content_en'] as const) {
      const v = p[f]; if (!v) continue;
      const nv = enforceNames([{ ...r, ko, en: r.en.trim().replace(/\s+/g, ' ') }], v);
      if (nv !== v) upd[f] = nv;
    }
    if (Object.keys(upd).length) { const { error } = await sb.from('posts').update(upd).eq('id', p.id); if (!error) changed++; }
  }
  return changed;
}
