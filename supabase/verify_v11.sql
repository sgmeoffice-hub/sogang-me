-- verify_v11.sql: schema_v11(ureca_dedupe 트리거 제거) 적용 확인 (2026-10-16). 읽기 전용 — 통째로 Run, 모든 행 ok=true.
select '1 v11-1: ureca_applications에 남은 트리거(내부 제외) 0개' as item, count(*) = 0 as ok, coalesce(string_agg(tgname || ' → ' || tgfoid::regproc::text, ', '), '') as detail
  from pg_trigger where tgrelid = 'public.ureca_applications'::regclass and not tgisinternal
union all
select '2 v11-2: ureca_dedupe 함수 없음', count(*) = 0, coalesce(string_agg(p.oid::regprocedure::text, ', '), '')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'ureca_dedupe'
union all
select '3 v11-3: 기본키 외 유일 인덱스 없음', count(*) = 0, coalesce(string_agg(i.indexrelid::regclass::text, ', '), '')
  from pg_index i join pg_class t on t.oid = i.indrelid join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and t.relname = 'ureca_applications' and i.indisunique and not i.indisprimary
union all
select '4 v9: replace_ureca_application(superseded 처리) 존재·search_path 고정', count(*) = 1, coalesce(string_agg(array_to_string(proconfig, ';'), ''), '')
  from pg_proc where proname = 'replace_ureca_application' and 'search_path=public' = any(proconfig)
union all
select '5 참고: ureca_applications 상태별 건수', true, (select string_agg(status || ' ' || n, ', ' order by status) from (select status, count(*) n from public.ureca_applications group by status) s);
