import Link from '@/components/Link';
import { t, T, type Locale } from '@/lib/i18n';
import { coverFor } from '@/lib/placeholder';
import { boardTint } from '@/lib/board-colors';
import { youtubeThumb } from '@/lib/html';

export type Post = {
  id: number; board: string; title_ko: string; title_en?: string | null; excerpt_ko?: string | null; excerpt_en?: string | null;
  thumbnail_url?: string | null; created_at: string; is_pinned?: boolean; view_count?: number; author?: string | null;
  content_ko?: string | null; content_en?: string | null; attachments?: any[]; images?: any[];
  video_url?: string | null; term?: string | null; members?: string | null; advisor?: string | null; category?: string | null; category_en?: string | null; sort_order?: number | null;
};

export const fmtDate = (d: string) => new Date(d).toISOString().slice(0, 10).replace(/-/g, '.'); // 주의: legacy 글은 KST 시각이 +00으로 저장돼 있어 UTC 날짜가 원본 날짜다 (+9h 보정 금지)

export default function PostCard({ post, locale }: { post: Post; locale: Locale }) {
  const tag = T(locale, post.board as any) || post.board;
  return (
    <Link href={`/${locale}/board/${post.board}/${post.id}`} className="card group flex flex-col overflow-hidden">
      <div className="aspect-[16/10] bg-sg-mist relative overflow-hidden">
        <img src={post.thumbnail_url || post.images?.[0]?.url || youtubeThumb(post.video_url) || coverFor(post.board, t(post, 'title', locale), post.id)} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        <span className="absolute left-3 top-3 text-white text-[11px] font-bold px-2 py-1" style={{ backgroundColor: boardTint(post.board) }}>{tag}</span>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-[16px] leading-snug line-clamp-2 group-hover:text-sg-cardinal transition-colors">{t(post, 'title', locale)}</h3>
        {t(post, 'excerpt', locale) && <p className="text-[13px] text-sg-steel line-clamp-2">{t(post, 'excerpt', locale)}</p>}
        <span className="mt-auto pt-2 text-[13px] text-sg-gray9">{fmtDate(post.created_at)}</span>
      </div>
    </Link>
  );
}
