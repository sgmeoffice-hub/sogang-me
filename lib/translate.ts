import { glossaryPrompt, polishEnglish, preKo } from './glossary';
import { facultyNames, namesIn, namesPrompt, enforceNames, type NameRow } from './names';
import { segmentHtml, renderUnit, HANGUL, type Unit } from './html-segments';

/**
 * KO -> EN 번역.
 *  - ANTHROPIC_API_KEY 설정 시 : Claude 번역 (문맥·전문용어 정확, 권장)
 *  - 미설정 시                  : 무료 번역기(Google 웹 엔드포인트 / MyMemory) — 품질이 낮습니다
 */

const SYSTEM = `You translate Korean content from a university mechanical-engineering department website into professional English for an international academic audience.

Rules:
- Korean routinely omits subjects. NEVER invent a first-person subject ("I", "my", "we", "our") unless the Korean text explicitly uses one. Department news is written in the third person: "Professor Choi's research field is microfluidics", not "My research field is...".
- Keep the register of an official university announcement: neutral, factual, third person, past or present tense as appropriate.
- Preserve every HTML tag, attribute, link and structure exactly; translate only human-readable text.
- Korean names: give names in Given-name Family-name order in the romanization already used on the site when it appears in the text; otherwise use standard romanization. Do not translate names into English words.
- Keep course codes (MEE1006), journal names, lab names, company names and awards accurate. Journal and conference names stay in their original English form.
- Convert "605호" style room numbers to "Room 605". Academic terms: "2025학년도 2학기" = "Fall 2025", "1학기" = "Spring".
- Use this glossary exactly:
${glossaryPrompt}

Return ONLY a JSON object with the same keys as the input and translated string values. No markdown, no commentary.`;

/* ── 무료 번역 경로 (2026-09-25 개편) ────────────────────────────────────────────
 * 예전: 본문 텍스트 조각마다 요청 1번 → 글 1건에 수십~수백 요청 → Google이 429로 막고, 예비(MyMemory)는 하루 한도가 작아 곧 소진
 *       → 번역 실패 → 영문 없이 저장.
 * 지금: ① 본문을 번역 단위로 묶어(lib/html-segments) 한 요청에 여러 문장을 보낸다(글 1건 = 보통 1~3요청)
 *       ② 429·5xx는 잠시 기다렸다 재시도(Retry-After 존중) ③ 그래도 안 되면 다른 무료 엔드포인트 → MyMemory 순으로 넘어간다.
 *       ④ 그래도 실패한 글은 매일 03시 cron과 관리자 화면 접속 시 자동 재시도가 채운다(lib/translate-backfill). */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
class HttpError extends Error { constructor(public status: number, public retryAfter: number) { super(`HTTP ${status}`); } }
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; sogang-me-translator)' };

/** 여러 문장을 한 번에: 응답은 입력 순서대로의 배열. 인라인 표지(⟦n⟧)도 대부분 그대로 돌려준다. */
async function dictBatch(texts: string[]): Promise<string[]> {
  const body = new URLSearchParams(); for (const t of texts) body.append('q', t);
  const r = await fetch('https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ko&tl=en', {
    method: 'POST', headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body,
  });
  if (!r.ok) throw new HttpError(r.status, Number(r.headers.get('retry-after')) || 0);
  const j = await r.json();
  const arr = Array.isArray(j) ? j.map((x: any) => (Array.isArray(x) ? String(x[0] ?? '') : String(x ?? ''))) : [];
  if (arr.length !== texts.length || arr.some((s, i) => !s.trim() && texts[i].trim())) throw new Error('dict: unexpected response');
  return arr;
}
async function gtx(text: string): Promise<string> {
  const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(text)}`, { headers: UA });
  if (!r.ok) throw new HttpError(r.status, Number(r.headers.get('retry-after')) || 0);
  const j = await r.json();
  return (j[0] || []).map((s: any) => s[0]).join('');
}
async function mymemory(text: string): Promise<string> {
  const email = process.env.TRANSLATE_CONTACT_EMAIL ? `&de=${encodeURIComponent(process.env.TRANSLATE_CONTACT_EMAIL)}` : '';
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en${email}`);
  if (!r.ok) throw new Error(`mymemory ${r.status}`);
  const j = await r.json();
  if (!j.responseData?.translatedText || j.responseStatus !== 200) throw new Error('mymemory failed');
  return j.responseData.translatedText;
}
/** 429·5xx·네트워크 오류는 1.5s → 4s 기다렸다 재시도 (Retry-After가 있으면 최대 8초까지 따른다) */
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e: any) {
      const retriable = !(e instanceof HttpError) || e.status === 429 || e.status >= 500;
      if (!retriable || i >= tries - 1) throw e;
      await sleep(Math.min(8000, e instanceof HttpError && e.retryAfter ? e.retryAfter * 1000 : [1500, 4000, 8000][i]));
    }
  }
}
/** 문장 배열을 요청 크기(≈3,500자·40문장) 단위로 묶어 순서대로 번역. 묶음이 실패하면 그 묶음만 한 문장씩 예비 경로로. */
async function freeBatch(texts: string[]): Promise<string[]> {
  const out: string[] = new Array(texts.length);
  const idx = texts.map((t, i) => i).filter((i) => HANGUL.test(texts[i]));
  texts.forEach((t, i) => { if (!HANGUL.test(t)) out[i] = t; });   // 한글 없는 문장은 그대로
  const groups: number[][] = []; let cur: number[] = []; let size = 0;
  for (const i of idx) { const n = texts[i].length; if (cur.length && (size + n > 3500 || cur.length >= 40)) { groups.push(cur); cur = []; size = 0; } cur.push(i); size += n; }
  if (cur.length) groups.push(cur);
  for (const g of groups) {
    try {
      const res = await withRetry(() => dictBatch(g.map((i) => texts[i])));
      g.forEach((i, k) => { out[i] = res[k]; });
    } catch {
      for (const i of g) {
        const t = texts[i];   // 자르지 않는다 — 너무 길어 실패하면 예외로 넘겨 나중에 자동 재시도(잘린 번역을 저장하지 않기 위해)
        out[i] = await withRetry(() => gtx(t)).catch(() => mymemory(t));
        await sleep(300);
      }
    }
    if (groups.length > 1) await sleep(250);   // 연속 요청 간격
  }
  return out;
}
async function freeHtml(html: string): Promise<string> {
  const parts = segmentHtml(html);
  const units = parts.filter((p): p is Unit => typeof p !== 'string');
  const tr = await freeBatch(units.map((u) => preKo(u.text)));
  let k = 0;
  return polishEnglish(parts.map((p) => (typeof p === 'string' ? p : renderUnit(p, tr[k++]))).join(''));
}

