import { createPublicClient } from './supabase-server';
/**
 * Email notification via Resend (https://resend.com, free tier 3,000/month).
 * Set RESEND_API_KEY in Vercel env. Recipient is configurable in 관리자 > 메인·설정 (notify_email).
 * If no key is configured this is a silent no-op so forms still work.
 */
export async function notifyAdmin(subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { skipped: true };
  const sb = createPublicClient();
  const { data } = await sb.from('site_settings').select('value').eq('key', 'home').maybeSingle();
  const raw = data?.value?.notify_email || process.env.NOTIFY_EMAIL;
  // 쉼표로 여러 수신자 지정 가능 (예: "sgmeoffice@gmail.com, hjpark@sogang.ac.kr")
  const to = String(raw || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  if (!to.length) return { skipped: true };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM || 'Sogang ME <onboarding@resend.dev>', to, subject, html }),
      signal: AbortSignal.timeout(8000),   // 신청 응답을 기다리게 하므로 8초 넘으면 포기(폼은 정상 접수, 메일만 생략)
    });
    // 2xx가 아니면 상태·본문을 남긴다 — 잘린 API 키로 메일이 조용히 안 가던 일(docs/HANDOFF.md)을 Vercel 로그에서 바로 볼 수 있게(2026-10-13)
    if (!r.ok) console.error('notify failed', r.status, (await r.text().catch(() => '')).slice(0, 300));
    return { ok: r.ok };
  } catch (e: any) { console.error('notify failed', e?.message); return { ok: false }; }
}
