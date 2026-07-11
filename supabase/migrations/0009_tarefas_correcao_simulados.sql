-- ============================================================================
-- MSY Academy — Migration 0009: Fase 3 — Tarefas, Correção, Simulados.
-- Closes the Professor<->Aluno loop: assignments, submissions (shared by
-- both tarefas and simulados — "mesmo motor de submissão"), grades.
--
-- RLS design notes (read before touching this file):
--
-- 1. Reuses the SECURITY DEFINER helpers from 0007/0008 (`is_class_owner`,
--    `is_enrolled_in_class`) for assignments — no new recursion risk there.
--
-- 2. Aluno visibility into `exams`/`activities`/`exam_questions`/
--    `activity_items`/`questions` is scoped STRICTLY to content that has
--    actually been assigned to a class they're enrolled in — not the
--    professor's whole tenant/bank. This is a deliberate least-privilege
--    choice: a student sees only what their teacher assigned them, never
--    browses the teacher's private question bank.
--
-- 3. Simulados draw from that same assigned-content-visible pool (not a
--    broader "everything my teachers ever wrote" grant) — generation runs
--    server-side via a SECURITY DEFINER RPC (`generate_simulado`) that
--    picks eligible questions explicitly, rather than trusting the client
--    to assemble simulado_questions itself. Widening the pool (e.g. the
--    full class bank) is a follow-up policy change, not a redesign.
--
-- 4. Auto-grading of objective answers (MULTIPLA/VF) happens SERVER-SIDE in
--    `submit_submission()` — a client can INSERT its raw answer, but can
--    never set `is_correct`/`score` itself (that would be free credit).
--    DISCURSIVA answers stay ungraded until the Correção flow (professor
--    review, or an AI-suggested grade) inserts a `grades` row.
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type assignment_content_type as enum ('EXAM', 'ACTIVITY');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_status as enum ('PENDING', 'SUBMITTED', 'GRADED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type grade_source as enum ('AUTO', 'AI_SUGGESTED', 'TEACHER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type simulado_mode as enum ('MATERIA', 'DIFICULDADE', 'PERSONALIZADO');
exception when duplicate_object then null; end $$;

-- ── assignments ───────────────────────────────────────────────────────────
create table if not exists public.assignments (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  class_id       uuid not null references public.classes (id) on delete cascade,
  content_type   assignment_content_type not null,
  content_id     uuid not null,
  due_at         timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index if not exists assignments_class_active_idx
  on public.assignments (class_id, created_at desc) where deleted_at is null;

drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at
  before update on public.assignments
  for each row execute function public.set_updated_at();

alter table public.assignments enable row level security;

drop policy if exists assignments_select_owner_or_enrolled on public.assignments;
create policy assignments_select_owner_or_enrolled on public.assignments
  for select using (
    deleted_at is null and (public.is_class_owner(class_id) or public.is_enrolled_in_class(class_id))
  );

drop policy if exists assignments_insert_owner on public.assignments;
create policy assignments_insert_owner on public.assignments
  for insert with check (tenant_id = public.auth_tenant_id() and public.is_class_owner(class_id));

create or replace function public.soft_delete_assignment(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.assignments a set deleted_at = now()
   where a.id = p_assignment_id and public.is_class_owner(a.class_id) and a.deleted_at is null;
  if not found then
    raise exception 'Atribuição não encontrada ou sem permissão' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.soft_delete_assignment(uuid) from public;
grant execute on function public.soft_delete_assignment(uuid) to authenticated;

-- ── Aluno visibility into assigned exam/activity content ───────────────────
-- Additive to the owner-only policies from 0001/0005/0007 — a student sees
-- ONLY the specific exam/activity assigned to one of their classes, never
-- the teacher's broader bank.
drop policy if exists exams_select_assigned on public.exams;
create policy exams_select_assigned on public.exams
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.assignments a
      where a.content_type = 'EXAM' and a.content_id = exams.id and a.deleted_at is null
        and public.is_enrolled_in_class(a.class_id)
    )
  );

drop policy if exists activities_select_assigned on public.activities;
create policy activities_select_assigned on public.activities
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.assignments a
      where a.content_type = 'ACTIVITY' and a.content_id = activities.id and a.deleted_at is null
        and public.is_enrolled_in_class(a.class_id)
    )
  );

drop policy if exists exam_questions_select_assigned on public.exam_questions;
create policy exam_questions_select_assigned on public.exam_questions
  for select using (
    exists (
      select 1 from public.assignments a
      where a.content_type = 'EXAM' and a.content_id = exam_questions.exam_id and a.deleted_at is null
        and public.is_enrolled_in_class(a.class_id)
    )
  );

drop policy if exists activity_items_select_assigned on public.activity_items;
create policy activity_items_select_assigned on public.activity_items
  for select using (
    exists (
      select 1 from public.assignments a
      where a.content_type = 'ACTIVITY' and a.content_id = activity_items.activity_id and a.deleted_at is null
        and public.is_enrolled_in_class(a.class_id)
    )
  );

