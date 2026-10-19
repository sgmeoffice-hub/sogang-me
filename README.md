# 서강대학교 기계공학과 홈페이지 (Sogang ME)

Next.js 15 (App Router) · Tailwind · TypeScript · Supabase(DB/인증/파일) · Cloudflare R2(옛 파일·백업) · Vercel(호스팅) · 국문/영문 · 관리자 페이지(`/adm`) · 자동 영문 번역

**먼저 읽을 문서**: 작업 규칙 `CLAUDE.md` → 운영 개요 `docs/OPERATIONS.md` → 담당자 교체 `docs/ADMIN-HANDOVER.md` → 최근 작업·미결 `docs/HANDOFF.md`. 옛 홈페이지 이관 기록은 `docs/LEGACY-BACKUP.md`.
이 리포는 **공개**다 — 키·비밀번호는 절대 커밋하지 않는다(값은 학과 드라이브의 계정정보 문서).

## 구성
| 경로 | 내용 |
|---|---|
| `app/[locale]/…` | 공개 사이트 (`/ko`, `/en`) |
| `app/admin/…` | 관리자 (실제 주소는 `ADMIN_PATH`, 기본 `/adm`) |
| `app/api/…` | 예약·URECA 접수, 조회수, cron(번역 보완·백업), 관리자 API |
| `content/`, `lib/i18n.ts` | 고정 페이지 본문(국/영)·연혁·학사일정·전공소개, 공통 문구 |
| `lib/` | 데이터 조회·캐시(`data.ts`, `refresh.ts`), 번역, 백업(`backup.ts`, `r2.ts`, `vault.ts`) |
| `supabase/` | DB 스키마(`schema.sql` + `schema_v3`~`v10`, 확인용 `verify_v10.sql`), 시드 |
| `scripts/` | 복원(`restore-backup.mjs`), 드라이브 주간 백업(`gas-db-backup.gs`), 옛 홈페이지 이관(`parse_dump.py`·`migrate_legacy.py`) |

## 스키마 적용 순서 (새 Supabase 프로젝트)
SQL Editor에서 **이 순서대로** 실행한다. 모두 여러 번 실행해도 안전하지만 v4·v6은 교수 행을 갱신하므로 시드 뒤에 와야 한다. 시드(`seed_*.sql`)는 **빈 사이트를 처음 시작할 때만** — 백업에서 복원할 때는 건너뛴다(`restore-backup.mjs`는 upsert라 시드의 예시 글·예약·교수 행이 지워지지 않고 공개 사이트에 남는다).
1. `schema.sql` (테이블·RLS·storage `media`) → `seed_faculty.sql`, `seed_posts.sql`
2. `schema_v3.sql` (새 게시판·URECA 지원·알림 이메일) → `seed_v3.sql`
3. `schema_v4.sql` (교수 `groups`, 이름으로 갱신) → `schema_v6.sql` (교수 건물·호실, `office`에서 분리)
4. `schema_v7.sql` (`en_verified`) — 운영 DB에 **적용됐는지 미확인**: `select column_name from information_schema.columns where table_name='posts' and column_name='en_verified';`가 비면 실행
5. `schema_v8.sql` (관리자 쓰기 정책, 예약자 연락처 anon 차단, URECA 재제출·예약 레이스 RPC) — 없으면 관리자 추가가 조용히 실패하고 예약자 연락처가 노출된다
6. `schema_v9.sql` (2026-10-13: 예약 읽기 정책을 anon·관리자로 한정, URECA 재제출을 삭제 대신 `superseded`로, anon insert 정책·컬럼 제한, search_path, 인덱스, site_settings 공개 범위, `reset_sequences()`) — 코드 배포와 무관하게 실행해도 깨지는 화면은 없다. 단 관리자 URECA 화면에 `superseded`('재제출로 대체') 배지가 있는 코드가 배포되기 전이면 대체된 건이 '검토 중'으로 보이므로, 가능하면 2026-10-13 배포 뒤에 실행
7. `schema_v10.sql` (2026-10-14: Security Advisor 후속 — 수동 생성된 `ureca_dedupe()` 실행 권한 회수·search_path 고정, media 버킷 anon 목록 조회 정책 제거) — 코드 변경·배포 불필요
8. `verify_v10.sql` — 적용 확인용(읽기 전용, v7~v10 13항목). 통째로 Run하면 표 하나가 나오고 모든 행의 `ok`가 true여야 한다 (`verify_v9.sql`은 v9까지의 10항목)
9. `schema_v11.sql` (2026-10-16: 운영 DB에만 있던 `ureca_dedupe` **트리거** 제거 — 재제출 때 같은 학생의 선발·미선발 기록까지 지우던 것; 함께 만들어졌을 수 있는 유일 인덱스도 제거) → `verify_v11.sql`로 확인. 새 프로젝트에는 그 트리거가 없으므로 실행해도 아무 일도 하지 않는다
7. Authentication → Users → Add user(관리자, Auto confirm) → `insert into admins (email) values ('…');` → Authentication › Providers › Email에서 **"Allow new users to sign up" 끄기**(관리자는 수동 생성)
- `vault` 저장소(휴지통·수정 이력)는 코드가 처음 쓸 때 자동 생성된다. 백업에서 전체를 되살리는 절차는 `docs/OPERATIONS.md` '새 Supabase 프로젝트 재구축'.

