'use client';
import { useState } from 'react';
import Link from '@/components/Link';
import PostCard, { type Post } from './PostCard';
import { T, type Locale } from '@/lib/i18n';

const tabs = ['notice', 'research', 'award'] as const;

export default function NewsTabs({ locale, groups }: { locale: Locale; groups: Record<string, Post[]> }) {
  const [active, setActive] = useState<(typeof tabs)[number]>('notice');
  const posts = groups[active] || [];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="flex gap-1 border-b border-sg-line" role="tablist">
          {tabs.map((tb) => (
            <button key={tb} role="tab" aria-selected={active === tb} onClick={() => setActive(tb)}
              className={`px-4 py-3 text-[15px] font-semibold -mb-px border-b-2 transition-colors ${active === tb ? 'border-sg-red text-sg-ink' : 'border-transparent text-sg-steel hover:text-sg-ink'}`}>
              {T(locale, tb)}
            </button>
          ))}
        </div>
        <Link href={`/${locale}/board/${active}`} className="font-mono text-[12px] tracking-wider text-sg-steel hover:text-sg-red">{T(locale, 'more')} →</Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-sg-steel py-10 text-center border border-dashed border-sg-line">{T(locale, 'noPosts')}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => <PostCard key={p.id} post={p} locale={locale} />)}
        </div>
      )}
    </div>
  );
}
