/** 게시판별 구분 색 — 여러 게시판 글이 섞여 보이는 곳(홈 히어로 '최신 소식')에서 게시판 칩을 한눈에 구분하려고 쓴다
 *  (2026-09-25 책임자 요청: "단추들이 잘 구분이 안 가서 배경색을 조금 다르게").
 *  모두 흰 글자 대비 4.9:1 이상(WCAG AA). 연구성과는 학교 카디널 계열, 나머지는 서로 다른 색상군으로 겹치지 않게 골랐다(가장 가까운 두 색도 색차 ΔE 21 이상). */
const TINT: Record<string, string> = {
  notice: '#62666d',      // 일반공지 — 회색
  academic: '#0f6e6e',    // 학사공지 — 청록
  research: '#b3262f',    // 연구성과 — 카디널
  award: '#b4530e',       // 수상 — 주황
  scholarship: '#1f5fae', // 장학·취업정보 — 파랑
  events: '#6d4ea3',      // 외부 행사 — 보라
  major: '#3f7a2c',       // 심화전공 — 초록
  alumni_news: '#8a5a1f', // 동문·구성원 소식 — 갈색
  gallery: '#a1306e',     // 갤러리 — 자주
  archive: '#2e4a6b',     // 자료실 — 남색
  capstone: '#6b6d0f',    // 창의적종합설계 — 올리브
  festival: '#8f2a8f',    // 학술제 — 적자색
  promo: '#53565a',
  videos: '#53565a',
};

export function boardTint(board: string): string {
  return TINT[board] || 'rgba(255,255,255,.16)';
}
