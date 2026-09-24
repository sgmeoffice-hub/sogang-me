import { glossaryPrompt, polishEnglish } from './glossary';
import { facultyNames, namesIn, namesPrompt, enforceNames, type NameRow } from './names';

/**
 * KO -> EN 번역.
 *  - ANTHROPIC_API_KEY 설정 시 : Claude 번역 (문맥·전문용어 정확, 권장)
 *  - 미설정 시                  : 무료 번역기(Google 웹 엔드포인트 / MyMemory) — 품질이 낮습니다
 */
const FREE_LIMIT = 4500;

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

async function gtx(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`gtx ${r.status}`);
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
async function freeText(text: string): Promise<string> {
  if (!text.trim()) return text;
  const chunks: string[] = []; let buf = '';
  for (const line of text.split(/(?<=[.!?。]\s|\n)/)) { if ((buf + line).length > FREE_LIMIT) { chunks.push(buf); buf = ''; } buf += line; }
  if (buf) chunks.push(buf);
  const out: string[] = [];
  for (const c of chunks) { try { out.push(await gtx(c)); } catch { out.push(await mymemory(c)); } }
  return polishEnglish(out.join(''));
}
async function freeHtml(html: string): Promise<string> {
  const parts = html.split(/(<[^>]+>)/g); const res: string[] = [];
  for (const p of parts) res.push(p.startsWith('<') || !p.trim() ? p : await freeText(p));
  return res.join('');
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
    for (const [k, v] of entries) out[k] = enforceNames(names, /<[a-z][^>]*>/i.test(v) ? await freeHtml(v) : await freeText(v));
    return out;
  } catch (e: any) { console.error('translate failed', e?.message); return null; }
}
export const translateProvider = () => (process.env.ANTHROPIC_API_KEY ? 'claude' : 'free');
