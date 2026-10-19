-- schema_v11: 2026-10-16 URECA 재제출 트리거(ureca_dedupe) 제거 — v10 적용 뒤 실행. 코드 변경·배포 불필요. 여러 번 실행해도 안전.
-- Supabase 대시보드 > SQL Editor에 그대로 붙여넣고 Run. 확인은 verify_v11.sql.
--
-- 배경: 운영 DB에만 있던 ureca_dedupe()는 RETURNS trigger 함수였고(verify_v10 11행에 정의가 나옴), ureca_applications에 걸린 트리거가
--   새 신청이 들어올 때 같은 연도·학기·학번의 기존 행을 **상태와 무관하게 전부 삭제**한다. 2026-10-16 세션에서 service role로 합성 행
--   (year 1999, student_id ZZ-TRIGGER-TEST) 2건을 넣어 확인: status=accepted였던 1행이 두 번째 insert 때 사라졌다(시험 행은 삭제함).
--   그래서 v9의 '삭제 대신 superseded 보존'은 실제로는 동작하지 않았고, 선발(accepted)·미선발(rejected)·이관(archived) 기록도
--   학번·연도·학기만 알면 재제출 한 번으로 지워질 수 있었다(공개 API는 anon insert → 트리거는 테이블 소유자 권한으로 실행).
--   API(app/api/ureca/route.ts)는 insert 뒤 replace_ureca_application() RPC(v9)로 같은 학생의 이전 pending만 superseded로 바꾸므로
--   트리거 없이도 '마지막 제출본만 검토 대기' 동작은 그대로다. 트리거를 지운 뒤에는 중복 행이 superseded 상태로 남는 것이 정상이다.

-- 1) ureca_dedupe를 쓰는 트리거를 전부 제거(트리거 이름을 모르므로 함수 기준으로 찾는다)
do $$ declare t record; begin
  for t in select tg.tgname, tg.tgrelid::regclass as rel
           from pg_trigger tg join pg_proc p on p.oid = tg.tgfoid join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'ureca_dedupe' and not tg.tgisinternal loop
    execute format('drop trigger if exists %I on %s', t.tgname, t.rel);
    raise notice 'dropped trigger % on %', t.tgname, t.rel;
  end loop;
end $$;

-- 2) 함수 제거(오버로드 전부). 1)이 먼저 돌아야 drop이 실패하지 않는다.
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'ureca_dedupe' loop
    execute format('drop function %s', f);
    raise notice 'dropped function %', f::text;
  end loop;
end $$;

-- 3) 트리거와 함께 수동으로 만들어졌을 수 있는 (year, term, student_id) 유일 인덱스/제약 제거 — 리포의 스키마 파일에는 없다.
--    남아 있으면 트리거가 사라진 뒤 재제출이 23505(duplicate key)로 실패해 신청이 막힌다. 기본키(id)는 건드리지 않는다.
do $$ declare r record; begin
  for r in select i.indexrelid::regclass as idx, c.conname
           from pg_index i join pg_class t on t.oid = i.indrelid join pg_namespace n on n.oid = t.relnamespace
           left join pg_constraint c on c.conindid = i.indexrelid and c.contype in ('u', 'x')
           where n.nspname = 'public' and t.relname = 'ureca_applications' and i.indisunique and not i.indisprimary loop
    if r.conname is not null then execute format('alter table public.ureca_applications drop constraint %I', r.conname);
    else execute format('drop index if exists %s', r.idx); end if;
    raise notice 'dropped unique index/constraint %', r.idx::text;
  end loop;
end $$;

-- PostgREST 스키마 캐시 갱신
notify pgrst, 'reload schema';
