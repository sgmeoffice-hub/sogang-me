import { createClient } from '@/lib/supabase-server';
import { saveFaculty, deleteFaculty } from '@/app/admin/actions';
import RichEditor from '@/components/admin/RichEditor';
import TranslateButton from '@/components/admin/TranslateButton';
import PhotoField from '@/components/admin/PhotoField';
import { areas } from '@/content/areas';
import { researchGroupDefs } from '@/lib/groups';
import { buildings, parseOffice } from '@/lib/buildings';
import { notFound } from 'next/navigation';

export default async function EditFaculty({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new'; let f: any = null;
  if (!isNew) { const sb = createClient(); const { data } = await sb.from('faculty').select('*').eq('id', Number(params.id)).single(); if (!data) notFound(); f = data; }
  const legacy = parseOffice(f?.office);
  const curBuilding = f?.building || legacy.building || '';
  const curRoom = f?.room || legacy.room || '';
  const I = ({ n, l, v, ph }: { n: string; l: string; v?: string; ph?: string }) => <label className="block text-[13px]">{l}<input name={n} defaultValue={v || ''} placeholder={ph} className="input mt-1" /></label>;
  return (<div>
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{isNew ? '교수 추가' : `${f.name_ko} 교수`}</h1>
      {f && <form action={deleteFaculty}><input type="hidden" name="id" value={f.id} /><button className="text-[13px] text-sg-red underline">삭제</button></form>}</div>
    <form action={saveFaculty} className="mt-6 max-w-4xl space-y-5">
      {f && <input type="hidden" name="id" value={f.id} />}
      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <PhotoField defaultValue={f?.photo_url} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[13px] sm:col-span-2">구분 *
            <select name="category" defaultValue={f?.is_emeritus ? 'emeritus' : f?.field === 'chair' ? 'chair' : 'fulltime'} className="input mt-1">
              <option value="fulltime">전임교수</option>
              <option value="emeritus">명예교수 (퇴임)</option>
              <option value="chair">석좌교수</option>
            </select>
            <span className="block text-[11px] text-sg-steel mt-1">퇴임 시 "명예교수"로 바꿔 저장하면 전임교수 목록에서 명예교수 목록으로 자동 이동합니다. 석좌교수는 「교수진 › 석좌교수」에만 표시됩니다.</span>
          </label>
          <I n="name_ko" l="이름 (한국어) *" v={f?.name_ko} /><I n="name_en" l="Name (English)" v={f?.name_en} ph="Gildong Hong" />
          <I n="title_ko" l="직함" v={f?.title_ko || '교수'} /><I n="title_en" l="Title" v={f?.title_en || 'Professor'} />
          <I n="email" l="이메일" v={f?.email} /><I n="tel" l="전화" v={f?.tel} ph="02-705-0000" />
          <I n="lab_ko" l="연구실명 (한국어)" v={f?.lab_ko} /><I n="lab_en" l="Laboratory (English)" v={f?.lab_en} />
          <I n="lab_url" l="연구실 홈페이지" v={f?.lab_url} ph="https://" /><label className="block text-[13px]">건물<select name="building" defaultValue={curBuilding} className="input mt-1"><option value="">— 선택 —</option>{buildings.map((b) => <option key={b.code} value={b.code}>{b.ko} ({b.code})</option>)}</select></label>
          <label className="block text-[13px]">호실<input name="room" defaultValue={curRoom} placeholder="618" className="input mt-1" /><span className="block text-[11px] text-sg-steel mt-1">숫자만 입력 (국문 "리치과학관(R) 618호" / 영문 "New Ricci Hall (R) Room 618"로 자동 표기)</span></label>
          <label className="block text-[13px]">연구 분야 (4대 기초전공)<select name="field" defaultValue={f?.field === 'chair' ? '' : f?.field || ''} className="input mt-1"><option value="">—</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.ko}</option>)}</select>{f?.field === 'chair' && <span className="block text-[11px] text-sg-cardinal mt-1">※ 석좌→전임으로 바꿀 때는 연구 분야를 함께 선택하세요 (비워 두면 기초전공 연구실 표에 나오지 않습니다)</span>}</label>
          <I n="sort_order" l="정렬 순서 (작을수록 앞)" v={String(f?.sort_order ?? 100)} />
        </div>
      </div>
      <div className="border border-[rgba(175,39,47,0.3)] bg-[rgba(175,39,47,0.05)] p-4">
        <p className="text-[13px] font-semibold">소속 연구그룹 <span className="font-normal text-sg-steel">— 체크한 그룹의 「대학원과정 › 융합 및 응용연구 그룹」 페이지에 자동으로 표시됩니다 (중복 선택 가능)</span></p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-[13px]">
          {researchGroupDefs.map((g) => <label key={g.id} className="flex items-center gap-2"><input type="checkbox" name={`group_${g.id}`} defaultChecked={Array.isArray(f?.groups) && f.groups.includes(g.id)} /> {g.ko}</label>)}
        </div>
        <p className="mt-2 text-[12px] text-sg-steel">※ 위 "연구 분야"(4개 기초전공분야)는 「기초전공분야」 페이지의 연구실 표에 자동 반영됩니다. 전임·명예·석좌 구분은 맨 위 "구분"에서 바꿉니다.</p>
      </div>
      <div><p className="text-[13px] mb-1">연구분야 소개 (한국어)</p><RichEditor name="research_ko" defaultValue={f?.research_ko || ''} folder="faculty" minHeight={176} /></div>
      <div><p className="text-[13px] mb-1">Research (English)</p><RichEditor name="research_en" defaultValue={f?.research_en || ''} folder="faculty" minHeight={132} /></div>
      <div><p className="text-[13px] mb-1">약력 (한국어)</p><RichEditor name="bio_ko" defaultValue={f?.bio_ko || ''} folder="faculty" minHeight={176} /></div>
      <div><p className="text-[13px] mb-1">Biography (English)</p><RichEditor name="bio_en" defaultValue={f?.bio_en || ''} folder="faculty" minHeight={132} /></div>
      <div className="flex flex-wrap gap-4 items-center text-[13px]">
        <TranslateButton pairs={[['lab_ko', 'lab_en'], ['research_ko', 'research_en'], ['bio_ko', 'bio_en']]} />
        <label className="flex items-center gap-2">영문 자동 번역
          <select name="translate_mode" defaultValue="changed" className="input !w-auto !py-1.5">
            <option value="changed">국문이 바뀌면 다시 번역 (권장)</option>
            <option value="missing">영문이 비어 있을 때만</option>
            <option value="none">번역하지 않음</option>
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={f ? f.published : true} /> 공개</label>
      </div>
      <button className="btn-primary">저장</button>
    </form>
  </div>);
}
