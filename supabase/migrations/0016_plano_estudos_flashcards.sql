-- ============================================================================
-- MSY Academy — Migration 0016: Fase 5 — Plano de Estudos, Flashcards.
--
-- Both are entirely student-owned (no professor visibility, no cross-tenant
-- access) — simplest RLS shape in the whole schema: owner-only, with a
-- second table (items/flashcards) scoped via the parent's ownership. No
-- owner-OR-enrolled-member pattern needed here, so no SECURITY DEFINER
-- helpers required either.
--
-- `performance_metrics`/`analytics_events` (docs/04) are deliberately NOT
-- created yet — the Fase 5 plan itself says dashboards can start as direct
-- queries over submissions/grades/study_plan_items/flashcards, with an
-- aggregation table only "if a query direta não escalar". Adding it now
-- would be schema nobody reads from yet.
-- ============================================================================

do $$ begin
  create type study_item_type as enum ('REVISAO', 'EXERCICIO', 'LEITURA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type study_item_status as enum ('PENDING', 'DONE');
exception when duplicate_object then null; end $$;

-- ── study_plans + study_plan_items ──────────────────────────────────────
create table if not exists public.study_plans (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants (id) on delete cascade,
  student_id    uuid not null references auth.users (id) on delete cascade,
  goal          text not null,
  exam_date     date,
  availability  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index if not exists study_plans_student_idx on public.study_plans (student_id, created_at desc);

drop trigger if exists study_plans_set_updated_at on public.study_plans;
create trigger study_plans_set_updated_at
  before update on public.study_plans
  for each row execute function public.set_updated_at();

alter table public.study_plans enable row level security;

drop policy if exists study_plans_select_own on public.study_plans;
create policy study_plans_select_own on public.study_plans
  for select using (student_id = auth.uid() and deleted_at is null);
drop policy if exists study_plans_insert_own on public.study_plans;
create policy study_plans_insert_own on public.study_plans
  for insert with check (student_id = auth.uid() and tenant_id = public.auth_tenant_id());

create table if not exists public.study_plan_items (
  id             uuid primary key default gen_random_uuid(),
  study_plan_id  uuid not null references public.study_plans (id) on delete cascade,
  item_date      date not null,
  topic          text not null,
  item_type      study_item_type not null default 'REVISAO',
  status         study_item_status not null default 'PENDING',
  created_at     timestamptz not null default now()
);
create index if not exists study_plan_items_plan_idx on public.study_plan_items (study_plan_id, item_date);

alter table public.study_plan_items enable row level security;

drop policy if exists study_plan_items_select_own on public.study_plan_items;
create policy study_plan_items_select_own on public.study_plan_items
  for select using (
    exists (select 1 from public.study_plans p where p.id = study_plan_id and p.student_id = auth.uid())
  );
drop policy if exists study_plan_items_insert_own on public.study_plan_items;
create policy study_plan_items_insert_own on public.study_plan_items
  for insert with check (
    exists (select 1 from public.study_plans p where p.id = study_plan_id and p.student_id = auth.uid())
  );
drop policy if exists study_plan_items_update_own on public.study_plan_items;
create policy study_plan_items_update_own on public.study_plan_items
  for update using (
    exists (select 1 from public.study_plans p where p.id = study_plan_id and p.student_id = auth.uid())
  );

-- ── flashcard_decks + flashcards ────────────────────────────────────────
create table if not exists public.flashcard_decks (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants (id) on delete cascade,
  student_id          uuid not null references auth.users (id) on delete cascade,
  title               text not null,
  source_material_id  uuid references public.materials (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index if not exists flashcard_decks_student_idx on public.flashcard_decks (student_id, created_at desc);

drop trigger if exists flashcard_decks_set_updated_at on public.flashcard_decks;
create trigger flashcard_decks_set_updated_at
  before update on public.flashcard_decks
  for each row execute function public.set_updated_at();

alter table public.flashcard_decks enable row level security;

drop policy if exists flashcard_decks_select_own on public.flashcard_decks;
create policy flashcard_decks_select_own on public.flashcard_decks
  for select using (student_id = auth.uid() and deleted_at is null);
drop policy if exists flashcard_decks_insert_own on public.flashcard_decks;
create policy flashcard_decks_insert_own on public.flashcard_decks
  for insert with check (student_id = auth.uid() and tenant_id = public.auth_tenant_id());

-- srs_state shape: { repetitions: int, interval_days: int, ease_factor: number, next_review_at: timestamptz }
create table if not exists public.flashcards (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.flashcard_decks (id) on delete cascade,
  front       text not null,
  back        text not null,
  srs_state   jsonb not null default '{"repetitions":0,"interval_days":0,"ease_factor":2.5,"next_review_at":null}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists flashcards_deck_idx on public.flashcards (deck_id);

drop trigger if exists flashcards_set_updated_at on public.flashcards;
create trigger flashcards_set_updated_at
  before update on public.flashcards
  for each row execute function public.set_updated_at();

alter table public.flashcards enable row level security;

drop policy if exists flashcards_select_own on public.flashcards;
create policy flashcards_select_own on public.flashcards
  for select using (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.student_id = auth.uid())
  );
drop policy if exists flashcards_insert_own on public.flashcards;
create policy flashcards_insert_own on public.flashcards
  for insert with check (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.student_id = auth.uid())
  );
drop policy if exists flashcards_update_own on public.flashcards;
create policy flashcards_update_own on public.flashcards
  for update using (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.student_id = auth.uid())
  );
