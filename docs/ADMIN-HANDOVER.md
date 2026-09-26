# 홈페이지 관리자 인수인계 요약 (공개용)

> 담당자(관리자)가 바뀔 때 보는 요약. **비밀번호·키 값은 이 공개 저장소에 적지 않는다** — 계정·비밀번호는 인수인계서 Word 파일(학과 구글드라이브 비공개 보관)에 기입한다.
> 작업 규칙은 루트 `CLAUDE.md`, 작업 이력은 `docs/HANDOFF.md`, 운영 개요는 `docs/OPERATIONS.md`. 작성 2026-09-26.

## 1. 핵심
- **학과 Google 계정(sgmeoffice@gmail.com) = 모든 서비스의 열쇠.** Claude·GitHub·Vercel·Supabase·Cloudflare·Google 드라이브가 모두 이 계정 기준. 비밀번호·2단계 인증·결제 카드를 넘기면 인수인계 대부분이 끝난다.
- 일상 관리(게시글·교수진·예약·URECA·배너)는 `https://me.sogang.ac.kr/adm`. 고정 페이지 문구·디자인·기능은 Claude Code에 한국어로 요청.
- **휴대폰 인증**: 새 기기에서 학과 Google 계정으로 로그인하면 휴대폰 인증을 요구한다. 인증 번호를 바꿔도 보안상 약 1주일은 기존 번호로 인증을 요청할 수 있으므로, 인수인계 1~2주 전에 번호를 바꾸고 그동안 이전 담당자와 연락을 유지한다. Google 계정 › 보안에서 1회용 백업 코드를 발급해 두면 휴대폰 없이도 로그인할 수 있다.

## 2. 사용량 한도·요금·중단 위험
| 서비스 | 요금제 | 한도 | 넘으면 |
|---|---|---|---|
| Vercel(서버) | Pro 월 20달러 | 포함 사용량 + 추가 사용 한도 20달러 | 추가분 청구 → 20달러 도달 시 **프로젝트 일시정지 = 사이트 중단**(2026-09 무료 한도 초과로 실제 중단 후 Pro 전환). 요금제 하향(Downgrade)은 즉시 적용되니 금지 |
| Supabase(DB·로그인) | Free | 전송량 월 5GB·DB 0.5GB·파일 1GB | "사용 제한" 가능 → 게시판 빈 화면·관리자 로그인 불가. 2026-09 전송량 67% → 9/25 캐시 개선. 매달 확인, 필요 시 Pro(월 25달러) |
| Cloudflare R2(파일·백업) | 무료 한도 | 저장 10GB(현재 약 2.6GB) | 멈추지 않고 등록 카드로 소액 청구 |
| Claude | 구독 | 요금제별 사용량 | 사이트 영향 없음, 작업만 대기 |
| Google | 무료 | 15GB(Gmail·드라이브 공유) | 메일 수신·주간 드라이브 백업 실패 |

결제 카드 만료·해지 시 서비스가 멈출 수 있다. 한도 경고 메일은 모두 학과 Gmail로 온다.

## 3. 계정·키 (값 없이 목록만)
- 계정: 학과 Gmail · Claude(claude.ai/code) · GitHub `sgmeoffice-hub` · Vercel 팀 "SG office"/프로젝트 `sogang-me` · Supabase 프로젝트 "Sogang ME" · Cloudflare(R2 `sogang-me-media` 공개, `sogang-me-backup` 비공개) · 관리자 화면 `/adm`(학과 공용 계정, Supabase Auth) · Google 드라이브·Apps Script·Search Console · (선택) Resend · 학교 도메인 담당(디지털정보처) · 옛 홈페이지 호스팅(10월 말 종료 예정)
- Vercel 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BACKUP_BUCKET`, (선택) `RESEND_API_KEY`·`NOTIFY_EMAIL`·`ADMIN_PATH`·`ANTHROPIC_API_KEY`(미사용)
- Claude Code 환경(Environment): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` / Apps Script 스크립트 속성: service_role 키
- 키를 교체할 때는 위 보관 위치를 **모두** 새 값으로 바꾸고 Vercel 재배포(환경변수 변경만으로는 재배포되지 않음).

## 4. 구조
방문자 → me.sogang.ac.kr(학교 DNS) → **Vercel**(Next.js 14, GitHub main 푸시 시 1~2분 자동 배포) → **Supabase**(DB·로그인·새 업로드) / **R2**(옛 파일 3,253개·홈 영상) · 코드 원본 **GitHub**(공개).
- 고칠 곳: DB 데이터 → `/adm` · 고정 문구 → `content/*.ts` · 공통 문구 → `lib/i18n.ts` · 화면 → `app/`, `components/`
- 자동 작업(vercel.json, KST): 03:00 영문 번역 보완, 04:00 백업

