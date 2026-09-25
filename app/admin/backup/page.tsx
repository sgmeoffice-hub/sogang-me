import { adminBase } from '@/lib/admin';
import { ui } from '@/lib/i18n';
import { r2Enabled } from '@/lib/r2';
import { getBackupStatus, listBackups } from '@/lib/backup';
import { serviceClient, listTrash, TRASH_DAYS, HISTORY_DAYS } from '@/lib/vault';
import { backupNow, restorePost, purgePost } from '../actions';
import SubmitButton from '@/components/admin/SubmitButton';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;   // '지금 백업' 버튼(서버 액션)도 이 페이지 설정으로 실행된다

const kst = (iso?: string) => (iso ? new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : '—');
const mb = (n?: number) => (n ? `${(n / 1024 / 1024).toFixed(1)} MB` : '—');

/** 백업·휴지통 (2026-09-25 책임자 요청). 복원(사이트 전체를 특정 날짜로)은 실수 위험 때문에 버튼으로 두지 않고 개발 작업으로 한다. */
export default async function BackupPage() {
  const b = adminBase(); const svc = serviceClient();
  const [status, list, trash] = await Promise.all([getBackupStatus(svc), listBackups().catch(() => ({ daily: [], monthly: [] })), listTrash(svc).catch(() => [])]);
  const enabled = r2Enabled();
  const stale = enabled && (!status?.lastSuccessAt || Date.now() - Date.parse(status.lastSuccessAt) > 48 * 3600e3);
  const dl = (key: string) => `/api/admin/backup/download?key=${encodeURIComponent(key)}`;
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">백업·휴지통</h1>
      <p className="mt-2 text-[13px] text-sg-steel break-keep">매일 새벽 4시에 DB 전체(게시글·교수·예약·URECA 등)와 업로드 파일을 Cloudflare R2 비공개 저장소에 자동 백업합니다. 최근 30일은 매일치, 그 이전은 매월 1일치를 12개월 보관합니다. 삭제한 글은 {TRASH_DAYS}일 동안 휴지통에 남고, 글을 고칠 때마다 직전 내용이 {HISTORY_DAYS}일 동안 보관됩니다(글 수정 화면 아래 ‘수정 이력’).</p>

      {!enabled && (
        <div className="mt-6 border-l-4 border-sg-cardinal bg-white p-4 text-[13.5px] break-keep">
          <p className="font-bold">자동 백업이 아직 꺼져 있습니다 — R2 설정이 필요합니다</p>
          <p className="mt-1 text-sg-gray11">Cloudflare R2에 비공개 버킷 <code>sogang-me-backup</code>과 API 토큰(Object Read &amp; Write, 대상: sogang-me-backup·sogang-me-media)을 만든 뒤 Vercel 환경변수 <code>R2_ACCOUNT_ID</code>·<code>R2_ACCESS_KEY_ID</code>·<code>R2_SECRET_ACCESS_KEY</code>·<code>R2_BACKUP_BUCKET</code>을 넣고 다시 배포하면 켜집니다. 휴지통·수정 이력은 지금도 동작합니다.</p>
        </div>
      )}

      <section className="mt-6 bg-white border border-sg-line p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="eyebrow">마지막 백업</p>
            <p className={`mt-1 text-[15px] font-semibold ${stale || (status && !status.ok) ? 'text-sg-cardinal' : ''}`}>
              {status?.lastSuccessAt ? `${kst(status.lastSuccessAt)} 성공` : '아직 없음'}
              {status && !status.ok && ` · 최근 시도 실패(${kst(status.at)})`}
              {stale && status?.lastSuccessAt && ' · 이틀 넘게 성공한 백업이 없습니다'}
            </p>
            {status?.ok && <p className="mt-1 text-[12.5px] text-sg-steel">{status.unchanged ? '전날과 같아 새로 저장하지 않음 · ' : ''}압축 {mb(status.bytes)} · 게시글 {status.counts?.posts ?? '—'} · 예약 {status.counts?.reservations ?? '—'} · URECA {status.counts?.ureca_applications ?? '—'}{status.legacyRemaining ? ` · 옛 파일 사본 ${status.legacyRemaining}개 남음(매일 이어서)` : ''}</p>}
            {status?.error && <p className="mt-1 text-[12.5px] text-sg-cardinal break-all">{status.error}</p>}
          </div>
          {enabled && <form action={backupNow}><SubmitButton className="btn-ghost !py-2 !px-4 !text-[13px] bg-white" pendingText="백업 중…">지금 백업</SubmitButton></form>}
        </div>
      </section>

      {enabled && (
        <section className="mt-6">
          <h2 className="font-bold">백업 파일</h2>
          <p className="mt-1 text-[12.5px] text-sg-steel">관리자만 내려받을 수 있습니다(5분 유효 링크). 학번·연락처가 들어 있으니 내려받은 파일은 안전하게 보관하세요.</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {([['매일(최근 30일)', list.daily], ['매월(12개월)', list.monthly]] as const).map(([label, items]) => (
              <div key={label} className="bg-white border border-sg-line">
                <p className="px-4 py-2.5 text-[13px] font-semibold border-b border-sg-line">{label}</p>
                <ul className="max-h-72 overflow-y-auto text-[13px] divide-y divide-sg-line">
                  {items.length === 0 && <li className="px-4 py-3 text-sg-steel">없음</li>}
                  {items.map((o) => <li key={o.key} className="px-4 py-2 flex justify-between gap-3"><a href={dl(o.key)} className="font-mono hover:text-sg-red">{o.key.split('/').pop()?.replace('.json.gz', '')}</a><span className="font-mono text-sg-steel">{mb(o.size)}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-bold">휴지통 <span className="text-[13px] font-normal text-sg-steel">— 삭제한 글 {TRASH_DAYS}일 보관 후 자동 영구 삭제</span></h2>
        <div className="mt-3 bg-white border border-sg-line divide-y divide-sg-line text-[13.5px]">
          {trash.length === 0 && <p className="px-4 py-3 text-sg-steel">비어 있습니다.</p>}
          {trash.map((t) => (
            <div key={t.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1"><p className="font-medium break-keep">{t.title}</p><p className="text-[12px] text-sg-steel">#{t.id} · {ui.ko[t.board as keyof typeof ui.ko] || t.board} · {kst(t.deletedAt)} 삭제{t.by ? ` · ${t.by}` : ''}</p></div>
              <div className="flex gap-2 shrink-0">
                <form action={restorePost}><input type="hidden" name="id" value={t.id} /><SubmitButton className="btn-primary !py-1.5 !px-3 !text-[12.5px]" pendingText="복구 중…">복구</SubmitButton></form>
                <form action={purgePost}><input type="hidden" name="id" value={t.id} /><SubmitButton className="btn-ghost !py-1.5 !px-3 !text-[12.5px] bg-white" pendingText="…" confirm="영구 삭제하면 되돌릴 수 없습니다. 계속할까요?">영구 삭제</SubmitButton></form>
              </div>
            </div>
          ))}
        </div>
      </section>
      <p className="mt-8 text-[12px] text-sg-steel break-keep">사이트 전체를 특정 날짜로 되돌리는 복원은 실수로 누를 위험이 있어 버튼으로 두지 않았습니다. 필요하면 개발 담당(Claude 세션)에 “○월 ○일 백업으로 복원”을 요청하세요 — 절차는 docs/HANDOFF.md에 있습니다.</p>
      <p className="mt-2 text-[12px] text-sg-steel"><a href={`${b}`} className="underline">대시보드로</a></p>
    </div>
  );
}
