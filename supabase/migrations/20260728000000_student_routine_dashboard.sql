-- Dados de rotina do aluno: avisos por turma e sessões de estudo.
-- Ambas as tabelas ficam vazias até o respectivo fluxo publicar registros;
-- o dashboard nunca fabrica duração ou aviso para preencher estados vazios.

create table if not exists public.study_sessions (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references auth.users (id) on delete cascade,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  source           text not null default 'manual',
  created_at       timestamptz not null default now()
);
create index if not exists study_sessions_student_started_idx on public.study_sessions (student_id, started_at desc);

alter table public.study_sessions enable row level security;
drop policy if exists study_sessions_select_own on public.study_sessions;
create policy study_sessions_select_own on public.study_sessions
  for select using (student_id = auth.uid());
drop policy if exists study_sessions_insert_own on public.study_sessions;
create policy study_sessions_insert_own on public.study_sessions
  for insert with check (student_id = auth.uid());
drop policy if exists study_sessions_update_own on public.study_sessions;
create policy study_sessions_update_own on public.study_sessions
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

create table if not exists public.class_announcements (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  author_id  uuid not null references auth.users (id) on delete cascade,
  message    text not null check (char_length(trim(message)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists class_announcements_class_created_idx on public.class_announcements (class_id, created_at desc);

drop trigger if exists class_announcements_set_updated_at on public.class_announcements;
create trigger class_announcements_set_updated_at
  before update on public.class_announcements
  for each row execute function public.set_updated_at();

alter table public.class_announcements enable row level security;
drop policy if exists class_announcements_select_member on public.class_announcements;
create policy class_announcements_select_member on public.class_announcements
  for select using (public.is_class_owner(class_id) or public.is_enrolled_in_class(class_id));
drop policy if exists class_announcements_insert_owner on public.class_announcements;
create policy class_announcements_insert_owner on public.class_announcements
  for insert with check (author_id = auth.uid() and public.is_class_owner(class_id));
drop policy if exists class_announcements_update_owner on public.class_announcements;
create policy class_announcements_update_owner on public.class_announcements
  for update using (author_id = auth.uid() and public.is_class_owner(class_id))
  with check (author_id = auth.uid() and public.is_class_owner(class_id));
drop policy if exists class_announcements_delete_owner on public.class_announcements;
create policy class_announcements_delete_owner on public.class_announcements
  for delete using (author_id = auth.uid() and public.is_class_owner(class_id));

-- A UI do aluno só precisa do nome do professor. A função evita ampliar a
-- policy de profiles e, portanto, não expõe campos particulares do perfil.
create or replace function public.student_class_teacher_names(p_class_ids uuid[])
returns table (class_id uuid, teacher_name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, p.full_name
  from public.classes c
  join public.profiles p on p.id = c.owner_id
  where c.id = any(p_class_ids)
    and public.is_enrolled_in_class(c.id);
$$;
revoke all on function public.student_class_teacher_names(uuid[]) from public;
grant execute on function public.student_class_teacher_names(uuid[]) to authenticated;
