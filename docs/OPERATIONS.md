# 운영·인수인계 가이드 (OPERATIONS)

> 새 담당자 또는 새 Claude 세션이 이 시스템 전체를 파악하기 위한 문서. **담당자 교체 시에는 `docs/ADMIN-HANDOVER.md`(인수인계 요약, 2026-09-26)를 먼저 볼 것.**
> 최근 작업 내역과 미결 사항은 `docs/HANDOFF.md`, 작업 규칙은 루트 `CLAUDE.md` 참조.
> **비밀번호·API 키는 이 리포(공개)에 절대 기록하지 않는다** — 학과 구글드라이브의 "계정정보" 문서 참조.

## 1. 시스템 구성 한눈에 보기

```
방문자 → https://me.sogang.ac.kr (공식 도메인, 학교 DNS)
           │
           ▼
        Vercel  ──  홈페이지 실행 (Next.js 15, 이 리포지토리의 main 브랜치 자동 배포)
           │
           ├─ Supabase  ──  데이터베이스(게시글·교수진·예약·설정) + 관리자 로그인 + 신규 업로드 파일
           └─ Cloudflare R2  ──  옛 홈페이지에서 이관한 첨부·이미지 1.28GB(sogang-me-media) + 매일 백업(sogang-me-backup, 비공개)
```

| 서비스 | 역할 | 주소 | 무료 한도 |
|---|---|---|---|
| **GitHub** | 코드·문서 원본 (`sgmeoffice-hub/sogang-me`, **공개 리포**) | github.com/sgmeoffice-hub/sogang-me | 무제한 |
| **Vercel** | 호스팅·배포 (팀 "SG office", 프로젝트 `sogang-me`) | vercel.com | **목표 Hobby(무료)**, 현재 Pro(월 20달러) 유지 중. Hobby 월 한도: CDN 요청 100만 · 함수 호출 100만 · Active CPU 4시간 · Fast Origin 10GB · Fast Data 100GB · ISR 쓰기 20만/읽기 100만 · 메모리 360GB-h. 넘으면 청구 없이 **사이트 일시정지**(2026-09-16 실제 중단). **하향 여부는 `docs/HANDOFF.md` 최신 판정 항목을 따르고**, 하향 전 Vercel Usage·Firewall 수치를 반드시 확인(Pro→Hobby는 즉시 적용, 갱신일 매월 15일 16:00 KST) |
| **Supabase** | DB·인증·신규 파일·휴지통/수정 이력(vault) (프로젝트 pvdobbplxndsigatnamu) | supabase.com/dashboard | Free: 전송량 월 5GB·DB 500MB·Storage 1GB — 전송량 매달 확인 |
| **Cloudflare R2** | legacy 미디어 `sogang-me-media`(공개) + 백업 `sogang-me-backup`(비공개) | dash.cloudflare.com | 저장 10GB (현재 약 2.6GB)·전송 무료 |
| **Google Drive** | 백업 보관 (원본 백업 1.9GB, 계정정보 문서, DB 주간 덤프 — 설치 여부 미확인) | drive.google.com | 15GB (Gmail과 공유) |
| **Google Search Console** | 검색 노출 관리 (sitemap.xml 제출됨) | search.google.com/search-console | 무료 |
| **Google Apps Script** | 주간 DB 사본 (`scripts/gas-db-backup.gs`, R2 매일 백업의 보조 — **설치 여부 미확인**, 드라이브에 `db-backup_` 폴더가 있는지로 판단) | script.google.com | 무료 |

- **모든 서비스의 로그인 계정 = 학과 Gmail (sgmeoffice@gmail.com)** 이 계정이 마스터 열쇠다.
- 주소 체계: `/ko/...` 한국어, `/en/...` 영어. 언어 없는 접속은 (전환 버튼으로 저장한 쿠키 → 브라우저 언어에 한국어 있으면 ko → 브라우저 언어를 안 보내는 검색 로봇은 ko → 한국 IP는 ko → 그 외 en) 순으로 자동 판별(`middleware.ts`).
- 옛 홈페이지 주소(그누보드 URL)는 전부 새 사이트로 자동 리다이렉트된다 (`middleware.ts`).

## 2. 일상 운영