drop policy if exists questions_select_assigned on public.questions;
create policy questions_select_assigned on public.questions
  for select using (
    deleted_at is null
    and (
      exists (
        select 1 from public.exam_questions eq
        join public.assignments a on a.content_type = 'EXAM' and a.content_id = eq.exam_id and a.deleted_at is null
        where eq.question_id = questions.id and public.is_enrolled_in_class(a.class_id)
      )
      or exists (
        select 1 from public.activity_items ai
        join public.assignments a on a.content_type = 'ACTIVITY' and a.content_id = ai.activity_id and a.deleted_at is null
        where ai.question_id = questions.id and public.is_enrolled_in_class(a.class_id)
      )
    )
  );

-- ── simulados + simulado_questions (self-practice, owned by the aluno) ─────
create table if not exists public.simulados (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  student_id  uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  mode        simulado_mode not null default 'PERSONALIZADO',
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists simulados_student_idx on public.simulados (student_id, created_at desc);

alter table public.simulados enable row level security;

drop policy if exists simulados_select_own on public.simulados;
create policy simulados_select_own on public.simulados
  for select using (student_id = auth.uid() and deleted_at is null);

create table if not exists public.simulado_questions (
  simulado_id  uuid not null references public.simulados (id) on delete cascade,
  question_id  uuid not null references public.questions (id) on delete cascade,
  position     int not null,
  primary key (simulado_id, question_id)
);

alter table public.simulado_questions enable row level security;

drop policy if exists simulado_questions_select_own on public.simulado_questions;
create policy simulado_questions_select_own on public.simulado_questions
  for select using (
    exists (select 1 from public.simulados s where s.id = simulado_id and s.student_id = auth.uid())
  );

-- Generates a simulado server-side, picking from the same assigned-content-
-- visible question pool a student already has access to (see note 3 above)
-- — centralizes "which questions are eligible" instead of trusting the
-- client to assemble simulado_questions from ids it discovered elsewhere.
-- NOTE: the body below has a real bug (SELECT DISTINCT + ORDER BY random()
-- is invalid Postgres) fixed forward in migration 0010 — this file is left
-- as originally applied; see 0010 for the corrected function.
create or replace function public.generate_simulado(
  p_title      text,
  p_mode       simulado_mode,
  p_quantidade int,
  p_subject_id uuid default null,
  p_difficulty difficulty_level default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id    uuid := public.auth_tenant_id();
  v_simulado_id  uuid;
  v_question_id  uuid;
  v_position     int := 0;
begin
  insert into public.simulados (tenant_id, student_id, title, mode)
  values (v_tenant_id, auth.uid(), p_title, p_mode)
  returning id into v_simulado_id;

  for v_question_id in
    select distinct q.id
    from public.questions q
    where q.deleted_at is null
      and (p_subject_id is null or q.subject_id = p_subject_id)
      and (p_difficulty is null or q.difficulty = p_difficulty)
      and (
        exists (
          select 1 from public.exam_questions eq
          join public.assignments a on a.content_type = 'EXAM' and a.content_id = eq.exam_id and a.deleted_at is null
          where eq.question_id = q.id and public.is_enrolled_in_class(a.class_id)
        )
        or exists (
          select 1 from public.activity_items ai
          join public.assignments a on a.content_type = 'ACTIVITY' and a.content_id = ai.activity_id and a.deleted_at is null
          where ai.question_id = q.id and public.is_enrolled_in_class(a.class_id)
        )
      )
    order by random()
    limit greatest(p_quantidade, 0)
  loop
    v_position := v_position + 1;
    insert into public.simulado_questions (simulado_id, question_id, position)
    values (v_simulado_id, v_question_id, v_position);
  end loop;

  if v_position = 0 then
    raise exception 'Nenhuma questão disponível para os filtros escolhidos. Resolva ao menos uma tarefa atribuída antes de gerar um simulado.'
      using errcode = 'P0002';
  end if;

  return v_simulado_id;
end;
$$;
revoke all on function public.generate_simulado(text, simulado_mode, int, uuid, difficulty_level) from public;
grant execute on function public.generate_simulado(text, simulado_mode, int, uuid, difficulty_level) to authenticated;

-- ── submissions (shared by tarefas AND simulados) ───────────────────────────
create table if not exists public.submissions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid references public.assignments (id) on delete cascade,
  simulado_id    uuid references public.simulados (id) on delete cascade,
  student_id     uuid not null references auth.users (id) on delete cascade,
  status         submission_status not null default 'PENDING',
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint submissions_exactly_one_parent check (
    (assignment_id is not null)::int + (simulado_id is not null)::int = 1
  )
);
create index if not exists submissions_student_idx on public.submissions (student_id, created_at desc);
create unique index if not exists submissions_one_per_assignment
  on public.submissions (assignment_id, student_id) where assignment_id is not null;

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

alter table public.submissions enable row level security;

drop policy if exists submissions_select_own_or_teacher on public.submissions;
create policy submissions_select_own_or_teacher on public.submissions
  for select using (
    student_id = auth.uid()
    or exists (select 1 from public.assignments a where a.id = assignment_id and public.is_class_owner(a.class_id))
  );

drop policy if exists submissions_insert_own on public.submissions;
create policy submissions_insert_own on public.submissions
  for insert with check (
    student_id = auth.uid()
    and (
      (assignment_id is not null and exists (
        select 1 from public.assignments a where a.id = assignment_id and public.is_enrolled_in_class(a.class_id)
      ))
      or (simulado_id is not null and exists (
        select 1 from public.simulados s where s.id = simulado_id and s.student_id = auth.uid()
      ))
    )
  );

-- ── submission_answers ──────────────────────────────────────────────────────
create table if not exists public.submission_answers (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.submissions (id) on delete cascade,
  question_id    uuid not null references public.questions (id) on delete cascade,
  answer         jsonb,
  is_correct     boolean,
  score          numeric,
  created_at     timestamptz not null default now(),
  unique (submission_id, question_id)
);

alter table public.submission_answers enable row level security;

drop policy if exists submission_answers_select on public.submission_answers;
create policy submission_answers_select on public.submission_answers
  for select using (
    exists (
      select 1 from public.submissions sub
      where sub.id = submission_id
        and (
          sub.student_id = auth.uid()
          or exists (select 1 from public.assignments a where a.id = sub.assignment_id and public.is_class_owner(a.class_id))
        )
    )
  );

-- Insert only (raw answer) — is_correct/score are never client-writable;
-- submit_submission() (below) computes and stores them server-side.
drop policy if exists submission_answers_insert_own on public.submission_answers;
create policy submission_answers_insert_own on public.submission_answers
  for insert with check (
    exists (select 1 from public.submissions sub where sub.id = submission_id and sub.student_id = auth.uid())
  );

-- ── grades ───────────────────────────────────────────────────────────────
create table if not exists public.grades (
  submission_id  uuid primary key references public.submissions (id) on delete cascade,
  total_score    numeric not null default 0,
  feedback       text,
  graded_by      grade_source not null default 'AUTO',
  reviewed_by    uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists grades_set_updated_at on public.grades;
create trigger grades_set_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();

alter table public.grades enable row level security;

drop policy if exists grades_select_own_or_teacher on public.grades;
create policy grades_select_own_or_teacher on public.grades
  for select using (
    exists (
      select 1 from public.submissions sub
      where sub.id = submission_id
        and (
          sub.student_id = auth.uid()
          or exists (select 1 from public.assignments a where a.id = sub.assignment_id and public.is_class_owner(a.class_id))
        )
    )
  );

-- Teacher inserts/updates a grade (approve/edit an AI-suggested grade, or
-- grade manually) — restricted to submissions of assignments they own.
drop policy if exists grades_insert_teacher on public.grades;
create policy grades_insert_teacher on public.grades
  for insert with check (
    exists (
      select 1 from public.submissions sub
      join public.assignments a on a.id = sub.assignment_id
      where sub.id = submission_id and public.is_class_owner(a.class_id)
    )
  );

drop policy if exists grades_update_teacher on public.grades;
create policy grades_update_teacher on public.grades
  for update using (
    exists (
      select 1 from public.submissions sub
      join public.assignments a on a.id = sub.assignment_id
      where sub.id = submission_id and public.is_class_owner(a.class_id)
    )
  );

-- ── submit_submission: server-side auto-grading (never trust client scores) ─
create or replace function public.submit_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_all_objective boolean;
  v_total numeric;
begin
  if not exists (select 1 from public.submissions where id = p_submission_id and student_id = auth.uid()) then
    raise exception 'Envio não encontrado ou sem permissão' using errcode = '42501';
  end if;

  -- Objective types (MULTIPLA/VF): compare answer to the question's
  -- correct_answer and score 1/0. DISCURSIVA stays ungraded (null) —
  -- pending human/IA review in the Correção flow.
  update public.submission_answers sa
     set is_correct = (q.type in ('MULTIPLA', 'VF') and sa.answer = q.correct_answer),
         score = case when q.type in ('MULTIPLA', 'VF') and sa.answer = q.correct_answer then 1 else 0 end
    from public.questions q
   where sa.question_id = q.id and sa.submission_id = p_submission_id and q.type in ('MULTIPLA', 'VF');

  update public.submissions
     set status = 'SUBMITTED', submitted_at = now()
   where id = p_submission_id;

  select not exists (
    select 1 from public.submission_answers sa
    join public.questions q on q.id = sa.question_id
    where sa.submission_id = p_submission_id and q.type = 'DISCURSIVA'
  ) into v_all_objective;

  if v_all_objective then
    select coalesce(sum(score), 0) into v_total from public.submission_answers where submission_id = p_submission_id;
    insert into public.grades (submission_id, total_score, graded_by)
    values (p_submission_id, v_total, 'AUTO')
    on conflict (submission_id) do update set total_score = excluded.total_score, graded_by = 'AUTO';

    update public.submissions set status = 'GRADED' where id = p_submission_id;
  end if;
end;
$$;
revoke all on function public.submit_submission(uuid) from public;
grant execute on function public.submit_submission(uuid) to authenticated;