## 5. 한·영 번역
1. 국문으로 저장 → 2. 무료 번역기로 제목·요약·본문 자동 번역(서식 유지) → 3. 번역 전 흔한 오역 표현 치환(두 자리 연도, 입시 전기/후기, 회사·건물명 — `lib/glossary.ts preKo`), 번역 후 교수 이름 공식 표기(`lib/names`) → 4. 막히면 빈칸으로 두고 매일 03시·관리자 접속 때 최근 60일 자동 보완 → 5. 영문이 없으면 국문+“번역 준비 중” 표시.
- **오역·누락이 여전히 있을 수 있다**(학생·외부 인사 이름, 고유 명칭, 표 안 짧은 말, 날짜 표현). 첨부파일·이미지 속 글자는 번역되지 않는다. 기존 글 2,253건은 2026-09-25 Claude가 일괄 번역·검수(오류율 약 1%).
- 고치기: `/adm` 글 수정의 영문 칸 직접 수정(이후 자동 번역이 덮어쓰지 않음) 또는 Claude에게 요청. 품질을 올리려면 `ANTHROPIC_API_KEY`(유료) 추가.
- 고정 페이지 영문은 사람/Claude가 작성. 영문 화면의 작성자·조원·예약자 이름·자동 표지는 표시할 때 자동 변환.

## 6. 백업
| 대상 | 위치 | 주기·보관 |
|---|---|---|
| 코드·문서 | GitHub | 영구(이력) |
| DB 전체(8개 표, 압축 약 2MB) | R2 `sogang-me-backup` db/daily, db/monthly | 매일 04시, 30일 + 12개월 |
| DB 주간 사본 | 구글드라이브 `db-backup_날짜`(Apps Script) | 매주 월(설치 여부 확인) |
| 업로드 파일 / 옛 파일 사본 | R2 files/media, files/r2 | 매일(옛 파일은 이어서 복사, 3,253개) |
| 삭제 글 / 수정 전 내용 | Supabase 비공개 `vault` | 30일 / 글마다 20개·90일 |

확인은 `/adm` › 백업·휴지통(이틀 넘게 실패 시 대시보드 경고). 복원: 글 한 건은 휴지통·수정 이력 버튼, 전체는 Claude에게 요청(`scripts/restore-backup.mjs`, 미리보기 기본).

## 7. Claude Code
- 준비: claude.ai에 학과 계정 로그인 → 설정 › Connectors에서 GitHub(sgmeoffice-hub) 연결 확인 → claude.ai/code 환경에 `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY` 확인.
- 기존 대화방: https://claude.ai/code/session_01RwLGr3kDN1JP1xGffg2Feo (같은 Claude 계정으로 로그인해야 열림). 긴 대화는 앞부분이 요약되므로 맥락은 저장소 문서로 잇는다 — **새 작업은 새 세션**(저장소 sogang-me 선택)으로 시작해도 된다.
- 첫 요청 예: "docs/ADMIN-HANDOVER.md 읽고 사이트·백업 상태 점검해줘". 큰 변경은 "미리보기로 먼저", 확인 후 "main에 반영해".
- 외부 대시보드(Cloudflare·Vercel 설정)는 Claude가 직접 조작하지 못한다 — 안내대로 직접 하거나 브라우저의 Claude in Chrome 확장 사용.

## 8. 정기 점검(매월)
백업 성공 · Vercel Usage/Billing · Supabase Egress(5GB 중) · Claude 구독 · (연 1회) 학과장·연혁·학사일정·교수진 반영, Search Console.

## 9. 알려진 한계·주의
- 목록 조회수는 최대 10분 늦게 반영. DB를 관리자 화면 밖에서 일괄 수정하면 캐시 새로 고침 필요(`POST /api/admin/revalidate`, Claude가 처리).
- 관리자 화면은 학과 공용 계정 하나를 행정실과 공유. 개인 계정이 필요하면 Claude에게 추가 요청.
- 옛 글 일부에 과거 연락처가 원문대로 남아 있음(2026-09 결정: 유지). 새 글에 학생 개인정보 금지.
- 영상·대용량 파일은 YouTube 링크로(용량·전송량 한도). 옛 홈페이지 호스팅 10월 말 종료 예정.
- 행정실용 간단 안내(관리자 화면·Claude 사용법 2쪽)는 인수인계서 Word 파일의 **부록**에 있다 — 그 부분만 인쇄해 행정실에 전달.
