-- ============================================================================
-- MSY Academy — Migration 0007: Fase 2 — Turmas, Atividades, Planos de Aula,
-- Biblioteca.
--
-- Introduces the first real owner-OR-enrolled-member RLS pattern (see plan
-- item A): a student has their own tenant_id, never the professor's, so
-- access to a class's data is granted via `enrollments`, additively on top
-- of the existing owner-only policies — no existing policy is rewritten.
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type enrollment_status as enum ('ACTIVE', 'INVITED', 'REMOVED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type material_kind as enum ('EXAM', 'ACTIVITY', 'LESSON_PLAN', 'FILE');
exception when duplicate_object then null; end $$;

-- ── classes ───────────────────────────────────────────────────────────────
create table if not exists public.classes (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  owner_id        uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  subject_id      uuid references public.subjects (id),
  grade_level_id  uuid references public.grade_levels (id),
  invite_code     text not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists classes_tenant_active_idx
  on public.classes (tenant_id, created_at desc) where deleted_at is null;

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- ── enrollments (N:N aluno<->turma) — created before classes' policies
-- reference it, since classes_select_enrolled below needs the table to exist.
create table if not exists public.enrollments (
  class_id    uuid not null references public.classes (id) on delete cascade,
  student_id  uuid not null references auth.users (id) on delete cascade,
  status      enrollment_status not null default 'ACTIVE',
  created_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index if not exists enrollments_student_idx on public.enrollments (student_id);

alter table public.classes enable row level security;

drop policy if exists classes_select_owner on public.classes;
create policy classes_select_owner on public.classes
  for select using (tenant_id = public.auth_tenant_id() and deleted_at is null);

-- Owner-OR-enrolled-member (plan item A): a student can read the class they
-- are enrolled in, even though it belongs to a different tenant.
-- NOTE: this policy (and the two below it) had a circular-RLS bug fixed in
-- migration 0008 — see that file for the SECURITY DEFINER helpers. Left
-- as originally written here since this file is already applied; 0008
-- DROP+CREATEs these same three policies with the corrected definition.
drop policy if exists classes_select_enrolled on public.classes;
create policy classes_select_enrolled on public.classes
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.enrollments e
      where e.class_id = classes.id and e.student_id = auth.uid() and e.status = 'ACTIVE'
    )
  );

drop policy if exists classes_insert_own on public.classes;
create policy classes_insert_own on public.classes
  for insert with check (tenant_id = public.auth_tenant_id() and owner_id = auth.uid());

drop policy if exists classes_update_own on public.classes;
create policy classes_update_own on public.classes
  for update using (tenant_id = public.auth_tenant_id() and owner_id = auth.uid())
  with check (tenant_id = public.auth_tenant_id() and owner_id = auth.uid());

alter table public.enrollments enable row level security;

-- Student reads their own enrollment rows.
drop policy if exists enrollments_select_own on public.enrollments;
create policy enrollments_select_own on public.enrollments
  for select using (student_id = auth.uid());

-- Professor reads enrollments of classes they own ("Alunos" tab).
drop policy if exists enrollments_select_owner on public.enrollments;
create policy enrollments_select_owner on public.enrollments
  for select using (
    exists (select 1 from public.classes c where c.id = class_id and c.tenant_id = public.auth_tenant_id())
  );

-- Professor sees the enrolled student's display name in the "Alunos" tab —
-- a narrow, additive read grant on top of the existing self-only policy
-- from migration 0001 (RLS policies are OR'd, so profiles_select_own still
-- applies unchanged).
drop policy if exists profiles_select_enrolled_student on public.profiles;
create policy profiles_select_enrolled_student on public.profiles
  for select using (
    exists (
      select 1 from public.enrollments e
      join public.classes c on c.id = e.class_id
      where e.student_id = profiles.id and c.tenant_id = public.auth_tenant_id()
    )
  );

-- Joining a class by invite code is a SECURITY DEFINER RPC, not a direct
-- INSERT: this avoids ever needing a broad SELECT policy on `classes` for
-- anonymous/unenrolled users to look up a code (which would let anyone
-- enumerate another tenant's classes).
create or replace function public.join_class_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
begin
  select id into v_class_id from public.classes
   where invite_code = p_invite_code and deleted_at is null;

  if v_class_id is null then
    raise exception 'Código de convite inválido' using errcode = 'P0002';
  end if;

  insert into public.enrollments (class_id, student_id, status)
  values (v_class_id, auth.uid(), 'ACTIVE')
  on conflict (class_id, student_id) do update set status = 'ACTIVE';

  return v_class_id;
end;
$$;
revoke all on function public.join_class_by_invite_code(text) from public;
grant execute on function public.join_class_by_invite_code(text) to authenticated;

-- ── activities + activity_items (mirrors exams/exam_questions, Fase 1) ─────
create table if not exists public.activities (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  author_id       uuid not null references auth.users (id) on delete cascade,
  title           text not null,
  subject_id      uuid references public.subjects (id),
  grade_level_id  uuid references public.grade_levels (id),
  generation_params jsonb not null default '{}'::jsonb,
  status          exam_status not null default 'READY',
  ai_provider     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists activities_tenant_active_idx
  on public.activities (tenant_id, created_at desc) where deleted_at is null;

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

alter table public.activities enable row level security;

drop policy if exists activities_select_tenant on public.activities;
create policy activities_select_tenant on public.activities
  for select using (tenant_id = public.auth_tenant_id() and deleted_at is null);
drop policy if exists activities_insert_own on public.activities;
create policy activities_insert_own on public.activities
  for insert with check (tenant_id = public.auth_tenant_id() and author_id = auth.uid());
drop policy if exists activities_update_own on public.activities;
create policy activities_update_own on public.activities
  for update using (tenant_id = public.auth_tenant_id() and author_id = auth.uid())
  with check (tenant_id = public.auth_tenant_id() and author_id = auth.uid());

create or replace function public.soft_delete_activity(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.activities set deleted_at = now()
   where id = p_activity_id and author_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Atividade não encontrada ou sem permissão' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.soft_delete_activity(uuid) from public;
grant execute on function public.soft_delete_activity(uuid) to authenticated;

create table if not exists public.activity_items (
  activity_id  uuid not null references public.activities (id) on delete cascade,
  question_id  uuid not null references public.questions (id) on delete cascade,
  position     int not null,
  points       numeric not null default 1,
  primary key (activity_id, question_id)
);
create index if not exists activity_items_activity_idx on public.activity_items (activity_id, position);

alter table public.activity_items enable row level security;

drop policy if exists activity_items_select_tenant on public.activity_items;
create policy activity_items_select_tenant on public.activity_items
  for select using (
    exists (select 1 from public.activities a where a.id = activity_id and a.tenant_id = public.auth_tenant_id() and a.deleted_at is null)
  );
drop policy if exists activity_items_insert_own on public.activity_items;
create policy activity_items_insert_own on public.activity_items
  for insert with check (
    exists (select 1 from public.activities a where a.id = activity_id and a.tenant_id = public.auth_tenant_id() and a.author_id = auth.uid())
  );
drop policy if exists activity_items_update_own on public.activity_items;
create policy activity_items_update_own on public.activity_items
  for update using (
    exists (select 1 from public.activities a where a.id = activity_id and a.tenant_id = public.auth_tenant_id() and a.author_id = auth.uid())
  );
drop policy if exists activity_items_delete_own on public.activity_items;
create policy activity_items_delete_own on public.activity_items
  for delete using (
    exists (select 1 from public.activities a where a.id = activity_id and a.tenant_id = public.auth_tenant_id() and a.author_id = auth.uid())
  );

create or replace function public.create_activity_with_questions(
  p_title              text,
  p_subject_id         uuid,
  p_grade_level_id     uuid,
  p_generation_params  jsonb,
  p_ai_provider        text,
  p_questions          jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_tenant_id     uuid := public.auth_tenant_id();
  v_activity_id   uuid;
  v_question      jsonb;
  v_question_id   uuid;
  v_position      int := 0;
begin
  insert into public.activities (tenant_id, author_id, title, subject_id, grade_level_id, generation_params, status, ai_provider)
  values (v_tenant_id, auth.uid(), p_title, p_subject_id, p_grade_level_id, coalesce(p_generation_params, '{}'::jsonb), 'READY', p_ai_provider)
  returning id into v_activity_id;

  for v_question in select * from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb))
  loop
    v_position := v_position + 1;
    insert into public.questions (tenant_id, author_id, type, difficulty, statement, options, correct_answer, explanation, tags, ai_provider)
    values (
      v_tenant_id, auth.uid(),
      (v_question->>'type')::question_type,
      coalesce((v_question->>'difficulty')::difficulty_level, 'MEDIO'),
      v_question->>'statement', v_question->'options', v_question->'correctAnswer', v_question->>'explanation',
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_question->'tags', '[]'::jsonb)) x), '{}'::text[]),
      p_ai_provider
    ) returning id into v_question_id;

    insert into public.activity_items (activity_id, question_id, position, points)
    values (v_activity_id, v_question_id, v_position, 1);
  end loop;

  return v_activity_id;
