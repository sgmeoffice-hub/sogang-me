# 운영·인수인계 가이드 (OPERATIONS)

> 새 담당자 또는 새 Claude 세션이 이 시스템 전체를 파악하기 위한 문서. **담당자 교체 시에는 `docs/ADMIN-HANDOVER.md`(인수인계 요약, 2026-09-26)를 먼저 볼 것.**
> 최근 작업 내역과 미결 사항은 `docs/HANDOFF.md`, 작업 규칙은 루트 `CLAUDE.md` 참조.
> **비밀번호·API 키는 이 리포(공개)에 절대 기록하지 않는다** — 학과 구글드라이브의 "계정정보" 문서 참조.

## 1. 시스템 구성 한눈에 보기

```
방문자 → https://me.sogang.ac.kr (공식 도메인, 학교 DNS)
           │
           ▼
        Vercel  ──  홈페이지 실행 (Next.js 14, 이 리포지토리의 main 브랜치 자동 배포)
           │
           ├─ Supabase  ──  데이터베이스(게시글·교수진·예약·설정) + 관리자 로그인 + 신규 업로드 파일
           └─ Cloudflare R2  ──  옛 홈페이지에서 이관한 첨부·이미지 1.28GB(sogang-me-media) + 매일 백업(sogang-me-backup, 비공개)
```

| 서비스 | 역할 | 주소 | 무료 한도 |
|---|---|---|---|
| **GitHub** | 코드·문서 원본 (`sgmeoffice-hub/sogang-me`, **공개 리포**) | github.com/sgmeoffice-hub/sogang-me | 무제한 |
| **Vercel** | 호스팅·배포 (팀 "SG office", 프로젝트 `sogang-me`) | vercel.com | **Pro 월 20달러**(2026-09 무료 한도 초과로 사이트 중단 후 전환), 추가 사용 한도 20달러 초과 시 일시정지 |
| **Supabase** | DB·인증·신규 파일·휴지통/수정 이력(vault) (프로젝트 pvdobbplxndsigatnamu) | supabase.com/dashboard | Free: 전송량 월 5GB·DB 500MB·Storage 1GB — 전송량 매달 확인 |
| **Cloudflare R2** | legacy 미디어 `sogang-me-media`(공개) + 백업 `sogang-me-backup`(비공개) | dash.cloudflare.com | 저장 10GB (현재 약 2.6GB)·전송 무료 |
| **Google Drive** | 백업 보관 (원본 백업 1.9GB, DB 주간 덤프, 계정정보 문서) | drive.google.com | 15GB (Gmail과 공유) |
| **Google Search Console** | 검색 노출 관리 (sitemap.xml 제출됨) | search.google.com/search-console | 무료 |
| **Google Apps Script** | 주간 DB 자동 백업 (`scripts/gas-db-backup.gs`) | script.google.com | 무료 |

- **모든 서비스의 로그인 계정 = 학과 Gmail (sgmeoffice@gmail.com)** 이 계정이 마스터 열쇠다.
- 주소 체계: `/ko/...` 한국어, `/en/...` 영어. 언어 없는 접속은 (직접 선택 기억 → 접속 국가 → 브라우저 언어) 순으로 자동 판별.
- 옛 홈페이지 주소(그누보드 URL)는 전부 새 사이트로 자동 리다이렉트된다 (`middleware.ts`).

## 2. 일상 운영

- **게시글·교수진·예약·홈 설정 관리**: 사이트의 `/adm` 관리자 화면에서 (코드 수정 불필요)
- **정적 콘텐츠(학과소개·전공소개 등) 수정**: Claude 세션에 요청 → `content/` 폴더 .ts 파일 수정 → main 배포
- **배포 흐름**: main 브랜치에 push되면 Vercel이 자동 빌드·배포 (반영까지 약 1~2분). 별도 배포 버튼 없음
- **예약 알림**: 현재 학과 Gmail로 수신 (박현주 선생님 서강대 메일로 변경 예정 — HANDOFF 참조)
- **옛 홈페이지 열람**: `scripts/옛홈페이지열기.bat` 더블클릭 (행정실 배포용, HANDOFF에 상세)

## 3. Claude(AI)로 작업하는 법 — 새 담당자용

1. **claude.ai/code** 에 학과 Gmail로 로그인 → GitHub 연동에서 `sgmeoffice-hub/sogang-me` 리포 연결
2. 새 세션을 열고 한국어로 작업을 요청하면 된다 (예: "학과소개 페이지 문구 고쳐줘")
3. Claude는 세션 시작 시 루트 `CLAUDE.md`(작업 규칙)를 자동으로 읽고, 규칙에 따라 `docs/HANDOFF.md`(진행 상황)를 이어받는다 — **따로 설명할 필요 없음**
4. 새 세션에게 전체 구조를 알려주려면 "docs/OPERATIONS.md 읽어" 한마디면 된다
5. DB 작업이 필요한 세션은 환경변수가 필요하다: Claude Code 환경설정(Environment)에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`가 등록되어 있음 (값은 Supabase 대시보드 Settings → API)
6. Claude가 작업을 마치면 HANDOFF.md를 갱신해 커밋하는 것이 규칙이다 — 세션이 바뀌어도 맥락이 이어진다

## 4. 백업 체계

| 대상 | 방법 | 위치 |
|---|---|---|
| 코드·문서 | git push 시 자동 | GitHub |
| DB 전체 | **매일 04시 자동**(`/api/cron/backup`, 30일+12개월) | R2 `sogang-me-backup` db/ |
| DB 주간 사본 | `scripts/gas-db-backup.gs` (Apps Script, 월 04시) | 구글드라이브 `db-backup_날짜/` |
| 업로드 파일·legacy 미디어 사본 | 매일 자동(새 파일만·이어서 복사) | R2 `sogang-me-backup` files/ |
| 삭제 글·수정 전 내용 | 휴지통 30일·수정 이력 90일 | Supabase `vault` |

- 확인: 관리자 › 백업·휴지통 "마지막 백업 … 성공". 상세는 `docs/HANDOFF.md` 백업 항목.

## 5. 장애 대응 빠른 안내

| 증상 | 확인할 곳 |
|---|---|
| 사이트 전체가 안 열림 | Vercel 대시보드 (배포 실패 여부) → vercel-status.com |
| 게시판·교수진이 빈 화면 | Supabase 대시보드 (프로젝트 상태, env 키 유효성) |
| 옛 게시글의 이미지·첨부만 깨짐 | Cloudflare R2 (버킷·공개 URL 상태) |
| 새로 올린 파일만 깨짐 | Supabase Storage |
| me.sogang.ac.kr 도메인 문제 | 디지털정보처에 문의 (DNS: CNAME → Vercel) |
| 원인 불명 | Claude 세션을 열고 증상을 그대로 설명하면 진단부터 해준다 |

## 6. 정기 점검 (분기 1회 권장)

- [ ] 관리자 › 백업·휴지통 마지막 백업 성공 확인 (+ 드라이브 `db-backup_` 폴더)
- [ ] Vercel Usage·Billing, Supabase Egress(월 5GB) 확인
- [ ] Supabase Storage 사용량 1GB 미만 확인 (대시보드)
- [ ] R2 사용량 10GB 미만 확인 (거의 고정 1.28GB)
- [ ] Search Console에서 크롤링 오류 확인
- [ ] 계정정보 문서(드라이브) 최신 상태 확인
