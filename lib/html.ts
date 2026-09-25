/** Convert admin input to safe-ish display HTML. Plain text (no block tags) gets paragraphs/line breaks. */
export function toHtml(input: string | null | undefined): string {
  const s = (input || '').trim();
  if (!s) return '';
  if (/<(p|div|br|ul|ol|h[1-6]|table|blockquote|img|iframe|figure)\b/i.test(s)) return s;
  return s.split(/\n{2,}/).map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('\n');
}
/** 화면 표시용(저장 금지): 본문 표를 가로 스크롤 상자로 감싼다 — 옛 글·교과과정의 넓은 표가 모바일(390px)에서 페이지 전체를 넓혀
 *  화면이 축소되거나 옆으로 밀리던 문제(2026-09-25 전체 점검). DB에는 원문 그대로 두고 렌더링 때만 적용한다. */
export function wrapTables(html: string): string {
  if (!html || !/<table\b/i.test(html)) return html;
  return html.replace(/<table\b/gi, '<div class="tbl-scroll"><table').replace(/<\/table\s*>/gi, '</table></div>');
}
/** Extract YouTube video id from any common URL form. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  // [?&]v= : 다른 파라미터 꼬리(rev= 등)를 v=로 오인하지 않게. /live/ 형식도 지원.
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/);
  return m ? m[1] : null;
}
/** 이메일 등 HTML 문맥에 사용자 입력을 넣을 때의 이스케이프. */
export const escapeHtml = (s: string | null | undefined) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** Supabase Storage 공개 URL은 ?download= 을 붙여야 저장(다운로드)으로 응답한다. */
export const downloadUrl = (url: string, filename?: string) =>
  /\/storage\/v1\/object\/public\//.test(url) ? `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(filename || '')}` : url;
export const youtubeThumb = (url: string | null | undefined) => { const id = youtubeId(url); return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null; };
export function youtubeStart(url: string | null | undefined): number { const m = (url || '').match(/[?&]t=(\d+)/); return m ? Number(m[1]) : 0; }
