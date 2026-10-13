import type { MetadataRoute } from 'next';
import { nav } from '@/lib/nav';
import { createPublicClient } from '@/lib/supabase-server';

// 글 저장·삭제 시 lib/refresh.ts가 /sitemap.xml을 즉시 비우므로 시간 기준은 하루 1회(검색엔진용, 2026-09-25 전송량 절감)
export const revalidate = 86400;

const LOCALES = ['ko', 'en'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://me.sogang.ac.kr';
  const out: MetadataRoute.Sitemap = [];
  const push = (path: string, opts: Partial<MetadataRoute.Sitemap[number]> = {}) =>
    LOCALES.forEach((l) => out.push({ url: `${base}/${l}${path}`, ...opts }));

  // 고정 페이지 (홈 + 내비게이션 전체)
  push('', { changeFrequency: 'daily', priority: 1 });
  // 예약 페이지(/reservation)는 메뉴에 있어 위 반복문이 이미 넣는다 — 따로 더 넣으면 같은 주소가 두 번 나온다(2026-10-13 점검)
  nav.flatMap((n) => n.sub || []).filter((s) => !s.href.startsWith('http')).forEach((s) => push(s.href, { changeFrequency: 'weekly', priority: 0.8 }));

  const sb = createPublicClient();
  // 조회 오류는 삼키지 않고 던진다 — 재생성이 실패해야 직전 사이트맵이 그대로 서비스된다. 예전처럼 오류 때 중간에 끊고 내보내면 글 절반이 빠진 사이트맵이 하루 캐시로 굳는다(2026-10-13 점검).
  const fail = (what: string, e: { code?: string; message: string }) => { console.error('sitemap', what, e.code, e.message); throw new Error(e.message); };

  // 게시글 상세 (published 전체 — 옛 사이트에서 이관된 글 포함, 검색엔진이 새 주소로 재인덱싱하도록)
  let off = 0;
  while (true) {
    const { data, error } = await sb.from('posts').select('id,board,created_at').eq('published', true)
      .order('id').range(off, off + 999);
    if (error) fail('posts', error);
    (data || []).forEach((p) => push(`/board/${p.board}/${p.id}`, {
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: 'monthly', priority: 0.5,
    }));
    if (!data || data.length < 1000) break;
    off += 1000;
  }

  // 교수 상세
  const { data: fac, error: facErr } = await sb.from('faculty').select('id').eq('published', true);
  if (facErr) fail('faculty', facErr);
  (fac || []).forEach((f) => push(`/faculty/${f.id}`, { changeFrequency: 'monthly', priority: 0.6 }));

  return out;
}
