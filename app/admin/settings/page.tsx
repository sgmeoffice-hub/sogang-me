import { requireAdmin } from '@/lib/admin';
import { saveSettings, addAdmin } from '@/app/admin/actions';
import TranslateAll from '@/components/admin/TranslateAll';
import SubmitButton from '@/components/admin/SubmitButton';
import { translateProvider } from '@/lib/translate';
export default async function Settings() {
  const auth = await requireAdmin(); if (!auth) return null;
  const { sb } = auth;
  const { data } = await sb.from('site_settings').select('value').eq('key', 'home').maybeSingle();
  const { data: admins } = await sb.from('admins').select('email');
  // 영문 누락 건수는 화면에 쓰지 않으면서 매번 count 쿼리를 날리던 것을 제거(2026-10-13) — 남은 건수는 번역 버튼이 진행하며 직접 보여준다
  const v = data?.value || {}; const sections: string[] = v.sections || ['hero', 'promo', 'intro', 'news', 'videos', 'programs', 'quicklinks', 'gallery'];
  const all = [['hero', '히어로 (영상 배너 + 4개 분야)'], ['promo', '전공 홍보자료 카드 2개'], ['intro', '연구 분야 4개 카드'], ['news', '학과 소식 (공지/연구성과/수상/동문 4줄 카드뉴스)'], ['videos', '추천 영상 4개'], ['programs', '교육 프로그램 타일'], ['quicklinks', '자주 찾는 메뉴'], ['gallery', '갤러리']];
  return (<div>
    <h1 className="text-2xl font-bold">메인 페이지 · 설정</h1>
    <form action={saveSettings} className="mt-6 max-w-2xl space-y-5 bg-white border border-sg-line p-6">
      <div><p className="text-[13px] font-semibold">메인에 표시할 섹션</p><div className="mt-2 grid gap-2 sm:grid-cols-2 text-[13px]">{all.map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" name={`sec_${k}`} defaultChecked={sections.includes(k)} /> {l}</label>)}</div></div>
      <label className="block text-[13px]">섹션 순서 (쉼표로 구분: hero, promo, intro, news, videos, programs, quicklinks, gallery)<input name="order" defaultValue={sections.join(', ')} className="input mt-1 font-mono" /></label>
      <label className="block text-[13px]">메인 소식 줄당 카드 수 (4개씩 보이고 화살표로 넘김)<input name="news_count" type="number" min={4} max={16} defaultValue={v.news_count || 8} className="input mt-1 !w-24" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px]">히어로 배경 영상 URL (mp4)<input name="hero_video_url" defaultValue={v.hero_video_url || ''} className="input mt-1" placeholder="비우면 본교 캠퍼스 영상" /></label>
        <label className="block text-[13px]">히어로 대체 이미지 URL<input name="hero_poster_url" defaultValue={v.hero_poster_url || ''} className="input mt-1" placeholder="비우면 학과 대표 사진" /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px]">히어로 문구 (한국어)<input name="tagline_ko" defaultValue={v.tagline_ko || ''} className="input mt-1" placeholder="비우면 기본 문구" /></label>
        <label className="block text-[13px]">Hero tagline (English)<input name="tagline_en" defaultValue={v.tagline_en || ''} className="input mt-1" /></label>
      </div>
      <label className="block text-[13px]">신청 알림 받을 이메일 (시설 예약·URECA 지원 시 메일 발송 — 쉼표로 여러 명 지정 가능)<input name="notify_email" type="text" defaultValue={v.notify_email || ''} className="input mt-1" placeholder="sgmeoffice@gmail.com, 행정실@sogang.ac.kr" /><span className="block mt-1 text-[12px] text-sg-steel">메일 발송에는 Vercel 환경변수 RESEND_API_KEY 설정이 필요합니다 (resend.com 무료 계정, 월 3,000통). 키가 없으면 신청은 정상 접수되고 메일만 생략됩니다.</span>
      <span className="block mt-2 text-[12px] leading-relaxed text-sg-steel border border-sg-line bg-sg-mist p-2.5">⚠️ <b>현재는 테스트 발신자(onboarding@resend.dev)를 쓰므로 Resend 가입 계정 주소(학과 Gmail)로만 발송됩니다.</b> 다른 주소를 여기에 추가하면 발송 전체가 거부될 수 있으니 넣지 마세요. 다른 사람(행정실 등)에게도 알림을 보내려면:<br/>· <b>방법 A (현재 운영 중)</b> — 학과 Gmail의 [설정 → 전달 및 POP/IMAP]에서 전달 주소를 등록(상대방 승인 필요)하고, 보낸사람 onboarding@resend.dev 필터에 "다음 주소로 전달"을 걸어 자동 전달.<br/>· <b>방법 B (정식, 미적용)</b> — resend.com에서 me.sogang.ac.kr을 발신 도메인으로 인증(디지털정보처에 DNS 레코드 추가 요청 필요) 후 Vercel 환경변수 NOTIFY_FROM을 noreply@me.sogang.ac.kr로 설정하면, 이 칸에 쉼표로 여러 수신자를 직접 지정할 수 있습니다.</span></label>
      <p className="text-[12px] text-sg-steel">메인 노출 여부는 각 게시글 편집 화면의 "메인 페이지에 노출" 체크로 개별 제어됩니다.</p>
      <SubmitButton className="btn-primary disabled:opacity-60" pendingText="저장 중…">저장</SubmitButton>
    </form>
    <h2 className="mt-10 font-bold">영문 번역</h2>
    <div className="mt-3 max-w-2xl"><TranslateAll provider={translateProvider()} /></div>
    <h2 className="mt-10 font-bold">관리자 계정</h2>
    <p className="text-[13px] text-sg-steel mt-1">Supabase → Authentication → Users 에서 계정을 만든 뒤, 아래에 같은 이메일을 등록하면 관리 권한이 부여됩니다.</p>
    <ul className="mt-3 text-[13px] space-y-1">{(admins || []).map((a: any) => <li key={a.email} className="font-mono">{a.email}</li>)}</ul>
    <form action={addAdmin} className="mt-3 flex gap-0 max-w-md"><input name="email" type="email" required placeholder="admin@sogang.ac.kr" className="input" /><SubmitButton className="btn-primary !py-2" pendingText="추가 중…">추가</SubmitButton></form>
  </div>);
}
