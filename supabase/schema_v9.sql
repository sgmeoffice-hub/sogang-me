-- schema_v9: 2026-10-13 무료(Hobby) 운영·전수 점검 후속 DB 보강
-- Supabase 대시보드 > SQL Editor에 그대로 붙여넣고 Run. 여러 번 실행해도 안전(if not exists / drop policy if exists / create or replace).
-- 적용 순서: schema.sql → seed → v3 → v4 → v6 → v7 → v8 → v9 (README '스키마 적용 순서').
-- 코드(리포)는 이 SQL 없이도 동작하며, 이 SQL을 코드 배포보다 먼저 실행해도 깨지는 화면은 없다 — 2)의 관리자 배지 표시만 예외(아래 참조).

-- 1) [보안] authenticated(로그인한 모든 Supabase Auth 사용자)가 예약자 연락처·소속을 읽지 못하게 한다.
--    v8은 anon만 컬럼 grant로 막았고 "reservations public read" 정책은 using(true)라, 프로젝트에 자가 가입(signup)이 열려 있으면
--    anon 키로 계정을 만든 누구나 authenticated가 되어 reservations 전체(contact 포함)를 읽을 수 있었다.
--    먼저 대시보드 Authentication › Providers › Email › "Allow new users to sign up" 끄기(관리자는 수동 생성).
--    컬럼 grant가 아니라 행 정책으로 막는 이유: 관리자 예약 화면(app/admin/reservations)은 관리자 세션(authenticated)으로 select('*')를 하는데
--    컬럼 grant를 줄이면 PostgREST가 *를 전 컬럼으로 펼쳐 42501이 나고 화면이 빈 채로 뜬다(코드 변경 없이 적용하려면 정책이 맞다).
--    결과: anon = v8 컬럼 부분집합(달력용)만 전 행 / 관리자(is_admin) = 전 행·전 컬럼 그대로 / 관리자가 아닌 로그인 사용자 = 0행.
--    공개 예약 API(anon insert … returning id)와 관리자 액션·service role(cron·복원)은 영향 없음.
drop policy if exists "reservations public read" on public.reservations;
create policy "reservations public read" on public.reservations
  for select using (auth.role() = 'anon' or is_admin());

-- 2) [오남용] URECA 재제출 대체를 '삭제' 대신 status='superseded'로. 학번만 알면 남의 pending 지원서를 지울 수 있던 문제.
--    시그니처·반환값(대체된 건수)은 v8과 같아 app/api/ureca/route.ts 수정 없음. 검토가 끝난(선발/미선발/이관) 기록은 그대로.
--    원본이 남으므로 수상한 재제출은 관리자가 /adm/ureca에서 '검토 중'(pending)으로 되돌릴 수 있다.
--    ⚠ 관리자 화면(app/admin/ureca)에 'superseded' → '재제출로 대체' 배지가 들어간 코드가 배포되기 전에 실행하면, 대체된 건이
--    '검토 중' 배지(테두리는 회색)로 보이고 CSV에는 'superseded'로 나간다 — 데이터 손상은 없고 대시보드 대기 건수(status='pending')도 정확하다.
--    가능하면 그 코드가 배포된 뒤(2026-10-13 일괄 배포 이후) 실행한다.
create or replace function public.replace_ureca_application(p_year int, p_term text, p_student_id text)
returns int
language sql security definer set search_path = public as $$
  with upd as (
    update ureca_applications set status = 'superseded'
    where year = p_year and term = p_term and student_id = p_student_id
      and status = 'pending'
      and id < (select max(id) from ureca_applications
                where year = p_year and term = p_term and student_id = p_student_id and status = 'pending')
    returning id
  ) select count(*)::int from upd;
$$;
revoke all on function public.replace_ureca_application(int, text, text) from public;
grant execute on function public.replace_ureca_application(int, text, text) to anon, authenticated;

-- 3) [방어] anon INSERT 정책 with check 강화 — API(app/api/reservations, app/api/ureca)와 같은 규칙을 DB에서도 강제.
--    anon 키가 브라우저에 배포되므로 REST 직접 호출로 API의 길이 제한·시설 목록을 우회해 표를 채울 수 있었다(무료 500MB·관리자 화면).
--    테이블 CHECK 제약이 아니라 정책인 이유: 이관된 옛 행(URECA 1,146건·옛 예약)이 규칙에 안 맞을 수 있고, 정책은 anon insert에만 걸린다
--    (관리자 "for all using(is_admin())" 정책은 permissive라 OR로 통과 → 관리자 등록은 영향 없음).
--    시설 목록은 lib/nav.ts facilities와 같아야 한다(시설을 추가하면 여기도 갱신). 길이 상한 = API의 slice() 값.
drop policy if exists "reservations public insert" on public.reservations;
create policy "reservations public insert" on public.reservations
  for insert with check (
    status = 'pending'
    and facility in ('meeting', 'seminar', 'drafting', 'server1', 'server2', 'server3', 'server4')
    and end_time > start_time
    and date >= (now() at time zone 'Asia/Seoul')::date
    and extract(minute from start_time) in (0, 30) and extract(minute from end_time) in (0, 30)   -- 30분 단위(24:00 종료 포함)
    and char_length(user_name) between 1 and 80
    and char_length(coalesce(contact, '')) between 1 and 120
    and char_length(coalesce(purpose, '')) <= 300
    and char_length(coalesce(affiliation, '')) <= 120
  );

