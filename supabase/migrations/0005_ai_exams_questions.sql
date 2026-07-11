-- ============================================================================
-- MSY Academy — Migration 0005: Fase 1 — AI Orchestration embrionária,
-- provas estruturadas, Banco de Questões.
--
-- Reshapes `exams` (from 0001) away from "HTML cru gerado pela IA" (DT-06,
-- risco de XSS) towards dados estruturados: cada prova passa a ser uma lista
-- ordenada de `questions` via `exam_questions`, reutilizável entre provas —
-- o Banco de Questões nasce disso de graça, sem tabela própria de "banco".
--
-- `questions` segue as house rules de 0001/0003/0004: RLS habilitado no
-- mesmo commit, soft-delete via função SECURITY DEFINER (não UPDATE direto —
-- ver o comentário em soft_delete_exam de 0003 para o porquê).
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type question_type as enum ('MULTIPLA', 'VF', 'DISCURSIVA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type difficulty_level as enum ('FACIL', 'MEDIO', 'DIFICIL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ai_task as enum (
    'EXAM_GEN', 'ACTIVITY_GEN', 'LESSON_PLAN', 'TUTOR', 'GRADING', 'FLASHCARDS', 'STUDY_PLAN'
  );
exception when duplicate_object then null; end $$;

-- ── Reference tables (global, read-only for clients) ─────────────────────────
create table if not exists public.subjects (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);

create table if not exists public.grade_levels (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  sort_order int not null default 0
);

insert into public.subjects (name) values
  ('Matemática'), ('Português'), ('Biologia'), ('Química'), ('Física'),
  ('História'), ('Geografia'), ('Inglês'), ('Filosofia'), ('Sociologia'),
  ('Educação Física'), ('Artes'), ('Informática'), ('Redação')
on conflict (name) do nothing;

insert into public.grade_levels (name, sort_order) values
  ('Infantil', 1), ('Fundamental I', 2), ('Fundamental II', 3),
  ('Ensino Médio', 4), ('Técnico', 5), ('Graduação', 6), ('Concurso', 7)
on conflict (name) do nothing;

alter table public.subjects enable row level security;
alter table public.grade_levels enable row level security;

drop policy if exists subjects_select_all on public.subjects;
create policy subjects_select_all on public.subjects for select using (true);

drop policy if exists grade_levels_select_all on public.grade_levels;
create policy grade_levels_select_all on public.grade_levels for select using (true);

-- ── questions: Banco de Questões (reutilizável entre provas/atividades) ─────
create table if not exists public.questions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  author_id       uuid not null references auth.users (id) on delete cascade,
  subject_id      uuid references public.subjects (id),
  grade_level_id  uuid references public.grade_levels (id),
  type            question_type not null,
  difficulty      difficulty_level not null default 'MEDIO',
  statement       text not null,
  options         jsonb,
  correct_answer  jsonb not null,
  explanation     text,
  tags            text[] not null default '{}',
  ai_provider     text,
  ai_model        text,
  prompt_version  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists questions_tenant_active_idx
  on public.questions (tenant_id, created_at desc) where deleted_at is null;
create index if not exists questions_tags_idx on public.questions using gin (tags);

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

alter table public.questions enable row level security;

drop policy if exists questions_select_tenant on public.questions;
create policy questions_select_tenant on public.questions
  for select using (tenant_id = public.auth_tenant_id() and deleted_at is null);

drop policy if exists questions_insert_own on public.questions;
create policy questions_insert_own on public.questions
  for insert with check (tenant_id = public.auth_tenant_id() and author_id = auth.uid());

drop policy if exists questions_update_own on public.questions;
create policy questions_update_own on public.questions
  for update using (tenant_id = public.auth_tenant_id() and author_id = auth.uid())
  with check (tenant_id = public.auth_tenant_id() and author_id = auth.uid());

-- Soft-delete via SECURITY DEFINER (mesma armadilha 42501 documentada em
-- soft_delete_exam, 0003: um UPDATE direto que torna a linha invisível ao
-- SELECT viola a própria policy de SELECT).
create or replace function public.soft_delete_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.questions
     set deleted_at = now()
   where id = p_question_id
     and author_id = auth.uid()
     and deleted_at is null;

  if not found then
    raise exception 'Questão não encontrada ou sem permissão'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.soft_delete_question(uuid) from public;
grant execute on function public.soft_delete_question(uuid) to authenticated;

-- ── exams: reshape away from HTML cru (DT-06) ────────────────────────────────
alter table public.exams drop column if exists generated_html;
alter table public.exams add column if not exists subject_id uuid references public.subjects (id);
alter table public.exams add column if not exists grade_level_id uuid references public.grade_levels (id);
alter table public.exams add column if not exists version int not null default 1;

-- ── exam_questions: ordena questões dentro de uma prova (N:N) ───────────────
create table if not exists public.exam_questions (
  exam_id      uuid not null references public.exams (id) on delete cascade,
  question_id  uuid not null references public.questions (id) on delete cascade,
  position     int not null,
  points       numeric not null default 1,
  primary key (exam_id, question_id)
);
create index if not exists exam_questions_exam_idx on public.exam_questions (exam_id, position);

alter table public.exam_questions enable row level security;

drop policy if exists exam_questions_select_tenant on public.exam_questions;
create policy exam_questions_select_tenant on public.exam_questions
  for select using (
    exists (
      select 1 from public.exams e
      where e.id = exam_id and e.tenant_id = public.auth_tenant_id() and e.deleted_at is null
    )
  );

drop policy if exists exam_questions_insert_own on public.exam_questions;
create policy exam_questions_insert_own on public.exam_questions
  for insert with check (
    exists (
      select 1 from public.exams e
      where e.id = exam_id and e.tenant_id = public.auth_tenant_id() and e.author_id = auth.uid()
    )
  );

drop policy if exists exam_questions_update_own on public.exam_questions;
create policy exam_questions_update_own on public.exam_questions
  for update using (
    exists (
      select 1 from public.exams e
      where e.id = exam_id and e.tenant_id = public.auth_tenant_id() and e.author_id = auth.uid()
    )
  );

drop policy if exists exam_questions_delete_own on public.exam_questions;
create policy exam_questions_delete_own on public.exam_questions
  for delete using (
    exists (
      select 1 from public.exams e
      where e.id = exam_id and e.tenant_id = public.auth_tenant_id() and e.author_id = auth.uid()
    )
  );

-- ── ai_interactions: log de toda chamada de IA (orchestrator escreve) ───────
create table if not exists public.ai_interactions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  user_id         uuid references auth.users (id) on delete set null,
  feature         ai_task not null,
  provider        text not null,
  model           text,
  prompt_version  text,
  input           jsonb,
  output          jsonb,
  tokens_in       int not null default 0,
  tokens_out      int not null default 0,
  cost_cents      int not null default 0,
  latency_ms      int,
  created_at      timestamptz not null default now()
);
create index if not exists ai_interactions_tenant_idx on public.ai_interactions (tenant_id, created_at desc);

alter table public.ai_interactions enable row level security;

-- Leitura: só o próprio tenant. Sem policy de insert/update para
-- `authenticated` — escrita é sempre via orchestrator (service role).
drop policy if exists ai_interactions_select_own on public.ai_interactions;
create policy ai_interactions_select_own on public.ai_interactions
  for select using (tenant_id = public.auth_tenant_id());

-- ── prompt_templates: catálogo de prompts versionados (RF-IA03) ─────────────
-- Schema à frente do uso: nesta fase os prompts vivem em lib/ai/prompts/*.ts;
-- esta tabela é a base para versionamento/A-B editável por admin depois.
create table if not exists public.prompt_templates (
  id          uuid primary key default gen_random_uuid(),
  feature     ai_task not null,
  version     text not null,
  content     text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (feature, version)
);

alter table public.prompt_templates enable row level security;

drop policy if exists prompt_templates_select_all on public.prompt_templates;
create policy prompt_templates_select_all on public.prompt_templates
  for select using (true);