## 배포 (처음 한 번)
1. **Supabase**: New project(Northeast Asia/Seoul) → 위 스키마 적용 → Project Settings › API에서 URL·anon·service_role 복사
2. **GitHub**: 이 리포(`sgmeoffice-hub/sogang-me`, 공개). Vercel은 소유자 계정의 main 푸시만 배포한다
3. **Vercel**: Add New Project → 리포 Import → Environment Variables는 **`.env.example`의 전체 목록**대로(필수: Supabase 3개·`CRON_SECRET`, 백업: `R2_*`, 메일: `RESEND_API_KEY`) → Deploy
4. **도메인**: Settings › Domains에 `me.sogang.ac.kr` → 디지털정보처에 CNAME(`cname.vercel-dns.com`) 요청
5. **관리자 접속**: `https://도메인/adm`

## 로컬 실행·검사
```bash
cp .env.example .env.local   # 값 채우기
npm install && npm run dev   # http://localhost:3000
npm run build                # push 전 필수(CLAUDE.md)
npx tsc --noEmit             # 타입 검사 — next.config.mjs가 ignoreBuildErrors라 build는 타입 오류를 통과시킨다
```
- `npm run lint`는 ESLint 설정이 없어 동작하지 않는다(미도입). 타입 검사는 위 `tsc`로.
- 배포 트리거: `vercel.json`의 `ignoreCommand`로 `docs/`·`*.md`·`scripts/`·`supabase/`만 바뀐 커밋은 배포하지 않는다(Hobby 무료 한도 — 배포마다 ISR 캐시 재생성 비용).

## 동작 요약
- **게시글·교수·예약·URECA·배너·홈 설정**: `/adm`에서. 글 삭제는 **휴지통 30일 보관** 후 매일 백업 작업이 파일까지 정리(교수·배너 삭제는 즉시 파일 삭제).
- **영문**: 국문만 저장하면 무료 번역기로 자동 생성(`lib/translate.ts`). `ANTHROPIC_API_KEY`를 넣으면 Claude 번역(유료)으로 전환. 비어 있는 영문은 매일 03시대 cron·관리자 접속 시 자동 보완.
- **언어 판별**(`middleware.ts`): 전환 버튼 쿠키 → 브라우저 언어에 ko 있으면 ko → Accept-Language 없는 클라이언트(검색 로봇)는 ko → 한국 IP는 ko → 그 외 en.
- **옛 홈페이지 주소**(`/bbs/…`, `/v2/bbs/…`, `*.php`): 미들웨어가 새 글로 리다이렉트. 로봇이 몰려 `vercel.json`에서 챌린지.
- **로고·테마**: 공식 시그니처 로고(`components/Logo.tsx`, `public/images/`), 카디널 레드 `--sg-red`(`app/globals.css`). 임의로 바꾸지 않는다(CLAUDE.md).
- **캐시**: 공개 페이지는 ISR + `unstable_cache`(태그 `site`·`posts`·`faculty`·`reservations`). DB를 관리자 화면 밖에서 고쳤으면 `POST /api/admin/revalidate`.
- **게시판별 특수 필드**(posts): `capstone` term(`2025-2`)·members·advisor·sort_order(조)·thumbnail / `festival` term(연도)·category(ureca|capstone|project|award) / `videos` video_url·category·sort_order / `promo` 첨부 PDF. 모든 게시판에 YouTube 주소 가능.
- **코드로 관리하는 항목(의도)**: 4대 분야·7개 연구그룹(`content/pages-grad.ts`, `lib/groups.ts`), 학사일정(`content/pages-ug.ts`), 메뉴·게시판·시설·URECA 기간 목록(`lib/nav.ts`), 화면 문구(`lib/i18n.ts`).

## 비용
목표는 **Vercel Hobby(무료) + Supabase Free + R2 무료 한도**. 2026-09-16 Hobby 한도 초과로 사이트가 멈춘 적이 있어(HTTP 402) 현재는 Pro 유지 중이며, 하향 판단·안전선은 `docs/HANDOFF.md` 최신 판정과 `docs/ADMIN-HANDOVER.md` §2를 따른다.

## 옛 홈페이지(그누보드) 이관
실제 사용한 파이프라인은 `scripts/parse_dump.py` → `scripts/migrate_legacy.py`(`docs/LEGACY-BACKUP.md`). `scripts/migrate_gnuboard.py`는 초기 설계본으로 **대체됨**(실행 금지, 매핑 표 참고용으로 `supabase/migrate_gnuboard.md`만 유효). Supabase는 표준 PostgreSQL이라 `pg_dump`로도 전량 추출 가능.
