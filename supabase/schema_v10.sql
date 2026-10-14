-- schema_v10: 2026-10-14 Supabase Security Advisor 잔여 경고 후속 — v9 적용·확인(verify_v9 전 행 true) 뒤에 실행.
-- Supabase 대시보드 > SQL Editor에 그대로 붙여넣고 Run. 여러 번 실행해도 안전(조건부 alter / drop policy if exists). 코드 변경·배포 불필요.
-- 적용 순서: schema.sql → seed → v3 → v4 → v6 → v7 → v8 → v9 → v10 (README '스키마 적용 순서'). 확인은 verify_v10.sql.

-- 1) [보안] ureca_dedupe(): 리포의 어떤 스키마 파일도 만들지 않고 코드도 부르지 않는 함수(대시보드에서 수동 생성된 것으로 보임)인데
--    security definer + search_path 미고정 + anon·authenticated 실행 가능 상태였다(Advisor: function_search_path_mutable,
--    public/authenticated can execute security definer function). 본문을 모르는 함수라 지우지 않고(트리거가 쓰면 drop이 실패하므로 안전하긴 하지만
--    확인 전까지 보존) 실행 권한을 service_role(SQL Editor·cron)로 좁히고 search_path를 고정한다. verify_v10이 정의 앞부분을 보여 주므로
--    그걸 보고 필요 없으면 `drop function public.ureca_dedupe();`를 따로 실행한다. 함수가 없는 프로젝트(새로 복원한 경우)에서는 아무것도 하지 않는다.
do $$
begin
  if to_regprocedure('public.ureca_dedupe()') is not null then
    alter function public.ureca_dedupe() set search_path = public;
    revoke all on function public.ureca_dedupe() from public, anon, authenticated;
    grant execute on function public.ureca_dedupe() to service_role;
  end if;
end $$;

-- 2) [정보 노출] media 버킷 목록 조회 차단(Advisor: Public Bucket Allows Listing).
--    storage.objects의 "media public read"(select using bucket_id = 'media')는 anon 키로 POST /storage/v1/object/list/media 를 부르면
--    업로드된 파일 전체 목록(경로·크기·시각)을 받아 갈 수 있게 한다. 공개 버킷의 파일 자체는 /storage/v1/object/public/media/… 경로로
--    정책과 무관하게 내려받으므로(사이트의 <img>·첨부 링크·Uploader의 getPublicUrl) 이 정책을 지워도 공개 페이지는 그대로다.
--    목록·삭제가 필요한 쪽은 관리자 세션("media admin write" for all using is_admin() — select 포함, 그대로 둠)과 service role(백업 lib/backup.ts)뿐이다.
--    공개 측 코드에 storage list/download 호출은 없다(2026-10-14 grep 확인).
drop policy if exists "media public read" on storage.objects;

-- 3) [기록] 그대로 두는 Advisor 경고(의도된 상태 — 다음 코드 배포 뒤 v11에서 정리):
--    - is_admin(): RLS 정책 식이 요청 역할(anon·authenticated)의 권한으로 평가되므로 EXECUTE가 필요하다. 회수하면 공개 읽기 정책 자체가 permission denied.
--    - increment_view(bigint)·withdraw_conflicted_reservation(bigint)·replace_ureca_application(int,text,text): 공개 API 라우트
--      (app/api/view·reservations·ureca)가 anon 키 클라이언트로 호출한다. 세 라우트를 service role 클라이언트로 바꾸는 코드가 배포된 뒤
--      v11에서 anon·authenticated EXECUTE를 회수하면 REST 직접 호출(조회수 부풀리기 등)까지 막힌다 — 그 전에 회수하면 조회수·레이스 정리·재제출 대체가 조용히 멈춘다.
--    - Leaked Password Protection(Auth): 유료 플랜 기능. 관리자 계정이 소수이고 비밀번호를 책임자가 정하므로 보류.

-- PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';
