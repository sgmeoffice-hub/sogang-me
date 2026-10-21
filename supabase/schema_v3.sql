-- v3: new boards (promo/capstone/festival/videos), youtube, URECA applications, notification email
alter table posts add column if not exists video_url text;
alter table posts add column if not exists term text;        -- e.g. '2025-2' (학년도-학기) or year '2025'
alter table posts add column if not exists members text;     -- 조원
alter table posts add column if not exists advisor text;     -- 지도교수
alter table posts add column if not exists category text;    -- videos: 분야 / festival: ureca|capstone|project|award
alter table posts add column if not exists sort_order int default 100;

create table if not exists ureca_applications (
  id bigserial primary key,
  year int not null,
  term text not null,            -- spring | summer | fall | winter
  name text not null,
  student_id text not null,
  semester text,                 -- 현재 학기
  phone text,
  email text,
  choices jsonb default '[]'::jsonb,   -- [{rank:1, lab:'...', prof:'...'}]
  message text,
  status text default 'pending',       -- pending | accepted | rejected
  created_at timestamptz default now()
);
alter table ureca_applications enable row level security;
drop policy if exists "ureca public insert" on ureca_applications;
create policy "ureca public insert" on ureca_applications for insert with check (status = 'pending');
drop policy if exists "ureca admin all" on ureca_applications;
create policy "ureca admin all" on ureca_applications for all using (is_admin()) with check (is_admin());
-- Data API 권한(2026-10-21 추가, schema.sql 끝의 설명 참조): 2026-10-30 이후 새 표·시퀀스는 명시적 grant가 있어야 PostgREST가 접근한다.
-- anon의 insert 열 제한은 v9가, 트리거 제거는 v11이 이어서 처리한다.
grant select, insert, update, delete on table public.ureca_applications to anon, authenticated, service_role;
grant usage, select on sequence public.ureca_applications_id_seq to anon, authenticated, service_role;

update site_settings set value = value || '{"notify_email":"sgmeoffice@gmail.com"}'::jsonb where key='home' and not (value ? 'notify_email');
alter table posts add column if not exists category_en text;
