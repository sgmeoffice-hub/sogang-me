import type { MetadataRoute } from 'next';
import { nav } from '@/lib/nav';
import { createPublicClient } from '@/lib/supabase-server';

// 게시글이 수시로 추가되므로 한 시간마다 재생성한다
export const revalidate = 86400; // 하루 1회(검색엔진용, 2026-09-25 전송량 절감)

const LOCALES = ['ko', 'en'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://me.sogang.ac.kr';
  const out: MetadataRoute.Sitemap = [];
  const push = (path: string, opts: Partial<MetadataRoute.Sitemap[number]> = {}) =>
    LOCALES.forEach((l) => out.push({ url: `${base}/${l}${path}`, ...opts }));

  // 고정 페이지 (홈 + 내비게이션 전체)
  push('', { changeFrequency: 'daily', priority: 1 });
  nav.flatMap((n) => n.sub || []).filter((s) => !s.href.startsWith('http')).forEach((s) => push(s.href, { changeFrequency: 'weekly', priority: 0.8 }));
  push('/reservation', { changeFrequency: 'weekly', priority: 0.5 });

  const sb = createPublicClient();

  // 게시글 상세 (published 전체 — 옛 사이트에서 이관된 글 포함, 검색엔진이 새 주소로 재인덱싱하도록)
  try {
    let off = 0;
    while (true) {
      const { data, error } = await sb.from('posts').select('id,board,created_at').eq('published', true)
        .order('id').range(off, off + 999);
      if (error || !data) break;
      data.forEach((p) => push(`/board/${p.board}/${p.id}`, {
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: 'monthly', priority: 0.5,
      }));
      if (data.length < 1000) break;
      off += 1000;
    }
  } catch { /* DB 불통이어도 고정 페이지 사이트맵은 내보낸다 */ }

  // 교수 상세
  try {
    const { data } = await sb.from('faculty').select('id').eq('published', true);
    (data || []).forEach((f) => push(`/faculty/${f.id}`, { changeFrequency: 'monthly', priority: 0.6 }));
  } catch { /* 위와 동일 */ }

  return out;
}
