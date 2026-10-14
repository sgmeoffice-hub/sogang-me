-- verify_v9.sql: schema_v7·v8·v9가 운영 DB에 적용됐는지 한 번에 확인 (2026-10-14).
-- Supabase 대시보드 > SQL Editor에 통째로 붙여넣고 Run → 표 하나가 나온다. 모든 행의 ok가 true여야 한다.
-- 읽기만 하는 질의라 몇 번을 실행해도 안전하다. ok=false인 행은 detail과 함께 개발 담당(Claude 세션)에 알린다.
select '1 v7: posts·faculty en_verified 컬럼' as item, count(*) = 2 as ok, count(*)::text as detail
  from information_schema.columns where table_schema = 'public' and table_name in ('posts', 'faculty') and column_name = 'en_verified'
union all
select '2 v9-1: 예약 읽기 정책(anon 또는 관리자)', count(*) = 1, string_agg(qual, '')
  from pg_policies where tablename = 'reservations' and policyname = 'reservations public read' and qual like '%anon%' and qual like '%is_admin%'
union all
select '3 v9-3: 예약 anon insert 정책(with check)', count(*) = 1, ''
  from pg_policies where tablename = 'reservations' and policyname = 'reservations public insert' and with_check like '%facility%'
union all
select '4 v9-3: URECA anon insert 정책(with check)', count(*) = 1, ''
  from pg_policies where tablename = 'ureca_applications' and policyname = 'ureca public insert' and with_check like '%student_id%'
union all
select '5 v9-4·7: 함수 4개 search_path 고정', count(*) = 4, string_agg(proname, ',')
  from pg_proc where proname in ('is_admin', 'increment_view', 'replace_ureca_application', 'reset_sequences') and 'search_path=public' = any(proconfig)
union all
select '6 v9-5: posts 인덱스 2개', count(*) = 2, string_agg(indexname, ',')
  from pg_indexes where tablename = 'posts' and indexname in ('posts_legacy_idx', 'posts_list_idx')
union all
select '7 v9-6: site_settings 공개 읽기 home 한정', count(*) = 1, ''
  from pg_policies where tablename = 'site_settings' and policyname = 'settings public read' and qual like '%home%'
union all
select '8 v9-8: 예약 anon insert 컬럼 9개', count(*) = 9, string_agg(column_name, ',' order by column_name)
  from information_schema.column_privileges where table_name = 'reservations' and grantee = 'anon' and privilege_type = 'INSERT'
union all
select '9 v9-8: URECA anon insert 컬럼 10개', count(*) = 10, string_agg(column_name, ',' order by column_name)
  from information_schema.column_privileges where table_name = 'ureca_applications' and grantee = 'anon' and privilege_type = 'INSERT'
union all
select '10 v8: 예약 anon select 컬럼 9개(contact·affiliation 없음)', count(*) = 9 and bool_and(column_name not in ('contact', 'affiliation')), string_agg(column_name, ',' order by column_name)
  from information_schema.column_privileges where table_name = 'reservations' and grantee = 'anon' and privilege_type = 'SELECT';