async function viaClaude(fields: Record<string, string>, names: NameRow[]): Promise<Record<string, string> | null> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
    max_tokens: 16000,
    system: SYSTEM + namesPrompt(names),   // 원문에 나오는 교수의 공식 영문 이름·연구실명을 용어집으로
    messages: [{ role: 'user', content: JSON.stringify(fields) }],
  });
  if (res.stop_reason === 'max_tokens') { console.error('translate: response truncated at max_tokens'); return null; }
  const text = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('').replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(text);
    for (const k of Object.keys(parsed)) if (typeof parsed[k] === 'string') parsed[k] = enforceNames(names, polishEnglish(parsed[k]));
    return parsed;
  } catch { return null; }
}

/** 긴 본문(HTML)을 문단 경계로 나눠 여러 요청으로 번역한다 — 잘라서 저장하지 않기 위해. */
export async function translateLongContent(html: string, chunkSize = 9000): Promise<string | null> {
  if (html.length <= chunkSize) { const r = await translateKoToEn({ content: html }); return r?.content ?? null; }
  const parts = html.split(/(?<=<\/p>|<\/table>|<\/ul>|<\/ol>|<\/h[1-6]>)/i);
  const chunks: string[] = []; let buf = '';
  for (const p of parts) { if (buf && (buf + p).length > chunkSize) { chunks.push(buf); buf = ''; } buf += p; }
  if (buf) chunks.push(buf);
  const out: string[] = [];
  for (const c of chunks) {
    const r = await translateKoToEn({ content: c });
    if (!r?.content) return null;   // 일부라도 실패하면 절단본을 저장하지 않는다
    out.push(r.content);
  }
  return out.join('');
}

export async function translateKoToEn(fields: Record<string, string>): Promise<Record<string, string> | null> {
  const entries = Object.entries(fields).filter(([, v]) => v && v.trim());
  if (!entries.length) return {};
  // 원문에 등장하는 교수(이름·연구실)만 용어집으로 — 두 경로(Claude/무료) 모두 후처리로도 한 번 더 맞춘다
  const names = namesIn(await facultyNames(), entries.map(([, v]) => v).join('\n'));
  if (process.env.ANTHROPIC_API_KEY) {
    // 키가 설정돼 있으면 Claude 실패를 무료 번역기로 조용히 대체하지 않는다 —
    // 품질이 다른 결과가 검수 완료(en_verified)처럼 저장되는 것을 막고, 실패는 실패로 보고한다.
    return await viaClaude(Object.fromEntries(entries), names);
  }
  try {
    const out: Record<string, string> = {};
    // 제목·요약·분류 같은 짧은 칸은 한 요청으로 묶고, HTML 본문은 따로 단위 묶음 번역
    const html = entries.filter(([, v]) => /<[a-z][^>]*>/i.test(v));
    const plain = entries.filter(([, v]) => !/<[a-z][^>]*>/i.test(v));
    if (plain.length) {
      const tr = await freeBatch(plain.map(([, v]) => preKo(v.replace(/\s+/g, ' ').trim())));
      plain.forEach(([k], i) => { out[k] = enforceNames(names, polishEnglish(tr[i])); });
    }
    for (const [k, v] of html) out[k] = enforceNames(names, await freeHtml(v));
    return out;
  } catch (e: any) { console.error('translate failed', e?.message); return null; }
}
export const translateProvider = () => (process.env.ANTHROPIC_API_KEY ? 'claude' : 'free');
