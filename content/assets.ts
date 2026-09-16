/** Media reused from the existing department site / Sogang UI assets. Replace with department-owned uploads later (관리자 > 메인·설정).
 *  구 도메인(me.sogang.ac.kr) 만료에 대비해 원본을 Storage `legacy/`로 옮겨 참조한다 (2026-08-31).
 *  /media/ 아래 파일은 Mixkit 무료 라이선스(상업 이용·수정 가능, 출처표기 불요) 영상에서 추출·인코딩한 것:
 *  hero-design=mixkit #46952(전투기 저공비행), hero-thermal=#154(잉크 유동), hero-control=#47257(산업 로봇),
 *  page-entrance=#5900(캠퍼스), page-research=#17456(실험 튜브),
 *  page-festival=#48166(강의실 팀활동), page-industry=#47257, page-ureca=#23618(연구실 현미경). */
// legacy 미디어는 Cloudflare R2로 이전(2026-09-01) — Supabase 무료 한도(1GB) 대응. 신규 업로드는 계속 Supabase.
const media = 'https://pub-752d1dfed9d84e0f957284985c30f806.r2.dev/legacy';
/** public/media/ 의 영상·이미지 사본도 R2(site/media/)에서 서빙한다(2026-09-16) — Vercel 무료 한도(월 요청 100만 건)를
 *  히어로 영상 요청이 잡아먹어 사이트가 멈춘 뒤의 조치. public/media/ 원본은 리포에 그대로 두되(백업·재업로드용) 사이트는 R2를 본다.
 *  파일을 바꾸면 R2에도 같은 키(site/media/…)로 다시 올려야 한다. */
export const siteMedia = 'https://pub-752d1dfed9d84e0f957284985c30f806.r2.dev/site/media';
export const assets = {
  campusVideo: 'https://www.sogang.ac.kr/banner/61_1.mp4',
  mainVisual: `${media}/v2/images/main/m_visual02.jpg`,
  ureca: `${siteMedia}/pages/page-ureca.jpg`,
  entrance: `${siteMedia}/pages/page-entrance.jpg`,
  industry: `${siteMedia}/pages/page-industry.jpg`,
  research: `${siteMedia}/pages/page-research.jpg`,
  festival: `${siteMedia}/pages/page-festival.jpg`,
};
/** 홈 히어로 배경: 4개 기초 분야 영상 14개 (공식 순서: 설계·역학 / 열·유체 / 제어·로보틱스 / 생산·제조 — 설계·역학은 항공우주 2개 추가로 5개).
 *  배열 순서를 분야 라운드로빈으로 두어 CSS 폴백 슬라이드쇼도 분야가 번갈아 나온다.
 *  추가분 Mixkit 출처: design-2=#609(러닝 슬로모션·생체역학), design-3=#46963(반도체 조립라인 기계 내부),
 *  thermal-2=#47051(반도체 회로 매크로), thermal-3=#50951(연기 유동 가시화), control-2=#47266(회로 조립기),
 *  control-3=#31933(드론 호버링 슬로모션), manufacturing=학과 제공 로봇핸드 연구영상(구글드라이브 원본 1:31~1:37, 센서리스 힘제어 데모),
 *  manufacturing-2=#3968(바이오 셀 매크로), manufacturing-3=#35540(스포츠카 고속도로 주행),
 *  design-4=#47398(국제우주정거장 ISS 클로즈업), design-5=#45228(우주왕복선 발사). */
const hv = (name: string, field: string) => ({ field, src: `${siteMedia}/hero/hero-${name}.mp4`, poster: `${siteMedia}/hero/hero-${name}.jpg` });
export const heroFieldVideos = [
  hv('design', 'design'), hv('thermal', 'thermal'), hv('control', 'control'), hv('manufacturing', 'manufacturing'),
  hv('design-2', 'design'), hv('thermal-2', 'thermal'), hv('control-2', 'control'), hv('manufacturing-2', 'manufacturing'),
  hv('design-3', 'design'), hv('thermal-3', 'thermal'), hv('control-3', 'control'), hv('manufacturing-3', 'manufacturing'),
  hv('design-4', 'design'), hv('design-5', 'design'),
];
/** Section hero images */
export const sectionHero: Record<string, string> = {
  about: assets.mainVisual, faculty: assets.research, undergraduate: assets.entrance, graduate: assets.ureca,
  industry: assets.industry, board: assets.festival, alumni: assets.mainVisual, default: assets.mainVisual,
};