end;
$$;
grant execute on function public.create_activity_with_questions(text, uuid, uuid, jsonb, text, jsonb) to authenticated;

-- ── lesson_plans ─────────────────────────────────────────────────────────
create table if not exists public.lesson_plans (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references public.tenants (id) on delete cascade,
  author_id               uuid not null references auth.users (id) on delete cascade,
  subject_id              uuid references public.subjects (id),
  grade_level_id          uuid references public.grade_levels (id),
  theme                   text not null,
  objectives              text,
  content                 text,
  suggested_activities    text,
  suggested_assessments   text,
  status                  exam_status not null default 'READY',
  ai_provider             text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);
create index if not exists lesson_plans_tenant_active_idx
  on public.lesson_plans (tenant_id, created_at desc) where deleted_at is null;

drop trigger if exists lesson_plans_set_updated_at on public.lesson_plans;
create trigger lesson_plans_set_updated_at
  before update on public.lesson_plans
  for each row execute function public.set_updated_at();

alter table public.lesson_plans enable row level security;

drop policy if exists lesson_plans_select_tenant on public.lesson_plans;
create policy lesson_plans_select_tenant on public.lesson_plans
  for select using (tenant_id = public.auth_tenant_id() and deleted_at is null);
drop policy if exists lesson_plans_insert_own on public.lesson_plans;
create policy lesson_plans_insert_own on public.lesson_plans
  for insert with check (tenant_id = public.auth_tenant_id() and author_id = auth.uid());