- **게시글·교수진·예약·홈 설정 관리**: 사이트의 `/adm` 관리자 화면에서 (코드 수정 불필요)
- **정적 콘텐츠(학과소개·전공소개 등) 수정**: Claude 세션에 요청 → `content/` 폴더 .ts 파일 수정 → main 배포
- **배포 흐름**: main 브랜치에 push되면 Vercel이 자동 빌드·배포 (반영까지 약 1~2분). 별도 배포 버튼 없음
- **예약·URECA 알림 메일**: 학과 Gmail로 수신하고, 행정실 전달은 **Gmail 자동 전달 필터**로 처리(방법 A, 2026-09-01 운영 결정). Resend가 테스트 발신자(onboarding@resend.dev) 상태라 **`/adm` 설정의 알림 이메일 칸에는 학과 Gmail만** 둔다 — 다른 주소를 추가하면 발송 전체가 조용히 거부된다. 다른 주소로 직접 보내려면 Resend에 me.sogang.ac.kr 발신 도메인 인증(디지털정보처 DNS) 후 `NOTIFY_FROM` 설정(방법 B, HANDOFF 참조).
- **옛 홈페이지 열람**: `scripts/옛홈페이지열기.bat` 더블클릭 (행정실 배포용, HANDOFF에 상세)

## 3. Claude(AI)로 작업하는 법 — 새 담당자용

