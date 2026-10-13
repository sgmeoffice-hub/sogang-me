import { requireAdmin } from '@/lib/admin';
import { savePage, resetPage } from '@/app/admin/actions';
import RichEditor from '@/components/admin/RichEditor';
import TranslateButton from '@/components/admin/TranslateButton';
import SubmitButton from '@/components/admin/SubmitButton';
import { staticPages } from '@/content';
import { notFound } from 'next/navigation';

export default async function EditPage(props: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(); if (!auth) return null;
  const params = await props.params;
  const slug = decodeURIComponent(params.slug); const builtin = staticPages[slug]; if (!builtin) notFound();
  const { data } = await auth.sb.from('pages').select('*').eq('slug', slug).maybeSingle();
  return (<div>
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold font-mono">/{slug}</h1>
      {data && <form action={resetPage}><input type="hidden" name="slug" value={slug} /><SubmitButton className="text-[13px] text-sg-red underline" pendingText="되돌리는 중…" confirm="편집한 국문·영문 내용을 모두 버리고 기본 내용으로 되돌립니다. 계속할까요?">기본 내용으로 되돌리기</SubmitButton></form>}</div>
    <form action={savePage} className="mt-6 space-y-5 max-w-5xl">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-[13px]">페이지 제목 (한국어, 비우면 메뉴명)<input name="title_ko" defaultValue={data?.title_ko || ''} className="input mt-1" /></label>
        <label className="text-[13px]">Title (English)<input name="title_en" defaultValue={data?.title_en || ''} className="input mt-1" /></label>
      </div>
      <div><p className="text-[13px] mb-1">본문 (한국어)</p><RichEditor name="content_ko" defaultValue={data?.content_ko || builtin.ko} folder="pages" minHeight={528} /></div>
      <div><p className="text-[13px] mb-1">Content (English)</p><RichEditor name="content_en" defaultValue={data?.content_en || builtin.en} folder="pages" minHeight={396} /></div>
      <div className="flex flex-wrap gap-4 items-center text-[13px]"><TranslateButton pairs={[['content_ko', 'content_en']]} /><label className="flex items-center gap-2">영문 자동 번역
        <select name="translate_mode" defaultValue="changed" className="input !w-auto !py-1.5">
          <option value="changed">국문이 바뀌면 다시 번역 (권장)</option>
          <option value="missing">영문이 비어 있을 때만</option>
          <option value="none">번역하지 않음</option>
        </select>
      </label></div>
      <SubmitButton className="btn-primary disabled:opacity-60" pendingText="저장 중…">저장</SubmitButton>
    </form>
  </div>);
}
