-- verify_v12.sql: schema_v12(공개 RPC 3개 권한 회수) 적용 확인 (2026-10-19). 읽기 전용 — 통째로 Run, 모든 행 ok=true.
with f as (
  select p.oid, p.oid::regprocedure::text as sig
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('increment_view', 'withdraw_conflicted_reservation', 'replace_ureca_application')
)
select '1 v12: 함수 3개 존재' as item, count(*) = 3 as ok, string_agg(sig, ', ' order by sig) as detail from f
union all
select '2 v12: anon 실행 불가(3개 모두)', bool_and(not has_function_privilege('anon', oid, 'execute')), string_agg(sig || '=' || has_function_privilege('anon', oid, 'execute'), ', ' order by sig) from f
union all
select '3 v12: authenticated 실행 불가(3개 모두)', bool_and(not has_function_privilege('authenticated', oid, 'execute')), string_agg(sig || '=' || has_function_privilege('authenticated', oid, 'execute'), ', ' order by sig) from f
union all
select '4 v12: service_role 실행 가능(3개 모두)', bool_and(has_function_privilege('service_role', oid, 'execute')), '' from f
union all
select '5 유지: is_admin()은 anon·authenticated 실행 가능(RLS 평가용)', has_function_privilege('anon', 'public.is_admin()', 'execute') and has_function_privilege('authenticated', 'public.is_admin()', 'execute'), '';
