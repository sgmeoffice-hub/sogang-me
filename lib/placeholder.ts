/** Auto-generated cover image (SVG data URI) for posts without a photo — category-tinted, with the title's leading words. */
const palettes: Record<string, [string, string]> = {
  notice: ['#53565a', '#1a1a1a'], academic: ['#0b4f6c', '#062a3a'], research: ['#af272f', '#5c1116'], award: ['#d86018', '#8a3a0c'],
  scholarship: ['#00558c', '#002e4d'], gallery: ['#719949', '#3b5527'], default: ['#75787b', '#3a3c3e'],
};
export function coverFor(board: string, title: string, seed = 0) {
  const [a, b] = palettes[board] || palettes.default;
  const t = (title || '').replace(/[<>&"]/g, '').replace(/'/g, '’').trim(); // SVG 속성 따옴표와 겹치지 않게 Son's → Son’s
  const words = t.split(/\s+/).slice(0, 3).join(' ');
  const short = words.length > 22 ? words.slice(0, 22) + '…' : words.replace(/[,.:;·]+$/, ''); // '손기헌 교수 연구실,'처럼 끝 문장부호 제거
  // 호출부는 로케일에 맞는 제목을 넘긴다(영문 페이지에 국문 표지 방지)
  const rot = (seed * 37) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 400'><defs><linearGradient id='g' gradientTransform='rotate(${rot})'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient><pattern id='p' width='28' height='28' patternUnits='userSpaceOnUse'><path d='M28 0H0v28' fill='none' stroke='white' stroke-opacity='.12'/></pattern></defs><rect width='640' height='400' fill='url(#g)'/><rect width='640' height='400' fill='url(#p)'/><circle cx='560' cy='80' r='120' fill='white' fill-opacity='.06'/><circle cx='80' cy='360' r='90' fill='white' fill-opacity='.05'/><text x='40' y='330' font-family='Pretendard, Apple SD Gothic Neo, sans-serif' font-size='30' font-weight='700' fill='white' fill-opacity='.9'>${short}</text><text x='40' y='60' font-family='Pretendard, sans-serif' font-size='16' letter-spacing='3' fill='white' fill-opacity='.7'>SOGANG MECHANICAL ENGINEERING</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
