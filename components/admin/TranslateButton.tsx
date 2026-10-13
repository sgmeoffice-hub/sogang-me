'use client';
import { useState } from 'react';

/** Calls /api/translate with the named KO fields of the enclosing form and fills the EN fields. */
export default function TranslateButton({ pairs }: { pairs: [string, string][] }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" disabled={busy} onClick={async (e) => {
        const form = (e.target as HTMLElement).closest('form')!; setBusy(true); setMsg('');
        const fields: Record<string, string> = {};
        for (const [ko] of pairs) { const el = form.elements.namedItem(ko) as HTMLInputElement | HTMLTextAreaElement | null; if (el?.value) fields[ko] = el.value; }
        // 네트워크 오류나 게이트웨이 타임아웃(HTML 본문)이면 fetch/json이 던져 버튼이 '번역 중…'에 영원히 멈추고, 새로고침하면 쓰던 내용이 날아갔다(2026-10-13)
        let r: Response, j: any;
        try { r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) }); j = await r.json().catch(() => ({})); }
        catch { setMsg('번역 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.'); setBusy(false); return; }
        if (!r.ok || !j.fields) { setMsg(j.error || '번역 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.'); setBusy(false); return; }
        for (const [ko, en] of pairs) {
          const el = form.elements.namedItem(en) as HTMLInputElement | HTMLTextAreaElement | null;
          if (!el || !j.fields[ko]) continue;
          if (el.type === 'hidden') {
            // RichEditor의 hidden input은 React가 통제하므로 전용 이벤트로 state·에디터를 함께 갱신
            window.dispatchEvent(new CustomEvent('sg-editor-set', { detail: { name: en, value: j.fields[ko] } }));
          } else {
            const setter = Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!;
            setter.call(el, j.fields[ko]); el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        setMsg('번역 완료'); setBusy(false);
      }} className="btn-ghost !py-2 bg-white">{busy ? '번역 중…' : '🌐 AI 영문 번역'}</button>
      {msg && <span className="text-[12px] text-sg-steel">{msg}</span>}
    </span>
  );
}
