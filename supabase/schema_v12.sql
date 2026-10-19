-- schema_v12: 2026-10-19 공개 RPC 3개의 anon·authenticated 실행 권한 회수 — **2026-10-19 코드 배포(세 API 라우트가 service role로 호출) 뒤에** 실행.
-- 순서가 바뀌면 조회수 집계·예약 레이스 정리·URECA 재제출 대체가 조용히 멈춘다(배포 확인: 사이트에서 글을 열면 조회수가 오르는지).
-- Supabase 대시보드 > SQL Editor에 그대로 붙여넣고 Run. 여러 번 실행해도 안전. 확인은 verify_v12.sql.
--
-- 배경: Security Advisor "Public/Signed-In Users Can Execute SECURITY DEFINER Function" 8건. anon 키는 브라우저에 배포되므로 누구나
--   REST(/rest/v1/rpc/…)로 직접 부를 수 있었다 — increment_view(조회수 부풀리기), withdraw_conflicted_reservation(겹치는 남의 pending 예약 물리기),
--   replace_ureca_application(학번·연도·학기만 알면 남의 pending 지원서를 superseded로). 이제 세 함수는 서버 라우트(service role)만 부른다.
--   is_admin()은 RLS 정책 평가에 anon·authenticated의 EXECUTE가 필요하므로 그대로 둔다(Advisor 2건은 의도된 상태).
revoke all on function public.increment_view(bigint) from public, anon, authenticated;
grant execute on function public.increment_view(bigint) to service_role;

revoke all on function public.withdraw_conflicted_reservation(bigint) from public, anon, authenticated;
grant execute on function public.withdraw_conflicted_reservation(bigint) to service_role;

revoke all on function public.replace_ureca_application(int, text, text) from public, anon, authenticated;
grant execute on function public.replace_ureca_application(int, text, text) to service_role;

-- PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';
