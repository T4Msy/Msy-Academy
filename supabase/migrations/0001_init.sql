-- ============================================================================
-- MSY Academy — Migration 0001: Foundation (Slice 1)
-- Subset of the target schema in docs/04-banco-de-dados.md needed for the MVP
-- vertical slice: tenants, profiles, user_roles, exams — all multi-tenant with
-- Row-Level Security. A trigger provisions a tenant + professor profile on
-- signup.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type tenant_type as enum ('INDIVIDUAL', 'SCHOOL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('PROFESSOR', 'ALUNO', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type exam_status as enum ('DRAFT', 'READY', 'ARCHIVED');
exception when duplicate_object then null; end $$;

-- ── Tables ──────────────────────────────────────────────────────────────────

-- A tenant is an account: an individual professor or a school.
create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        tenant_type not null default 'INDIVIDUAL',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One profile per auth user, bound to a tenant.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);

-- A user may hold more than one role.
create table if not exists public.user_roles (
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        app_role not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, role)
);

-- Exams (subset of docs/04). Stores the AI generation params (JSONB, 1:1 with
-- buildExamParams) plus the generated HTML for now (structured questions are a
-- fast-follow — see docs/12-adr-stack.md).
create table if not exists public.exams (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants (id) on delete cascade,
  author_id           uuid not null references auth.users (id) on delete cascade,
  title               text not null,
  course              text,
  style               text,
  generation_params   jsonb not null default '{}'::jsonb,
  generated_html      text not null default '',
  include_answer_key  boolean not null default true,
  status              exam_status not null default 'READY',
  ai_provider         text,
  ai_model            text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index if not exists exams_tenant_id_idx on public.exams (tenant_id);
create index if not exists exams_author_id_idx on public.exams (author_id);

-- ── Helper: the caller's tenant ─────────────────────────────────────────────
create or replace function public.auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- ── Signup trigger: provision tenant + profile + PROFESSOR role ──────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  display_name  text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.tenants (name, type)
  values (display_name, 'INDIVIDUAL')
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, full_name)
  values (new.id, new_tenant_id, display_name);

  insert into public.user_roles (user_id, role)
  values (new.id, 'PROFESSOR');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.tenants     enable row level security;
alter table public.profiles    enable row level security;
alter table public.user_roles  enable row level security;
alter table public.exams       enable row level security;

-- tenants: a user sees only their own tenant.
drop policy if exists tenants_select_own on public.tenants;
create policy tenants_select_own on public.tenants
  for select using (id = public.auth_tenant_id());

-- profiles: a user reads/updates only their own profile.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- user_roles: a user reads only their own roles.
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
  for select using (user_id = auth.uid());

-- exams: scoped to the caller's tenant; writes require authorship.
drop policy if exists exams_select_tenant on public.exams;
create policy exams_select_tenant on public.exams
  for select using (tenant_id = public.auth_tenant_id() and deleted_at is null);

drop policy if exists exams_insert_own on public.exams;
create policy exams_insert_own on public.exams
  for insert with check (
    tenant_id = public.auth_tenant_id() and author_id = auth.uid()
  );

drop policy if exists exams_update_own on public.exams;
create policy exams_update_own on public.exams
  for update using (
    tenant_id = public.auth_tenant_id() and author_id = auth.uid()
  ) with check (
    tenant_id = public.auth_tenant_id() and author_id = auth.uid()
  );