drop policy if exists lesson_plans_update_own on public.lesson_plans;
create policy lesson_plans_update_own on public.lesson_plans
  for update using (tenant_id = public.auth_tenant_id() and author_id = auth.uid())
  with check (tenant_id = public.auth_tenant_id() and author_id = auth.uid());

create or replace function public.soft_delete_lesson_plan(p_lesson_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lesson_plans set deleted_at = now()
   where id = p_lesson_plan_id and author_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Plano de aula não encontrado ou sem permissão' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.soft_delete_lesson_plan(uuid) from public;
grant execute on function public.soft_delete_lesson_plan(uuid) to authenticated;

-- to_tsvector(regconfig, text) is STABLE in pg_proc (dictionaries are
-- alterable), so Postgres refuses it inside a GENERATED ALWAYS AS STORED
-- column even with an explicit regconfig cast. Standard workaround: wrap it
-- in a same-behavior function explicitly marked IMMUTABLE.
-- ── materials: searchable index of the Biblioteca ────────────────────────
-- `search_vector` is a plain column kept in sync by a BEFORE trigger, not a
-- GENERATED column: to_tsvector(regconfig, text) is STABLE in pg_proc (text
-- search dictionaries are alterable), and Postgres rejects it in a GENERATED
-- expression regardless of wrapping — even a same-signature function
-- declared IMMUTABLE. A trigger has no such restriction.
create table if not exists public.materials (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  owner_id        uuid not null references auth.users (id) on delete cascade,
  kind            material_kind not null,
  ref_id          uuid,
  storage_path    text,
  title           text not null,
  tags            text[] not null default '{}',
  search_vector   tsvector,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists materials_tenant_active_idx
  on public.materials (tenant_id, created_at desc) where deleted_at is null;
create index if not exists materials_search_idx on public.materials using gin (search_vector);

drop trigger if exists materials_set_updated_at on public.materials;
create trigger materials_set_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

create or replace function public.materials_sync_search_vector()
returns trigger language plpgsql as $$
begin
  new.search_vector := to_tsvector('portuguese', coalesce(new.title, '') || ' ' || array_to_string(coalesce(new.tags, '{}'), ' '));
  return new;
end;
$$;
drop trigger if exists materials_search_vector_trigger on public.materials;
create trigger materials_search_vector_trigger
  before insert or update of title, tags on public.materials
  for each row execute function public.materials_sync_search_vector();

alter table public.materials enable row level security;

drop policy if exists materials_select_tenant on public.materials;
create policy materials_select_tenant on public.materials
  for select using (tenant_id = public.auth_tenant_id() and deleted_at is null);
drop policy if exists materials_insert_own on public.materials;
create policy materials_insert_own on public.materials
  for insert with check (tenant_id = public.auth_tenant_id() and owner_id = auth.uid());
drop policy if exists materials_update_own on public.materials;
create policy materials_update_own on public.materials
  for update using (tenant_id = public.auth_tenant_id() and owner_id = auth.uid())
  with check (tenant_id = public.auth_tenant_id() and owner_id = auth.uid());

create or replace function public.soft_delete_material(p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.materials set deleted_at = now()
   where id = p_material_id and owner_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Material não encontrado ou sem permissão' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.soft_delete_material(uuid) from public;
grant execute on function public.soft_delete_material(uuid) to authenticated;

-- Keep the Biblioteca in sync automatically: every exam/activity/lesson_plan
-- is indexed into `materials` on creation, retitled on rename, and hidden
-- on soft-delete — no application code has to remember to do this.
create or replace function public.sync_exam_material()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.materials (tenant_id, owner_id, kind, ref_id, title)
    values (new.tenant_id, new.author_id, 'EXAM', new.id, new.title);
  elsif tg_op = 'UPDATE' then
    update public.materials
       set title = new.title, deleted_at = new.deleted_at
     where kind = 'EXAM' and ref_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists exams_sync_material on public.exams;
create trigger exams_sync_material
  after insert or update on public.exams
  for each row execute function public.sync_exam_material();

create or replace function public.sync_activity_material()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.materials (tenant_id, owner_id, kind, ref_id, title)
    values (new.tenant_id, new.author_id, 'ACTIVITY', new.id, new.title);
  elsif tg_op = 'UPDATE' then
    update public.materials
       set title = new.title, deleted_at = new.deleted_at
     where kind = 'ACTIVITY' and ref_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists activities_sync_material on public.activities;
create trigger activities_sync_material
  after insert or update on public.activities
  for each row execute function public.sync_activity_material();

create or replace function public.sync_lesson_plan_material()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.materials (tenant_id, owner_id, kind, ref_id, title)
    values (new.tenant_id, new.author_id, 'LESSON_PLAN', new.id, new.theme);
  elsif tg_op = 'UPDATE' then
    update public.materials
       set title = new.theme, deleted_at = new.deleted_at
     where kind = 'LESSON_PLAN' and ref_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists lesson_plans_sync_material on public.lesson_plans;
create trigger lesson_plans_sync_material
  after insert or update on public.lesson_plans
  for each row execute function public.sync_lesson_plan_material();

-- ── Storage bucket for standalone file uploads (RNF-S08) ────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materials', 'materials', false, 10485760, array['application/pdf'])
on conflict (id) do update set file_size_limit = 10485760, allowed_mime_types = array['application/pdf'];

drop policy if exists materials_storage_insert_own on storage.objects;
create policy materials_storage_insert_own on storage.objects
  for insert with check (
    bucket_id = 'materials' and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );

drop policy if exists materials_storage_select_own on storage.objects;
create policy materials_storage_select_own on storage.objects
  for select using (
    bucket_id = 'materials' and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );

drop policy if exists materials_storage_delete_own on storage.objects;
create policy materials_storage_delete_own on storage.objects
  for delete using (
    bucket_id = 'materials' and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );
