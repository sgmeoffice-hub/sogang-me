import { createClient } from '@/lib/supabase-server';
import { saveBanner, deleteBanner } from '@/app/admin/actions';
import PhotoField from '@/components/admin/PhotoField';
export default async function Banners() {
  const sb = await createClient(); const { data } = await sb.from('banners').select('*').order('sort_order');
  const Form = ({ b }: { b?: any }) => (
    <form action={saveBanner} className="grid gap-2 sm:grid-cols-[120px_1fr_1fr] bg-white border border-sg-line p-4 text-[13px]">
      {b && <input type="hidden" name="id" value={b.id} />}
      <div><PhotoField defaultValue={b?.image_url} name="image_url" folder="banners" /></div>
      <div className="space-y-2"><input name="title_ko" defaultValue={b?.title_ko || ''} placeholder="제목 (한국어)" className="input" /><input name="subtitle_ko" defaultValue={b?.subtitle_ko || ''} placeholder="부제 (한국어)" className="input" /><input name="link" defaultValue={b?.link || ''} placeholder="링크 URL" className="input" /></div>
      <div className="space-y-2"><input name="title_en" defaultValue={b?.title_en || ''} placeholder="Title (EN)" className="input" /><input name="subtitle_en" defaultValue={b?.subtitle_en || ''} placeholder="Subtitle (EN)" className="input" />
        <div className="flex gap-3 items-center"><input name="sort_order" type="number" defaultValue={b?.sort_order ?? 100} className="input !w-24" /><label className="flex items-center gap-1"><input type="checkbox" name="visible" defaultChecked={b ? b.visible : true} /> 표시</label><button className="btn-primary !py-2">{b ? '저장' : '추가'}</button></div></div>
    </form>);
  return (<div>
    <h1 className="text-2xl font-bold">메인 배너</h1><p className="mt-1 text-[13px] text-sg-steel">히어로 아래에 최대 3개까지 카드 형태로 표시됩니다 (예: BK21, 입학설명회, 소개자료).</p>
    <div className="mt-6 space-y-4">{(data || []).map((b: any) => <div key={b.id}><Form b={b} /><form action={deleteBanner} className="text-right"><input type="hidden" name="id" value={b.id} /><button className="text-[12px] text-sg-red underline">삭제</button></form></div>)}</div>
    <h2 className="mt-8 font-bold">새 배너</h2><div className="mt-2"><Form /></div>
  </div>);
}
