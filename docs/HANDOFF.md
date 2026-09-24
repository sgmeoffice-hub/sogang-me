# HANDOFF — 세션 간 인수인계

마지막 갱신: 2026-09-22

## 진행 (2026-09-22) — 교수 상세 재배치 + 홈 히어로 최신 소식 위젯
- **교수 상세(`app/[locale]/faculty/[id]/page.tsx`) 재배치** (책임자: "언밸런스한데 시각적으로 좋게"). 원인: `research_ko/en`이 전임 18명 전원 비어 있고 `bio`는 1명뿐이라 오른쪽 본문 칸이 늘 빈 2단이었음. 새 구성: 사진 열 + 프로필(분야 배지·이름·영문명·연구실 강조·연락처 2열·융합연구 그룹·버튼 3개[연구실 홈페이지/이메일/목록]) → research/bio가 있으면 그 아래 → 소속 분야 소개 카드(홈 4대 분야 카드 톤) + 같은 분야 교수진 목록. 명예교수는 분야 블록 대신 "다른 명예교수" 2열 목록. 모바일은 사진(124px)+이름을 나란히. 로컬 스크린샷 검수 완료(김남근·강성원·이철수·조성환, ko/en, 1280/390).
- **홈 히어로 최신 소식 위젯** (학과장 김남근 교수 메일 9/22: "모든 게시판 최신 3건을 첫 화면에 작은 창으로") — 설계 워크플로(3안→심사 2→종합) 결과대로 구현(커밋 62a48dd, 브랜치). `components/HeroVideo.tsx`: 데스크톱(국문 lg+/영문 xl+, 영문은 xl에서 카드 300px·2xl 340px — 340px이면 영문 태그라인이 3줄로 늘어남)은 텍스트 컬럼 오른쪽 유리 카드(bg-black/70+blur, 버튼 줄과 바닥선 정렬), 그 외는 버튼 아래 접힌 `<details>` 한 줄(48px, JS 0). `lib/data.ts` getHomeData에 `latest` 쿼리(published·show_on_home, promo·videos 제외, created_at desc·id desc, limit 3), `lib/i18n.ts` latestTitle/latestSub/latestAll/pinned, page.tsx 학과 소식 섹션 `id="news"`. 정책: 고정글 우선 정렬 안 함(오래된 고정 공지 독점 방지), NEW 칩 없음. 실측: 국문 1024/1280/1440·영문 1280/1440 태그라인 줄 수 위젯 유무 동일(2줄).
- **리뷰 워크플로(4관점 → 발견 22건 → 반박 검증 2명) 결과 반영**: ① 위젯 제목 `block`+`line-clamp-2` 충돌로 말줄임이 안 되던 것(`block` 제거) ② 명예교수에 전임 시절 field가 남으면 '같은 분야 교수진'이 명예교수 전체로 잘못·중복 렌더되던 잠재 결함(명예교수는 `area` 무시 + `saveFaculty`에서 category=emeritus면 field=null) ③ '전체 소식 →' 앵커를 next/link 대신 순수 `<a>`(30초 뒤 클릭마다 RSC 재요청 방지) ④ 위젯 Link `prefetch={false}`(홈 진입당 엣지 요청 +3 방지) ⑤ 모바일 시트 하단 링크 44px ⑥ 분야 배지 글자색 잉크색(주황 대비 3.75:1 미달) ⑦ 소소한 것: 분야 카드 아이브로 축약, 같은 분야 목록 제목 중복 제거, 명예교수 목록 보조 줄 영문 이름 통일, 연락처 break-all→이메일·URL만, 새 창 링크 sr-only. 반박된 지적 2건(부제 줄바꿈, 제외 게시판 정책)은 미반영.
- **교수 영문 이름 자동 교정(9/24, 책임자: 번역이 이름을 'Seok-Hwan Jeong'·'Shin Chung-soo'로 씀)**: `lib/names.ts`가 faculty 테이블(name_ko/name_en, lab)을 10분 캐시로 읽어 ① 번역 프롬프트에 원문 등장 교수만 용어집으로 추가 ② 번역 결과를 `lib/names-core.ts` `enforceNames`로 후처리(1단계 하이픈·공백·성-이름 순서 변형, 2단계 성씨 이형(Jeong/Jung/Chung, Shin/Sin…)+이름 자음 골격 일치). 원문에 그 교수의 한글 이름이 있을 때만 작동. 기존 게시글 16건 32필드 REST로 일괄 교정(#51~61, 113, 2396, 2397, 2411, 2416). 교수 영문 이름은 /adm 교수진에서 고치면 자동 반영.
- **언어가 반대로 뒤집히던 진짜 원인(9/24)**: 헤더 전환 버튼이 next/link라 화면에 보이면 `/xx?setlang=1`을 프리페치했고, 미들웨어가 그 요청에 Set-Cookie(반대 언어)로 응답 → 한국어 페이지를 보기만 해도 다음 접속이 /en. 수정: 버튼을 일반 `<a>`로, 미들웨어는 rsc/next-router-prefetch/sec-fetch-dest≠document 요청에서는 쿠키를 저장하지 않음. 진단은 `/api/lang`.
- **언어 자동 판별 순서 변경(9/24, 책임자: "영어로 접속되는 일이 잦다")**: 쿠키 → 브라우저 언어에 ko 포함이면 ko → 한국 IP면 ko → 그 밖만 en (`middleware.ts`). 예전엔 IP 국가가 먼저라 해외 IP(VPN·출장·해외로 잡히는 통신망)에서는 한국어 브라우저도 /en. 남는 영어 진입 경로: 전환 버튼으로 저장된 `sg_lang=en` 쿠키(1년), /en 링크 직접 방문(구글 검색·북마크).
- **서강체(SogangFont) 미적용 확정**: `/fonts/SogangFont.ttf`가 리포에 없어 배포 후 줄곧 404(모든 페이지가 요청)였고 font-brand는 Pretendard로 렌더돼 왔음. 공식 서체는 무료·웹폰트 허용(눈누 jsDelivr WOFF2 존재, R2 `site/fonts/SogangFont.woff2`에 사본 업로드해 둠 — R2 토큰에 CORS 설정 권한이 없어 교차 출처 로드는 안 됨). 책임자가 비교 스크린샷을 보고 "기존 폰트 유지" 결정(9/22) → @font-face 선언과 폰트 스택에서 SogangFont 제거, CLAUDE.md 테마 문구 갱신.
- 대학원 2027 전기 모집요강·포스터 게시는 박현주 선생님이 9/22 완료(게시글 2414).
- 두 변경 모두 레이아웃 변경이라 작업 브랜치 push → Vercel 미리보기로 책임자 확인 후 main 반영.

## 완료 (2026-09-17) — 박현주 선생님 요청 (메일 9/17, 캡처 PPT)
- 연혁에 `2026.09 제18대 학과장 김남근 교수` 추가 (`content/pages-about.ts` history, en: Prof. Namkeun Kim, 18th chair)
- 관리자 본문 편집기에 **글자 색**(프리셋 6개 + 색 고르기) · **정렬**(좌/중/우) 버튼 추가 (`components/admin/RichEditor.tsx`, tiptap extension-text-align/color/text-style 설치). 저장되는 HTML은 `style="text-align:…"`, `<span style="color:…">` — 공개 화면 `toHtml`은 스타일을 지우지 않으므로 그대로 반영됨
- 본문 줄간격 `.prose-sg` 1.9 → 1.7 (`app/globals.css`, 관리자 편집기도 같은 클래스라 함께 적용)
- 게시글 상세 제목 2.5rem → 2rem (모바일 1.9→1.6rem), `break-keep` 추가 (`app/[locale]/board/[board]/[id]/page.tsx`)
- 로컬 E2E: 편집기에서 가운데 정렬·빨강 적용 시 hidden input HTML에 스타일 포함 확인, 공개 글 h1 32px·line-height 28px 확인, 연혁 페이지에 18대 표시 확인
- **카드 썸네일 자동 채움**: 본문 편집기 "사진" 버튼으로만 사진을 넣고 썸네일 칸을 비운 글의 카드가 기본 표지로 나오던 문제(책임자: "문제 있을 때마다 고치지 말고 자동으로"). `savePost`가 썸네일이 비어 있으면 본문 첫 `<img>`를 `thumbnail_url`로 저장하고, 자동 채운 썸네일이 본문에서 사라지면 새 본문 첫 사진으로 갱신(직접 올린 썸네일은 유지). 기존 글은 관리자 작성분 10건(2390~2412) REST로 일괄 채움. 이관 글 53건(썸네일 없음·본문 사진 있음)은 옛 표 캡처 등이 섞여 있어 손대지 않음
- 참고: 현대모비스 트랙 26년 하반기 선발 안내는 박현주 선생님이 9/11 게시판에 이미 게시함 (코드 작업 없음)

## 장애 (2026-09-16) — Vercel Hobby 한도 초과로 사이트 정지(HTTP 402 DEPLOYMENT_DISABLED)
- 증상: me.sogang.ac.kr 전체가 402. Vercel 팀 "SG office" 사이드바에 "exceeded the Hobby fair use limits. Upgrade to Pro to resume service". Supabase는 정상.
- 사용량(8/17~9/16): Edge Requests **1.6M/1M**, Function Invocations **2.1M/1M**, Fluid Active CPU **12h/4h** 초과. Fast Data Transfer 41.6/100GB, Fast Origin Transfer 8.45/10GB.
- 원인(추정): ① `HeroRotator`가 5.5초마다 `<video>`를 갈아끼워 홈 탭 하나가 열려 있는 동안 영상·포스터 요청이 계속 발생(Vercel은 /public을 max-age=0으로 내보내 304도 요청 1건) ② 사이트맵 4,742개 URL을 크롤러(AI 수집 봇 포함)가 반복 수집 → ISR 60초 만료마다 함수 호출 ③ 게시판 목록은 searchParams 때문에 항상 동적 렌더.
- 조치(코드, 이 커밋): `public/media/**` 37개 파일을 R2 `site/media/`에 업로드(immutable 캐시)하고 `content/assets.ts`·`components/StaticPage.tsx` 경로를 R2로 전환(`siteMedia`), `HeroRotator` 영상 요소를 한 번만 마운트(`preload="none"`, 차례 온 것만 로드·재생), `app/robots.ts`에 AI 수집 봇 차단, `next.config.mjs`에 `/media`·`/images` 장기 캐시 헤더, ISR revalidate 60→3600(게시글 상세)·300→3600(고정 페이지)·홈 600(관리자 저장 시 `revalidatePath('/', 'layout')`로 즉시 갱신되므로 안전).
- 조치(계정): 서비스 복구는 Vercel **Upgrade to Pro**(월 20달러, 팀 Settings → Billing)로만 즉시 가능. 사용량 주기는 매월 17일 리셋으로 보임. Pro 유지 여부는 한 달 뒤 Usage를 보고 결정(코드 조치로 요청 수가 충분히 내려가면 Hobby로 다운그레이드 가능).
- 복구: 책임자가 2026-09-16 Pro로 업그레이드 → 사이트 즉시 복구. 주의: **정지 중에 push한 커밋(a3f7015)은 Vercel이 배포를 만들지 않았다** — 재개 뒤 새 커밋을 push해야 배포된다(이 커밋). "Downgrade from Pro" 버튼은 기간 종료 예약이 아니라 **즉시** 다운그레이드이므로, 사용량이 내려간 것을 확인한 뒤(최소 9/17 주기 리셋 이후) 눌러야 한다.
- 남은 점검: 배포 후 Vercel Usage에서 Edge Requests·Function Invocations 일일 추이 확인. 계속 높으면 게시판 목록 페이지를 정적 경로(`/board/[board]/page/[n]`)로 바꾸는 것 검토. `docs/GUIDE-학과홈페이지-Claude제작.md`·docx에도 이 교훈 반영함.

## 완료 (최근)
- **기존 홈페이지 → 새 사이트 전체 콘텐츠 이관 완료** (2026-08-31): `docs/LEGACY-BACKUP.md`의 파이프라인 실행 완료. 백업 2개 다운로드·SHA-256 검증 → `parse_dump.py` → plan/upload/insert 전부 성공
  - 게시글 **2,275건** 삽입 (scholarship 1,233 / notice 668 / award 124 / events 93 / research 65 / gallery 29 / archive 29 / major 24 / alumni_news 10) — plan 검증값과 정확히 일치, posts 테이블 총 2,353건
  - 첨부·본문 이미지 **3,216개(1.27GB)** Storage `media` 버킷 `legacy/` 업로드 (백업에 원본 없는 2개만 제외, 업로드 실패 0)
  - 검수: board별 건수 일치, 본문 `{{MEDIA}}` 플레이스홀더 잔여 0건, 첨부·본문 이미지 공개 URL 200 확인. **게시판 화면 최종 확인은 브라우저에서 필요**
- 기존 홈페이지 백업(업체 제공, 구글드라이브 보관) 다운로드·검수 완료: 그누보드4+5 MySQL 덤프 + 웹파일 1.9GB. 내용물 목록·체크섬·개인정보 주의 테이블은 `docs/LEGACY-BACKUP.md` 참조
- 전공소개 페이지(`/undergraduate/majors`) 전면 재작성: 4개 분야를 공식 순서로 정렬, 각 분야를 고유 정체성+산업 응용 중심으로 서술, Physical AI는 트렌드 연결로만 언급 (`content/majors.ts`, ko/en)
- 전공소개 상단: 캡처 이미지(physical-ai-overview.jpg) 제거 → 네이티브 다이어그램으로 대체. Physical AI 허브(신경망 SVG 심볼 + SMIL 애니메이션) → 연결선 → 4개 분야 카드(역할: 골격과 근육 / 혈관과 호흡 / 두뇌와 신경 / 실체로 만드는 손), 카드 클릭 시 해당 분야 앵커로 이동 (`app/[locale]/undergraduate/[slug]/page.tsx`)
- 홈 히어로 4대 분야 스트립 모바일 수정: 엠블럼+텍스트 가로 배치가 390px에서 깨지던 것을 세로 배치로 전환 (`components/HeroVideo.tsx`)
- 홈 4대 분야 카드 모바일 수정: 텍스트 폭 60% 제한 해제, 배경 엠블럼 모바일 투명도 축소 (`app/[locale]/page.tsx`)
- 전체 콘텐츠 파일에서 Physical AI 편중 점검 완료: `pages-grad.ts`, `pages-ug.ts`, `areas.ts`, `i18n.ts`는 이미 균형 잡혀 있어 미수정

## 진행 중 — 다음 세션이 이어서 할 것
- (없음 — 아래 "보류 · 대기"의 항목들만 남음)

## 완료 (2026-09-05) — 사용시설 예약 개선 (박현주 선생님 요청 6건, 책임자 지시)
- 요청 원문: 메일 "(사용시설 예약 수정 문의)" + 첨부 PPT '사용시설 예약 개선사항' 6항목. 6번(여러 날짜 한 번에 예약)은 책임자 판단으로 **관리자 전용 기능**으로 구현하고 홈페이지에는 "정기·다건 예약은 학과사무실로 연락" 안내문을 넣음
- ① 시설 순서: 학과회의실 → 세미나실 → 제도실 → 공용서버 1~4 (`lib/nav.ts` facilities, 첫 항목이 공개 페이지·관리자 폼 기본값)
- ② 수정 모드: 관리자 달력의 예약 클릭 또는 목록 '수정' → 상단에 수정 폼(시설·날짜·시간·이름·목적·상태). 겹치면 저장 안 하고 안내. `updateReservation`(actions.ts). 다른 예약으로 전환 시 폼이 리마운트되도록 `key={editing.id}` 필수(리뷰에서 잡힌 HIGH 결함)
- ③ 삭제 확인창: `components/admin/ReservationButtons.tsx`(클라이언트, confirm) — 승인/거절에는 확인창 없음
- ④ 관리자 화면 시설별 달력형: 공용 `components/ReservationCalendar.tsx`(공개 페이지와 공유). 승인 대기는 점선, 거절 건은 달력 미표시·월 목록에는 흐리게 표시(복구·삭제 가능)
- ⑤ 등록 후 시설·날짜 유지: 화면 상태를 쿼리스트링(f,y,m,d)으로 유지, 서버 액션이 같은 곳으로 리다이렉트(+note)
- ⑥ 30분 단위: `lib/reservation.ts` TIME_SLOTS(06:00~23:30) — 시작은 23:30 제외, 종료는 06:00 제외 + 24:00 허용. 공개 API·서버 액션 모두 `isHalfHour` 검증. 이관된 옛 예약의 30분 단위 아닌 시각(09:15 등)은 수정 폼에 '(기존)' 옵션으로 남겨 이름만 고쳐도 시간이 바뀌지 않음
- ⑦ 반복 등록(관리자 전용): 등록 폼의 "반복 등록" 매주/격주 + 종료일 → 같은 요일에 최대 30건 일괄 등록, 겹치는 날짜는 건너뛰고 안내
- 검증: 로컬에서 관리자 세션을 쿠키로 주입해 Playwright E2E(반복 등록 3건 → 겹침 건너뜀 → 수정 → 삭제 확인창 → A/B 전환 → 옛 시각 유지 → 거절 행 표시) 통과, 테스트 행 전부 삭제. 변경분 적대적 리뷰 워크플로(4렌즈, 15 에이전트) 확정 7건 전부 수정 후 재검증
- 관리자 세션 주입 테스트 방법(재사용): Supabase `/auth/v1/token?grant_type=password`로 세션 발급 → `sb-<ref>-auth-token` 쿠키에 `base64-`+base64url(JSON) 값으로 Playwright에 주입 (브라우저가 외부망을 못 타는 컨테이너에서 관리자 화면 검증용)

## 완료 (2026-09-02) — 전체 감사·수정 (책임자 지시: "논리적 오류·에러·버그 찾아서 고쳐줘")
- 8개 영역(보안 관리자/공개, 미들웨어, 데이터·캐싱, 게시판 UI, 관리자 CRUD, 예약·URECA, 다국어) 병렬 코드 감사 → 원시 87건 → 중복 제거 46건 → 적대적 검증 통과 **37건 확정, 전부 수정** (기각 9건은 프레임워크/RLS가 이미 막거나 재현 불가로 판정)
- **[중요·개인정보] 예약자 연락처 익명 노출 차단**: RLS `reservations public read using(true)`는 컬럼을 못 가려서, 누구나 anon 키로 REST 호출 시 전 예약자의 contact(전화)·소속을 덤프할 수 있었음 → 코드에서 공개 조회 컬럼 축소(lib/data.ts) + **`supabase/schema_v8.sql`의 컬럼 grant 적용 필요(아래 보류 참조)**
- 관리자 저장 버그: 게시글을 저장만 해도 excerpt_en이 매번 NULL로 지워지던 문제(폼에 없는 필드 보존), 신규 글·교수·페이지에서 직접 입력한 영문이 자동 번역으로 덮이던 문제, 편집만 해도 작성일 시각이 자정으로 잘려 정렬·이전/다음이 뒤틀리던 문제(날짜가 실제로 바뀔 때만 갱신, 신규 글은 KST 현재 시각 — created_at은 legacy 관례대로 'KST를 +00으로' 저장) 수정
- 관리자 편집기: HTML 편집→일반 편집 복귀 시 수정분 유실 수정, "AI 영문 번역" 버튼이 본문(RichEditor)에 반영 안 되던 문제 수정(sg-editor-set 이벤트), 관리자 추가(addAdmin)가 RLS 거부를 성공처럼 삼키던 문제(에러 표면화 + v8 정책), 관리자 예약 추가 검증(시간 역전·겹침)
- 번역 파이프라인: 일괄 번역이 본문을 12,000자에서 잘라 저장하던 문제(문단 단위 분할 번역), Claude 실패 시 무료 번역기로 조용히 대체돼 en_verified가 오염되던 문제(키 설정 시 실패는 실패로 보고), 실패 행이 매 반복 재선택돼 유료 호출이 낭비되던 문제(cursor), content_ko 없는 페이지가 영원히 재선택되던 문제 수정
- 공개 API 방어: 예약·URECA·조회수에 IP 레이트리밋(서버리스 인스턴스별 best-effort), URECA choices 검증, 알림 메일 HTML 이스케이프(주입 방지), 예약 동시 신청 레이스 시 늦은 쪽 자동 회수(RPC), URECA 재제출 대체가 RLS에 막혀 무동작(중복 누적)이던 문제(RPC), CSV 수식 주입 방어
- 사용자 화면: KST 자정~9시 작성 글 날짜 하루 밀림(위 created_at 관례 통일로 해소), 언어 전환 시 페이지·검색어 유실, 영문 페이지 lang="ko"(SetLang), 게시판 page 파라미터 NaN/범위 초과 500, 예약 달력 y·m 검증, 이전/다음 글이 같은 시각 글을 건너뛰던 문제, 영문 로케일 본문 검색, youtubeId /live/ 지원, promo·videos 빈 게시판 안내, 첨부 다운로드(?download=), 옛 URL 미들웨어(/kor/*.php 매처, DB 미발견 시 308→307), 일시적 DB 장애 시 빈 화면이 ISR 캐시에 굳던 문제(오류는 던져서 직전 정상 페이지 유지), 연구실 수에서 석좌 제외
- 남긴 것(의도적): hreflang alternates 미구현(SEO 개선 여지로만 기록), 창의적종합설계 882 글의 발표 영상 7개는 전부 비공개라 임베드 불가(본문 링크 유지)

## 완료 (2026-09-02)
- **신임교수 부임 소식 정비 (책임자 지시: "썸네일 얼굴 사진으로, 그 사이 부임한 교수님들 소식도")**: DB 콘텐츠 작업만 있었고 코드 변경 없음
  - 기존 674(2021 신임교수 2명 임용)·724(2022 김남근 임용) 글이 교수 프로필 표 캡처(연락처 노출)를 썸네일로 노출하던 것 → **개인별 부임 글 형식(2025년 최은표/송지환 글 스타일)으로 재작성**하고 썸네일을 faculty.photo_url의 얼굴 사진으로 교체. 674→정석환(2021-03), 724→김남근(2022-03). legacy_id·작성일 유지(옛 URL 리다이렉트 그대로 유효)
  - **누락 부임 소식 4건 신규 작성**: 김상엽(post 2396, 2021-03)·강성민(2397, 2024-03)·정헌재(2398, 2025-09)·김남중(2399, 2026-03). 전부 얼굴 사진 썸네일·국/영문 본문·발췌·show_on_home. 이로써 2021~2026 부임 교수 8명(정석환·김상엽·김남근·강성민·최은표·송지환·정헌재·김남중) 전원 부임 글 보유
  - 부임 시점 근거: 드라이브 백업 덤프의 옛 전임교수 게시판(g5_write_sub2_1) 소개글 작성일(정석환·김상엽 2021-03-02 / 김남근 2022-03-04 / 강성민 2024-03-04 / 최은표 2025-03-04 / 송지환 2025-08-28 / 정헌재 2025-11-24 / 김남중 2026-02-26) + 연구실 홈페이지 CV 교차 확인(강성민: 충남대 2016–2024→서강대 2024-03 / 김남중: 가천대 2021–2026→서강대 2026-03 / 김상엽: UIUC 박사·Yale 포닥·2025 부교수 승진). 정헌재는 소개글이 늦게 올라와(11월) 지도학생 수상 글(2025-11-05)로 가을학기 재직을 확인, **2025년 9월로 기재** — 만약 실제 발령일이 다르면 /adm에서 날짜·문구만 수정하면 됨
  - 학력·경력 문구 출처: 옛 사이트 교수 소개글(학위)·각 연구실 홈페이지(경력)·학과 연구성과 게시글(대표 논문). 검수: 로컬 프로덕션 빌드에서 홈 캐러셀 카드 8장 얼굴 썸네일 렌더링 스크린샷 확인(컨테이너 브라우저는 r2.dev 직접 접속이 안 되어 로컬 캐시로 대체 검증 — 실서비스는 112/113 글에서 이미 R2 썸네일 서빙 검증됨)

## 완료 (2026-09-01)
- **동문·구성원 소식 게시판 보강 (책임자 지시)**: 전 게시판을 전수 검토해 "완전 졸업한 동문의 졸업 후 성과"와 "구성원(교수진) 소식"만 선별 이동 — 재학생 수상·논문 실적은 카드뉴스 홍보용으로 수상/연구성과에 유지한다는 기준. 이동 7건(송한결 풀브라이트, 이종민 박사 리서치펠로우, 신임교수 임용 2건, 허남건 회장 당선·취임, 정시영 부회장) → 공개 19건. 옛 사이트 자체가 동문 소식을 거의 안 다뤄서(원본 10건) 이 이상은 신규 작성으로 채워야 함 — 앞으로 동문 임용·승진·창업 소식을 /adm에서 "동문·구성원 소식"으로 등록할 것
- **전도영 교수님 명예교수 전환** (책임자 지시): faculty id 13, is_emeritus=true·field 해제·sort 535(명예 가나다순 이형일-전도영-정시영). 전임 17명·명예 7명. 사이트 반영 확인 완료(교수 페이지는 5분 ISR 캐시라 DB 변경 후 수 분 지연 정상)
- **관리자 교수 폼에 "구분"(전임/명예/석좌) 셀렉트 신설**: 맨 아래 숨어 있던 명예교수 체크박스와 연구분야의 석좌 옵션을 폼 최상단의 명시적 구분 선택으로 통합(app/admin/faculty/[id], saveFaculty의 category 처리). 연구 분야 셀렉트는 4대 기초전공 전용으로 정리
- **공지사항 → 일반공지·학사공지 분리 (박현주 선생님·임종모 차장님 제안)**: 새 게시판 `academic`(학사공지) 신설, 기존 `notice`는 "일반공지"로 개명. 홈 화면은 공지 카드 캐러셀을 없애고 **두 칼럼 제목 리스트**(왼쪽 일반·오른쪽 학사, 각 8건, 제목 한 줄+날짜, 중요 배지)로 개편 — 모바일은 세로 스택(390px 오버플로 수정 완료, grid-cols-1 명시). 기존 공지 676건은 제목 기준 분류 후 전수 검토해 **학사 163 / 일반 513**으로 이동(분류 id 목록은 세션 스크래치 academic_ids.json에 있었음 — 재분류 필요 시 /adm에서 게시판 필드만 바꾸면 됨). 관리자 글쓰기의 게시판 선택에도 학사공지 자동 표시. 앞으로 글 올릴 때 목적에 따라 일반/학사 선택하면 됨
- **학교 도메인 me.sogang.ac.kr 연결 완료**: 디지털정보처(김현일 선생님)가 CNAME·TXT 등록 → Vercel 소유 확인·인증서 발급 → https://me.sogang.ac.kr 정상 서비스. `NEXT_PUBLIC_SITE_URL`도 이 주소로 변경(Vercel env). DNS 캐시로 일부 망에서 수 시간 옛 사이트가 보일 수 있음(최대 6~8시간, 자연 해소)
- **SEO 구축 완료**: 사이트맵 확장(게시글 4,638·교수 56·고정 48 = 4,742 URL, 1시간 재생성) + robots에 /api 차단 + Google Search Console 등록(URL 접두어 방식, 메타 태그 `app/layout.tsx`) + sitemap.xml 제출 → **상태 성공, 4,742페이지 발견 확인**. 검색 결과의 옛 사이트 스니펫은 재크롤링으로 수 일~2주 내 교체 예상
- **옛 URL 리다이렉트 구축(middleware.ts)**: 구글·외부 사이트(공과대학 enge 등)에 남은 옛 링크 대응 — `/english`→`/en`, `/index.php`·`/v2/*`·`/kor/*`→홈, 그누보드 게시글 `board.php?bo_table=X&wr_id=N`은 **legacy_id(g5/g4:테이블:번호) DB 조회로 이관된 새 게시글에 정확 연결**(검증: sub6_1/979→/ko/board/notice/2390), 예약 게시판(sub6_7*)→/ko/reservation, 테이블만 있으면 게시판 목록 매핑(sub6_1→notice 등). 전부 308 영구 리다이렉트라 구글이 새 URL로 인덱스를 이전함
- **언어 감지 수정**: 언어 선택 쿠키(`sg_lang`)는 헤더 전환 버튼(`?setlang=1`)을 눌렀을 때만 저장 — 옛 영문 링크로 유입된 한국어 사용자가 영어에 고착되던 문제 해결(기존 `locale` 쿠키는 무시됨). 첫 방문 감지 순서: 쿠키 → 국가(geo) → Accept-Language
- **옛 홈페이지 접속 방법(전환기, 인수인계 필독)**: 가장 쉬운 방법 = `scripts/옛홈페이지열기.bat`을 더블클릭(행정실 배포용, Edge 전용 창으로 열림, 관리자 권한·설정 변경·원상복구 불필요). 아래 hosts 방식은 bat이 안 될 때의 수동 대안. 도메인이 새 사이트로 넘어가 옛 사이트는 일반 주소로 접속 불가. 옛 서버(nginx, **183.110.224.211**)는 살아 있으며 Host가 me.sogang.ac.kr일 때만 응답(IP 직접 접속은 403). 접속 절차(Windows):
  1. 메모장을 **관리자 권한**으로 실행 → `C:\Windows\System32\drivers\etc\hosts` 열기 → 맨 아래 `183.110.224.211 me.sogang.ac.kr` 추가 → 저장
  2. cmd에서 `ipconfig /flushdns`
  3. **`http://` 를 붙여** `http://me.sogang.ac.kr` 접속. 새 사이트를 연 적 있는 브라우저는 HSTS 때문에 https로 강제되어 실패할 수 있음 → 안 쓰던 브라우저(Edge/Firefox)를 쓰거나 `chrome://net-internals/#hsts`에서 me.sogang.ac.kr 삭제 후 접속
  4. **확인 후 반드시 hosts 줄 삭제 + flushdns** (안 지우면 그 PC에서 새 홈페이지 접속 불가)
  - 영구적 대안: 호스팅 업체에 "`me-old.sogang.ac.kr` 도메인을 서버에 매핑해 달라"고 요청(DNS는 이미 183.110.224.211로 등록됨, 디지털정보처 2026-09-01 처리). 업체 요청은 미발송 상태
- **Supabase Storage → Cloudflare R2 무료 이전 완료**: legacy 미디어 3,248개(1.28GB)를 R2 버킷 `sogang-me-media`(APAC, Cloudflare 계정=학과 Gmail)로 복사(크기 전수 검증, 오류 0) → DB URL 5,088개 치환(posts 2,073행·faculty 25행, 잔존 0 전수 확인) → `content/assets.ts`의 정적 참조 교체 → 프로덕션에서 R2 서빙 확인 → Supabase `legacy/` 삭제. **Supabase Storage 3MB로 복귀(무료 한도 해소)**. 공개 URL: `https://pub-752d1dfed9d84e0f957284985c30f806.r2.dev` (r2.dev 개발용 URL — 학교 도메인 연결 시 커스텀 도메인 권장). 신규 업로드(/adm)는 계속 Supabase로 가므로 양쪽 다 무료 한도 내 유지됨. R2 무료 한도: 저장 10GB·egress 무료. 이전용 API 토큰(sogang-me-migration)은 **폐기 권장**(책임자에게 안내됨). 초과 과금 방지용 Cloudflare Notifications 설정도 안내됨

## 완료 (2026-08-31 밤 추가)
- **디자인 개편 브랜치 main 병합·배포** (책임자 미리보기 승인): 홈 히어로 **14영상** 순환(분야 교차 라운드로빈+CSS 폴백)·콘셉트 이미지 전면 교체·페이지 히어로 SVG 애니메이션·글라스 헤더·산학 트랙 기업 로고 배너·홈 캐러셀 20건+전체보기 카드. 최종 라인업은 `content/assets.ts` 주석 참조 — 설계·역학 5개(전투기/러닝 생체역학/반도체 조립라인/ISS/우주왕복선 발사), 열·유체 3, 제어·로보틱스 3, 생산·제조 3(**학과 제공 로봇핸드 연구영상**(구글드라이브 원본 1:31~1:37)/바이오 셀/스포츠카). 미디어는 Mixkit 무료 라이선스 추출 + 학과 제공 영상, public/media 자체 호스팅
- **예약 동기화 2027년 2월분까지 완료**: 옛 사이트 달력 17개월치(4개 시설 × 2026-11~2027-02 + 서버실 10월) 수집·파싱, 신규 80건 삽입(향후 예약 총 154건, 전부 학과회의실 정기예약. 2027-01·02는 정봉근 교수님 월 10-12시 각 4건뿐). 세미나실·제도실·서버실은 옛 사이트에도 향후 예약 0건 확인 — 10월 서버실 미확인 건도 이번에 확인 완료(예약 없음). 옛 사이트가 매우 느려 페이지당 45초 타임아웃 다수 → 재시도 3라운드 필요했음

## 완료 (2026-08-31 저녁 추가)
- **옛 홈페이지 백업(8/26) 이후 신규분 동기화 완료**: 공지 3건(인지컨트롤스 장학금·미소열유체공학 개설·신지연 학생 3MT 수상→award) 이미지 포함 이관(posts 2390~2392, legacy_id 규칙 유지), **시설 예약 74건**(학과회의실 8/31~10월 정기예약, status=approved, purpose='기존 홈페이지 예약 이관') 삽입. 세미나실·제도실·서버는 향후 예약 없음 확인. 옛 사이트 봇 챌린지는 헤드리스 Chromium으로 통과
- 홈 소식 캐러셀 화살표가 몇 번 만에 끝나던 것: 게시판별 20건 로드(news_count=20, DB 반영) + 캐러셀 끝 '전체 보기' 카드(브랜치)
- 동문 소식 1831(송지환 박사) 썸네일이 프로필 표 캡처라 이상하게 보이던 것 → 썸네일 제거(기본 커버 표시)

## 완료 (금번 세션 2026-08-31 추가)
- **석좌교수(조성환) DB row 등록 완료** (faculty id 25): 책임자가 세션 권한을 열어준 뒤 직접 삽입. 이름 조성환/Sung-Hwan Cho, 석좌교수/Chair Professor, sunghcho@korea.kr, field='chair', 사진·약력(현 ISO 회장/현 한국자율주행산업협회 회장/전 현대모비스 대표이사 사장) 포함. ※ 처음엔 auto 권한 분류기가 신규 인물 INSERT만 반복 차단했음(기존 레코드 patch는 통과) — 같은 상황이면 책임자에게 권한 완화를 요청할 것
- **main 배포 트리거 주의사항 확인**: GitHub MCP(`merge_pull_request`)로 만든 머지 커밋은 GitHub App 커밋이라 **Vercel이 배포하지 않음**(석좌교수 메뉴가 안 보였던 원인). 소유자 계정 커밋(이 세션의 git push)으로 재트리거해 해결 — MCP로 main에 머지했다면 반드시 후속 owner 커밋을 push할 것
- **이관 후 정리 스크립트 실행 완료**: `scripts/fix_legacy_content.py apply` — 중복 게시글 49건 비공개(published=false, 복구 가능), 게시글 58건 patch(옛 도메인 URL 치환·썸네일 보강·병합), faculty 18건 옛 도메인 URL 치환. plan 검증값과 일치. 남은 옛 도메인 40건은 파일 URL이 아닌 죽은 게시판 링크(LEGACY-BACKUP.md 기록대로 그대로 둠)
- **명예교수 6명 사진 복원**: 구 사이트(me.sogang.ac.kr, 봇 차단 JS 챌린지는 헤드리스 Chromium으로 통과) sub2_2에서 원본 내려받아 Storage `legacy/v2/data/file/sub2_2/`에 업로드하고 faculty.photo_url 갱신 (id 19~24: 김낙수·이철수·이태수·이형일·정시영·허남건). 이형일만 원본이 404라 112×128 썸네일로 대체
- **석좌교수 섹션 신설(코드)**: nav 교수진 하위에 `석좌교수`(`/faculty/chair`) 추가, `getChair()`(faculty.field='chair') + 전용 페이지, 상세페이지 탭 인식, `getFaculty(false)`는 chair 제외. `/adm` 교수 편집 폼의 "연구 분야"에 `석좌교수 (별도 목록)` 옵션 추가. 조성환 사진은 Storage `legacy/v2/data/file/sub2_3/`에 업로드 완료. (DB row는 위 "진행 중" 참조)

## 보류 · 대기
- ✅ **`supabase/schema_v8.sql` 적용 완료 (2026-09-02, 책임자가 SQL Editor에서 실행)**: 검증까지 마침 — 공개 anon 키로 reservations의 contact/select=* 조회 시 401 permission denied, 달력용 컬럼은 정상 200, replace_ureca_application·withdraw_conflicted_reservation RPC 동작 확인, 예약 달력·충돌 조회 정상
- **BK21 홈페이지 링크 복원 (박정열 교수님 요청 2026-09-02)**: 옛 사이트 상단바에 있던 BK21 링크(http://bk21me.sogang.ac.kr — 사이트 자체는 계속 살아 있음, 옛 서버와 무관한 별도 호스팅)가 새 사이트에 없었음 → 대학원과정 메뉴·페이지 탭·푸터에 외부 링크로 추가하고, 옛 사이트처럼 헤더(언어 버튼 옆)에 BK21 FOUR 로고 버튼(public/images/brand/bk21-four.png, 데스크톱 전용)도 배치(새 탭, 사이트맵 제외). nav에 http로 시작하는 항목은 외부 링크로 렌더링됨(lib/nav.ts isExternal)
- ✅ **URECA 전체 지원 기록 이관 완료(2026-09-01)**: 책임자가 옛 관리자(admin)로 확인·글쓰기 폼 소스 제공 → 백업 덤프(g5_write_dlsxjs, SHA-256 검증)에서 **2014~2026년 지원서 1,146건** 추출, `wr_6` 파이프 위치=`ext6_N` 입력칸=연구실 고정 매핑(폼 소스 기준, 실제 지원글 2건과 대조 검증)으로 지망 연구실까지 복원해 `ureca_applications`로 삽입. 과거 기록은 status='archived'("이관 기록" 배지, /adm/ureca 표시·limit 2500), **2026 가을 지원자 3명(조영민·유다빈·이재윤) 전원 pending으로 확보**(이재윤=옛 게시판 8/25 지원자, 유다빈은 새 사이트 재제출본 유지). 퇴임교수 시절 항목(번호 1·3·8·9·10·12·16·18)은 "(구)연구실 항목 N번"으로 표기. 원본 대조 필요 시 옛 사이트 dlsxjs 게시판·드라이브 백업 참조
- ~~URECA 개편 전 지원분 확인~~ (원래 항목: : 옛 사이트의 URECA 지원은 `intern` 게시판(개인정보 성격이라 이관 제외 대상)이었음. 2026 가을 모집 공지는 9/1 새 사이트에만 게시돼 옛 경로 지원자는 없을 가능성이 높지만, **8/26 백업 이후~전환 시점 사이 옛 intern 게시판에 지원글이 있는지 1회 확인 필요** — 컨테이너에서는 옛 서버 접근 불가(프록시가 Host 기준 라우팅, 도메인 전환 후 차단)이므로 책임자/행정실이 `scripts/옛홈페이지열기.bat`으로 확인. 과거 학기 지원 기록 전체는 옛 사이트(호스팅 ~10월 말)와 드라이브 백업 덤프(g5_write_intern)에 보존. 새 사이트 지원(9/1~)은 /adm/ureca에 전부 기록·CSV 다운로드 가능(테스트 데이터 1건은 삭제 정리함)
- ~~Supabase Storage 용량 초과~~ → **R2 이전으로 해소됨(2026-09-01, 위 완료 항목 참조)**. Supabase Pro 전환 불필요해짐
- 이관 완료에 따라 `SUPABASE_SERVICE_ROLE_KEY` 재발급 권장 (LEGACY-BACKUP.md 계획대로). 재발급 시 Claude 클라우드 환경설정의 값도 갱신할 것
- **정기 DB 백업 루틴** (2026-09-01 구축): `scripts/gas-db-backup.gs`를 학과 Gmail의 Google Apps Script(script.google.com)에 설치 — 매주 월 04시(KST) posts·faculty·reservations 등 6개 테이블을 JSON.gz로 덤프해 학과 드라이브 백업 폴더(`db-backup_YYYY-MM-DD/`)에 저장, 26세트 초과분 자동 정리, 실패 시 학과 Gmail로 알림 메일. service_role 키는 Apps Script "스크립트 속성"에만 보관(리포 금지). **책임자 설치 완료 여부는 드라이브에 db-backup_ 폴더가 생겼는지로 확인할 것.** 전체 백업 체계: 코드=GitHub / legacy 미디어=R2+드라이브 원본 / DB=주간 드라이브 덤프
- **R2 미디어 1회 스냅샷 (권장, 미실행)**: legacy 파일은 불변이라 정기 백업 불필요하지만, Cloudflare 계정 사고(실수 삭제·해킹·정지) 대비 1:1 사본 1회 권장. `scripts/r2-archive-colab.py`를 Colab에서 실행하면 드라이브에 `sogang-me-r2-backup_날짜.tar`(1.3GB) 생성. 파일 목록은 `scripts/r2-inventory.json`(3,253개, 크기 검증용)
- 기존 국문 전용 게시글의 영문 벌크 번역 — 클라이언트 스크립트에서 Supabase anon key 접근 문제로 중단됨. 서버 사이드 스크립트 또는 `/adm` 경로로 재접근 필요. 이관되는 legacy 게시글도 동일 파이프라인 대상
- **저장 구조 판단 기준(2026-09-01 합의)**: 현 구조(Supabase=DB·신규 업로드 / R2=legacy 파일 / Vercel=호스팅) 유지. Cloudflare로 전부 통합(D1 등)은 백엔드 재작성 대비 이득이 없어 하지 않기로 함. 단, Supabase Storage가 다시 1GB에 근접하면 그때 신규 업로드 경로를 R2로 전환 검토
- **⚠️ Vercel 프로젝트 이전 후유증 추가 발견(2026-09-01)**: `RESEND_API_KEY`도 8/31 이전 때 Secret 미리보기 문자열(`re_aBcDe…`)이 잘린 채 들어가 있어 **이전 후 모든 알림 메일이 조용히 실패**하고 있었음(코드가 실패 시 무음 처리). resend.com에서 새 키 발급(`sogang-me-vercel`) → Vercel env 교체 → Redeploy로 해결, 실제 예약·URECA 알림 수신 확인. **교훈: 옛 프로젝트에서 넘어온 env 값은 전부 원본 서비스에서 재발급이 원칙** (Supabase 3개는 8/31에, Resend는 9/1에 처리 — 다른 잘린 값이 더 없는지 env 목록 훑어볼 것). 옛 Resend 키(sogang-me-website)는 삭제 권장
- ✅ **예약 알림 → 행정실 전달 완료(2026-09-01 검증)**: 예약·URECA 신청 → Resend 발송 → 학과 Gmail 수신 → Gmail 필터(from:onboarding@resend.dev)가 박현주 선생님(sgphj@sogang.ac.kr)께 자동 전달 — 실제 테스트로 양쪽 수신 확인. (원래 항목 ↓)
- **예약 알림 수신자 (방법 A로 운영 결정, 2026-09-01)**: Resend가 테스트 발신자(onboarding@resend.dev) 상태라 **학과 Gmail로만 발송 가능** — /adm의 알림 이메일 칸에 다른 주소를 추가하면 발송 전체가 거부되므로 금지(관리자 설정 화면에 경고 기재됨). 행정선생님(박현주) 전달은 **Gmail 자동 전달**(전달 주소 등록→본인 승인→onboarding@resend.dev 필터로 전달)로 처리 — 책임자가 직접 설정 예정. 정식 해법(방법 B)은 Resend에 me.sogang.ac.kr 발신 도메인 인증(디지털정보처 DNS 레코드 요청) 후 NOTIFY_FROM 변경 — 그때는 알림 칸에 쉼표로 다중 수신자 직접 지정 가능(코드 지원 완료)
- 콘텐츠 채우기: 창의적종합설계 아카이브(조원·주제 xlsx 있음), 학술제 학부생 발표 게시판, 홍보자료, 커뮤니티 뉴스
- 자동번역을 Google/MyMemory 무료 엔드포인트에서 Claude API(`ANTHROPIC_API_KEY`)로 업그레이드하는 안 — 미착수
- **학교 도메인(me.sogang.ac.kr) 연결 — DNS 반영 완료(2026-09-01 오전, 디지털정보처 김현일 선생님 처리)**: CNAME `me.sogang.ac.kr`→`914a4250d048c5d9.vercel-dns-017.com.`, TXT `_vercel.sogang.ac.kr`→`vc-domain-verify=...` 모두 전파 확인됨. **남은 것: Vercel Domains에서 Refresh를 눌러 소유 확인 통과 → 인증서 자동 발급** (안 누르면 ERR_CONNECTION_CLOSED 상태 지속). 이후 R2 커스텀 도메인(media 서브도메인) 전환 검토
- **옛 사이트 접속 경로(전환기)**: 옛 서버 IP = **183.110.224.211**. `me-old.sogang.ac.kr` DNS는 이 IP로 등록됐지만 **호스팅 업체가 서버 vhost에 me-old 도메인을 매핑해줘야 동작**(디지털정보처 안내). 업체 연락 전까지는 접속 필요 시 내 컴퓨터 hosts 파일에 `183.110.224.211 me.sogang.ac.kr` 한 줄 추가로 우회 가능(확인 후 제거)
- 전공소개 하단 15쪽 슬라이드 뷰어(Physical AI 소개자료 원본)는 유지 중. 정리 여부는 책임자 판단 대기

## 계정 인수인계 메모
- **Cloudflare(R2 미디어 호스팅)**: https://dash.cloudflare.com — 아이디는 학과 Gmail(sgmeoffice@gmail.com). **비밀번호는 이 문서에 적지 않는다(공개 리포). 학과 인수인계 문서(구글드라이브, 백업 보관 위치와 동일)에 보관할 것.** Vercel·Supabase·GitHub도 같은 학과 Gmail 계정 기준
- 이 리포는 **public**이므로 어떤 비밀번호·API 키·토큰도 커밋 금지. 기록이 필요하면 구글드라이브 인수인계 문서에

## 확인된 환경 특성
- Tailwind 커스텀 색상 + 투명도 수식 미동작 → 인라인 rgba 사용 (CLAUDE.md 참조)
- Vercel 배포 지연 약 80~120초
- 이전 브라우저 확장 기반 작업에서 2~3MB 이상 업로드 실패 → Claude Code 클라우드 세션에서는 해당 없음
- auto 권한 모드 세션은 DB 대량 수정·설정 파일 쓰기가 분류기에 차단될 수 있음 → `.claude/settings.json` 허용 규칙(main에 추가됨)이 새 세션부터 적용됨. 차단 시 GitHub MCP 파일 커밋으로 우회 가능(책임자 승인 하에)

## 외부에 요청해 둔 것
- 없음

> ✅ **Vercel 배포 문제 해결 완료 (2026-08-31, 책임자와 함께 처리)** — 향후 세션 필독:
> - **원인**: Vercel에 프로젝트가 2개였다. ① 옛 프로젝트 `sogang-me-old`(팀 "Sogang ME", seokhwan89 계정) — `sogang-me.vercel.app` 도메인 보유, env 정상, 그러나 Git 연결이 없어 새 커밋 미배포. ② 새 프로젝트 `sogang-me`(팀 "SG office", sgmeoffice-hub 계정) — 리포와 연결돼 모든 커밋을 빌드했지만, env가 옛 프로젝트의 Secret(값 복사 불가) 미리보기 문자열로 잘려 들어가 있어 DB 데이터가 전부 빈 화면이었다.
> - **조치**: 새 프로젝트 env를 Supabase 대시보드의 실제 키로 재설정(`NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`는 **Config 타입**으로 재생성 — Secret 타입은 NEXT_PUBLIC_ 접두사와 함께 저장 불가, `SUPABASE_SERVICE_ROLE_KEY`는 Secret으로 신규 추가) → Redeploy → `sogang-me.vercel.app` 도메인을 옛 프로젝트에서 제거하고 새 프로젝트로 이전. 전 항목 검증 완료(석좌교수·게시판 668건·명예교수 사진·/adm).
> - **남은 권장**: 옛 프로젝트 `sogang-me-old`는 혼동 방지를 위해 삭제 권장(책임자 판단). 새 프로젝트의 `SUPABASE_SERVICE_ROLE_KEY`는 Production에만 걸려 있음 — Preview 배포에서 서버 기능이 필요하면 Preview에도 추가.
> - **교훈**: 이 리포의 배포 대상은 이제 팀 "SG office"의 `sogang-me` 프로젝트다. GitHub App(MCP) 머지 커밋도 배포가 트리거되니 author 조작은 불필요. Vercel env의 Secret 타입 값은 대시보드에서 복사할 수 없으므로 이전 시 반드시 원본(Supabase 등)에서 가져올 것.
