import { parseFragment, serialize } from 'parse5';

/** 본문 HTML을 브라우저가 파싱해 만드는 구조 그대로 다시 직렬화한다(서버 전용 — 페이지 렌더링 때만).
 *  옛 글 45건(2026-10-13 전수 검사)은 <div>·<p>가 닫히지 않아, 브라우저가 뒤따르는 '이전/다음 글' 영역까지 본문 안으로 끌어들이면서
 *  React hydration 불일치(#418)가 나고 페이지를 클라이언트에서 다시 그렸다. DB 원문은 그대로 두고 표시할 때만 정리한다(parse5는 HTML 표준 파서). */
export function normalizeHtml(html: string): string {
  if (!html) return '';
  try { return serialize(parseFragment(html)); } catch { return html; }
}
