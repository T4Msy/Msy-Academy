-- Estudo Animado / Missão do Saber. Answer keys are deliberately separated
-- from the player-visible run so the browser never receives the gabarito.

do $$ begin
  create type study_game_run_status as enum ('ACTIVE', 'WON', 'LOST', 'ABANDONED');
exception when duplicate_object then null; end $$;

create table if not exists public.study_game_profiles (
  student_id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  total_games integer not null default 0 check (total_games >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_played_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_game_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  topic text not null,
  questions jsonb not null,
  status study_game_run_status not null default 'ACTIVE',
  current_question_index integer not null default 0,
  score integer not null default 0 check (score >= 0),
  combo integer not null default 0 check (combo >= 0),
  lives_remaining integer not null default 3 check (lives_remaining between 0 and 3),
  correct_count integer not null default 0 check (correct_count >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists study_game_runs_student_idx on public.study_game_runs (student_id, started_at desc);

create table if not exists public.study_game_answer_keys (
  run_id uuid not null references public.study_game_runs (id) on delete cascade,
  question_index integer not null,
  correct_answer text not null,
  explanation text,
  primary key (run_id, question_index)
);

create table if not exists public.study_game_subject_records (
  student_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  subject text not null,
  best_score integer not null default 0 check (best_score >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  best_combo integer not null default 0 check (best_combo >= 0),
  updated_at timestamptz not null default now(),
  primary key (student_id, subject)
);

alter table public.study_game_profiles enable row level security;
alter table public.study_game_runs enable row level security;
alter table public.study_game_answer_keys enable row level security;
alter table public.study_game_subject_records enable row level security;

create policy study_game_profiles_select_own on public.study_game_profiles
  for select using (student_id = auth.uid() and tenant_id = public.auth_tenant_id());
create policy study_game_runs_select_own on public.study_game_runs
  for select using (student_id = auth.uid() and tenant_id = public.auth_tenant_id());
create policy study_game_subject_records_select_own on public.study_game_subject_records
  for select using (student_id = auth.uid() and tenant_id = public.auth_tenant_id());

-- No client policy is granted for answer keys or writes. Server Actions use the
-- service role only after checking the authenticated student and tenant.