1. **claude.ai/code** 에 학과 Gmail로 로그인 → GitHub 연동에서 `sgmeoffice-hub/sogang-me` 리포 연결
2. 새 세션을 열고 한국어로 작업을 요청하면 된다 (예: "학과소개 페이지 문구 고쳐줘")
3. Claude는 세션 시작 시 루트 `CLAUDE.md`(작업 규칙)를 자동으로 읽고, 규칙에 따라 `docs/HANDOFF.md`(진행 상황)를 이어받는다 — **따로 설명할 필요 없음**
4. 새 세션에게 전체 구조를 알려주려면 "docs/OPERATIONS.md 읽어" 한마디면 된다
5. DB 작업이 필요한 세션은 환경변수가 필요하다: Claude Code 환경설정(Environment)에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`가 등록되어 있음 (값은 Supabase 대시보드 Settings → API). Vercel 사용량·방화벽을 Claude가 직접 보려면 `VERCEL_TOKEN`(Vercel 토큰 'claude-code', SG office 팀 범위·만료 없음, Claude 계정과 함께 인수인계)도 같은 곳에 — **Vercel 환경변수에는 넣지 않는다**(Claude Code 환경에만). 새 세션부터 적용, `npx vercel usage --breakdown daily`, `npx vercel firewall traffic list` 등. 사이트(Vercel)가 읽는 변수 전체 목록은 `.env.example`.
6. Claude가 작업을 마치면 HANDOFF.md를 갱신해 커밋하는 것이 규칙이다 — 세션이 바뀌어도 맥락이 이어진다
7. push 전 검사: `npm run build`는 타입 오류를 통과시키므로(`next.config.mjs` ignoreBuildErrors) **`npx tsc --noEmit`도 같이** 돌린다. 배포는 소유자 계정 커밋만 트리거되며, `docs/`·`*.md`·`scripts/`·`supabase/`만 바뀐 커밋은 배포하지 않는다(`vercel.json` ignoreCommand; 이런 푸시는 Vercel 배포 목록에 **"Canceled"로 표시되는 것이 정상**이지 실패가 아니다 — 직전 배포 이후의 변경 전체를 비교하므로 코드 커밋 뒤에 문서 커밋을 얹어 푸시해도 코드는 배포된다) — Hobby에서는 배포 1회가 CPU 약 10분·Origin 200MB·ISR 쓰기 1.7만을 쓰므로 코드 변경은 몰아서 배포한다.

## 4. 백업 체계

| 대상 | 방법 | 위치 |
|---|---|---|
| 코드·문서 | git push 시 자동 | GitHub |
| DB 전체(8개 표) | **매일 04시대 자동**(`/api/cron/backup`, 30일+12개월) | R2 `sogang-me-backup` db/ |
| DB 주간 사본 | `scripts/gas-db-backup.gs` (Apps Script, 월 04시, **설치 여부 미확인**; 학생 개인정보가 있는 ureca_applications는 일부러 제외) | 구글드라이브 `db-backup_날짜/` |
| 업로드 파일·legacy 미디어 사본 | 매일 자동(새 파일만·이어서 복사) | R2 `sogang-me-backup` files/ |
| 삭제 글·수정 전 내용 | 휴지통 30일·수정 이력 90일 | Supabase `vault` |

- 확인: 관리자 › 백업·휴지통 "마지막 백업 … 성공". 상세는 `docs/HANDOFF.md` 백업 항목.
- **Vercel Cron 제약(Hobby)**: cron은 **최대 2개**(지금 번역 보완 03시대·백업 04시대로 둘 다 사용), 하루 1회까지, 예정 시각부터 **1시간 안에** 실행(정확한 분 보장 없음). 정기 작업을 더 만들 때는 `vercel.json`에 세 번째 항목을 넣지 말고 기존 `/api/cron` 라우트에 합친다. 두 라우트 모두 `CRON_SECRET` 환경변수가 없으면 503으로 멈춘다.
- **새 Supabase 프로젝트 재구축**(프로젝트 삭제·정지 등, Free는 PITR 없음): ① 새 프로젝트 생성 → README '스키마 적용 순서'대로 `schema.sql`→v3→v4→v6→v7→v8→v9→v10 실행(끝에 `verify_v10.sql`로 전 행 ok 확인 — schema.sql이 media 공개 목록 정책을 다시 만들므로 v10까지 반드시 실행) — **시드(`seed_*.sql`)는 건너뛴다**: 백업 upsert는 시드 행을 지우지 않아 예시 글·예약·교수가 공개 사이트에 남는다(스키마 파일만 실행) ② Vercel 환경변수(`NEXT_PUBLIC_SUPABASE_URL`·`ANON_KEY`·`SERVICE_ROLE_KEY`) 교체 ③ 관리자 › 백업에서 받은 `db/daily/YYYY-MM-DD.json.gz`로 `node scripts/restore-backup.mjs <파일> --all --apply` + `--table admins --apply`(admins는 기본 제외) — 끝에 `reset_sequences()`가 자동 호출된다(v9 미적용이면 경고가 뜨니 SQL Editor에서 `select reset_sequences();`) ④ Authentication › Users에 관리자 이메일로 사용자 추가(Auto confirm), 자가 가입 끄기 ⑤ R2 `files/media/…`를 Storage `media` 버킷에 다시 올림(스크립트가 하지 않음; `vault`는 자동 생성, 휴지통·수정 이력은 복원 안 됨) ⑥ 재배포 후 `POST /api/admin/revalidate`.

## 5. 장애 대응 빠른 안내

| 증상 | 확인할 곳 |
|---|---|
| 사이트 전체가 안 열림 | Vercel 대시보드 (배포 실패 여부) → vercel-status.com |
| 게시판·교수진이 빈 화면 | Supabase 대시보드 (프로젝트 상태, env 키 유효성) |
| 옛 게시글의 이미지·첨부만 깨짐 | Cloudflare R2 (버킷·공개 URL 상태) |
| 새로 올린 파일만 깨짐 | Supabase Storage |
| me.sogang.ac.kr 도메인 문제 | 디지털정보처에 문의 (DNS: CNAME → Vercel) |
| 원인 불명 | Claude 세션을 열고 증상을 그대로 설명하면 진단부터 해준다 |

- **방화벽 규칙(2026-10-12~)**: 옛 홈페이지 게시판·첨부 주소(`/bbs/…`, `/v2/bbs/…`)를 도는 로봇이 하루 수만 건씩 들어와 `vercel.json`의 `routes`에 챌린지 규칙을 둠(사람 브라우저는 자동 통과 후 새 주소로 이동, 막힌 요청은 Vercel 사용량에 안 잡힘). 트래픽 확인: Vercel › 프로젝트 › Firewall(Past Day, Top Request Paths·User Agents).

## 6. 정기 점검 (분기 1회 권장)

- [ ] 관리자 › 백업·휴지통 마지막 백업 성공 확인 (+ 드라이브 `db-backup_` 폴더가 있으면 최신 날짜 확인)
- [ ] Vercel Usage·Billing — Hobby 한도 대비 하루 안전선: CDN 요청·함수 호출 ≈3만, Active CPU ≈8분, Fast Origin ≈300MB, ISR 쓰기 ≈6천 (한도의 1/30; HANDOFF는 여유를 둬 2.7만·6분·270MB를 씀). 배포 1회 = CPU ≈10분·Origin ≈200MB·ISR 쓰기 ≈1.7만이 추가되므로 **그달 배포 횟수도 센다**(평시 ISR 쓰기 2.8천/일 기준 월 5~6회 이상이면 ISR 쓰기 한도 위험). Supabase Egress(월 5GB)도 함께
- [ ] Supabase Storage 사용량 1GB 미만 확인 (대시보드)
- [ ] R2 사용량 10GB 미만 확인 (거의 고정 1.28GB)
- [ ] Search Console에서 크롤링 오류 확인
- [ ] 계정정보 문서(드라이브) 최신 상태 확인
