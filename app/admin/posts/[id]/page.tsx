import { createClient } from '@/lib/supabase-server';
import PostForm, { DeletePostButton } from '@/components/admin/PostForm';
import { notFound } from 'next/navigation';
import { serviceClient, listVersions, HISTORY_DAYS } from '@/lib/vault';
import { restoreVersion } from '../../actions';
import SubmitButton from '@/components/admin/SubmitButton';

const kst = (iso: string) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');

export default async function EditPost({ params, searchParams }: { params: { id: string }; searchParams: { board?: string; restored?: string } }) {
  const isNew = params.id === 'new';
  let post: any = null;
  if (!isNew) { const sb = createClient(); const { data } = await sb.from('posts').select('*').eq('id', Number(params.id)).single(); if (!data) notFound(); post = data; }
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{isNew ? '새 게시글' : `게시글 수정 #${post.id}`}</h1>{post && <DeletePostButton id={post.id} board={post.board} />}</div>
      {searchParams.restored && <p className="mt-4 border-l-4 border-green-700 bg-white px-4 py-2.5 text-[13.5px]">이전 버전으로 되돌렸습니다. 되돌리기 직전 내용도 수정 이력에 남아 있습니다.</p>}
      <div className="mt-6"><PostForm post={post} defaultBoard={searchParams.board} /></div>
      {post && <History id={post.id} />}
    </div>
  );
}

/** 수정 이력 — 저장할 때마다 직전 내용이 보관된다(최근 20개·90일). 되돌리면 그 버전의 제목·본문·첨부 등이 다시 적용된다. */
async function History({ id }: { id: number }) {
  const versions = await listVersions(serviceClient(), id).catch(() => []);
  return (
    <details className="mt-10 bg-white border border-sg-line">
      <summary className="cursor-pointer px-4 py-3 text-[14px] font-semibold">수정 이력 <span className="font-normal text-sg-steel text-[12.5px]">({versions.length}개 · 저장할 때마다 직전 내용을 {HISTORY_DAYS}일 보관)</span></summary>
      <ul className="divide-y divide-sg-line border-t border-sg-line text-[13px]">
        {versions.length === 0 && <li className="px-4 py-3 text-sg-steel">아직 없습니다. 이 글을 한 번 저장하면 그 직전 내용부터 쌓입니다.</li>}
        {versions.map((v) => (
          <li key={v.name} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="min-w-0 flex-1"><span className="font-mono">{kst(v.savedAt)}</span> <span className="text-sg-steel">저장 전 내용{v.by ? ` · ${v.by}` : ''}</span><p className="truncate text-sg-gray11">{v.title}</p></div>
            <form action={restoreVersion}><input type="hidden" name="id" value={id} /><input type="hidden" name="name" value={v.name} />
              <SubmitButton className="btn-ghost !py-1.5 !px-3 !text-[12.5px]" pendingText="되돌리는 중…" confirm="이 버전으로 되돌릴까요? 지금 내용은 수정 이력에 남습니다.">이 버전으로 되돌리기</SubmitButton></form>
          </li>
        ))}
      </ul>
    </details>
  );
}