drop policy if exists "ureca public insert" on public.ureca_applications;
create policy "ureca public insert" on public.ureca_applications
  for insert with check (
    status = 'pending'
    and year between 2000 and 2100
    and term in ('spring', 'summer', 'fall', 'winter')          -- lib/nav.ts urecaTerms
    and char_length(name) between 1 and 60
    and char_length(student_id) between 1 and 30
    and char_length(coalesce(semester, '')) <= 30
    and char_length(coalesce(phone, '')) <= 40
    and char_length(coalesce(email, '')) between 1 and 120
    and char_length(coalesce(message, '')) <= 1000
    and jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) between 1 and 3
  );

-- 4) [보안] security definer 함수의 search_path 고정 — Supabase Security Advisor 'function_search_path_mutable'.
--    is_admin()은 모든 RLS 쓰기 정책·storage 정책의 관문이라 drop 없이 create or replace(동일 시그니처)로만 바꾼다.
--    increment_view는 비공개 글의 조회수를 anon이 올리지 못하게 published 조건 추가(호출 쪽 app/api/view는 결과를 쓰지 않음).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
create or replace function public.increment_view(post_id bigint) returns void
language sql security definer set search_path = public as $$
  update posts set view_count = view_count + 1 where id = post_id and published;
$$;

-- 5) [효율] 인덱스 — 옛 주소 리다이렉트(middleware.ts: legacy_id 두 값 OR 조회, 하루 수천 건)와 게시판 목록 정렬(lib/data.ts getPostsRaw).
--    기존 posts_board_idx(board, created_at desc)는 이전/다음 글 조회(getAdjacent)·갤러리·홈이 쓰므로 그대로 둔다(표가 작아 쓰기 비용 무시).
create index if not exists posts_legacy_idx on public.posts (legacy_id) where legacy_id is not null;
create index if not exists posts_list_idx on public.posts (board, is_pinned desc, created_at desc, id desc) where published;

-- 6) [정보 노출] site_settings 공개 읽기를 공개 페이지가 읽는 key('home')로 한정.
--    'backup' 행(R2 객체 키·오류 본문·행 수·해시)은 관리자 화면·cron이 service role로만 읽고 쓰므로 공개할 이유가 없다.
--    공개 측 readers(lib/data.ts getHomeData, lib/notify.ts, lib/media.ts)는 모두 key='home'만 조회 — 깨지는 곳 없음.
--    notify_email은 'home' 행 안에 있어 계속 공개된다(학과 사무실 주소라 허용 — 숨기려면 별도 key로 옮기는 코드 변경 필요).
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings
  for select using (key = 'home' or is_admin());

-- 7) [복원] 시퀀스 재설정 — scripts/restore-backup.mjs --apply가 원래 id로 upsert하면 bigserial 시퀀스가 안 움직여
--    새 Supabase 프로젝트에 복원한 뒤 첫 글 저장·예약 신청이 23505(duplicate key)로 실패한다. 복원 스크립트가 끝에 RPC로 호출.
--    service role만 실행 가능(PostgREST에서 anon·authenticated는 호출 불가). 빈 표는 1부터 시작.
create or replace function public.reset_sequences() returns void
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  foreach t in array array['posts', 'faculty', 'reservations', 'banners', 'ureca_applications'] loop
    execute format('select setval(pg_get_serial_sequence(%L, %L), coalesce((select max(id) from %I), 0) + 1, false)', t, 'id', t);
  end loop;
end $$;
revoke all on function public.reset_sequences() from public, anon, authenticated;
grant execute on function public.reset_sequences() to service_role;

-- 8) [방어] anon INSERT를 API가 보내는 컬럼으로만 한정 — id·created_at을 REST로 직접 넣으면 시퀀스가 오염돼
--    나중 정상 신청이 duplicate key로 실패하고, 접수 시각을 위조할 수 있었다. 목록 = 두 API의 row 객체와 동일
--    (API에 컬럼을 추가하면 여기도 추가해야 한다 — 빠지면 모든 신청이 42501로 실패). status는 API가 명시적으로 보내므로 포함.
revoke insert on table public.reservations from anon;
grant insert (facility, date, start_time, end_time, user_name, affiliation, purpose, contact, status)
  on table public.reservations to anon;
revoke insert on table public.ureca_applications from anon;
grant insert (year, term, name, student_id, semester, phone, email, choices, message, status)
  on table public.ureca_applications to anon;

-- PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';

-- 적용 확인(선택): 아래를 따로 실행해 결과를 본다.
-- select policyname, cmd, qual, with_check from pg_policies where tablename in ('reservations','ureca_applications','site_settings');
-- select grantee, privilege_type, string_agg(column_name, ',') from information_schema.column_privileges
--   where table_name in ('reservations','ureca_applications') and grantee in ('anon','authenticated') group by 1,2;
-- 1) 검증: 관리자가 아닌 사용자 JWT(HANDOFF의 password-grant 방법)로 GET /rest/v1/reservations?select=contact → 빈 배열이어야 한다.
-- select proname, prosecdef, proconfig from pg_proc where proname in ('is_admin','increment_view','replace_ureca_application','reset_sequences');
-- select indexname from pg_indexes where tablename = 'posts';
