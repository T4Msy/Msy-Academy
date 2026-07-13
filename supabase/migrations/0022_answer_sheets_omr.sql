-- ============================================================================
-- MSY Academy — Migration 0022: Correção automática de gabarito (OMR).
--
-- Paper-based multiple-choice grading: a teacher generates one printable
-- answer sheet ("gabarito") per enrolled student for an EXAM assignment,
-- students bubble in A-E answers by hand, the teacher photographs each
-- filled sheet and the server-side OMR pipeline (lib/omr/*) detects which
-- bubbles are marked and turns that into real submissions/submission_answers
-- rows — reusing the exact scoring semantics `submit_submission()` (0009)
-- already established for digital submissions.
--
-- RLS design notes:
--
-- 1. `answer_sheets` / `answer_sheet_scans` are both scoped to the owning
--    teacher only (via `is_class_owner`, 0008) — students never interact
--    with these tables directly; they fill in paper, not a form.
--
-- 2. `confirm_answer_sheet_scan()` is SECURITY DEFINER because it writes
--    `submissions`/`submission_answers` on behalf of a student who never
--    authenticates for this flow — the existing `submissions_insert_own`/
--    `submission_answers_insert_own` policies (0009) require
--    `student_id = auth.uid()`, which cannot hold here by design. This
--    function is the one deliberate, audited bypass: it re-validates the
--    caller owns the assignment's class before writing anything.
--
-- 3. Scoring logic is intentionally duplicated from `submit_submission()`
--    rather than calling it, since that function hard-requires
--    `student_id = auth.uid()` too. Keep both in sync if grading semantics
--    change (both only ever score MULTIPLA/VF against `correct_answer`).
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type scan_status as enum ('PROCESSING', 'NEEDS_REVIEW', 'CONFIRMED', 'FAILED');
exception when duplicate_object then null; end $$;

-- ── answer_sheets: one pre-generated sheet per (assignment, student) ───────
-- Created (idempotently) right before printing, so the QR code printed on
-- each sheet can encode a stable id that already exists.
create table if not exists public.answer_sheets (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  assignment_id  uuid not null references public.assignments (id) on delete cascade,
  student_id     uuid not null references auth.users (id) on delete cascade,
  question_count int not null check (question_count > 0),
  created_at     timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index if not exists answer_sheets_assignment_idx on public.answer_sheets (assignment_id);

alter table public.answer_sheets enable row level security;

drop policy if exists answer_sheets_select_owner on public.answer_sheets;
create policy answer_sheets_select_owner on public.answer_sheets
  for select using (
    exists (select 1 from public.assignments a where a.id = assignment_id and public.is_class_owner(a.class_id))
  );

drop policy if exists answer_sheets_insert_owner on public.answer_sheets;
create policy answer_sheets_insert_owner on public.answer_sheets
  for insert with check (
    tenant_id = public.auth_tenant_id()
    and exists (select 1 from public.assignments a where a.id = assignment_id and public.is_class_owner(a.class_id))
  );

-- ── answer_sheet_scans: one row per uploaded photo/attempt ─────────────────
create table if not exists public.answer_sheet_scans (
  id               uuid primary key default gen_random_uuid(),
  answer_sheet_id  uuid not null references public.answer_sheets (id) on delete cascade,
  storage_path     text not null,
  -- detected_answers: { "<question_id>": "A" } — keyed by question_id,
  -- values match the same option-id format as questions.correct_answer so
  -- confirm_answer_sheet_scan() can compare them directly.
  detected_answers jsonb,
  confidence       jsonb,
  status           scan_status not null default 'PROCESSING',
  error_message    text,
  created_at       timestamptz not null default now(),
  confirmed_at     timestamptz,
  confirmed_by     uuid references auth.users (id) on delete set null
);
create index if not exists answer_sheet_scans_sheet_idx on public.answer_sheet_scans (answer_sheet_id, created_at desc);

alter table public.answer_sheet_scans enable row level security;

drop policy if exists answer_sheet_scans_select_owner on public.answer_sheet_scans;
create policy answer_sheet_scans_select_owner on public.answer_sheet_scans
  for select using (
    exists (
      select 1 from public.answer_sheets ans
      join public.assignments a on a.id = ans.assignment_id
      where ans.id = answer_sheet_id and public.is_class_owner(a.class_id)
    )
  );

drop policy if exists answer_sheet_scans_insert_owner on public.answer_sheet_scans;
create policy answer_sheet_scans_insert_owner on public.answer_sheet_scans
  for insert with check (
    exists (
      select 1 from public.answer_sheets ans
      join public.assignments a on a.id = ans.assignment_id
      where ans.id = answer_sheet_id and public.is_class_owner(a.class_id)
    )
  );

-- update: only the server-side pipeline (via the service-role client) and
-- confirm_answer_sheet_scan() write to this table after insert; no direct
-- client update policy is granted — the processing route uses
-- createAdminClient() (service role, bypasses RLS) to write detected_answers.

-- ── Storage bucket for scan photos ──────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('answer-sheet-scans', 'answer-sheet-scans', false, 8388608, array['image/jpeg'])
on conflict (id) do update set file_size_limit = 8388608, allowed_mime_types = array['image/jpeg'];

drop policy if exists answer_sheet_scans_storage_insert_owner on storage.objects;
create policy answer_sheet_scans_storage_insert_owner on storage.objects
  for insert with check (
    bucket_id = 'answer-sheet-scans' and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );

drop policy if exists answer_sheet_scans_storage_select_owner on storage.objects;
create policy answer_sheet_scans_storage_select_owner on storage.objects
  for select using (
    bucket_id = 'answer-sheet-scans' and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );

drop policy if exists answer_sheet_scans_storage_delete_owner on storage.objects;
create policy answer_sheet_scans_storage_delete_owner on storage.objects
  for delete using (
    bucket_id = 'answer-sheet-scans' and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );

-- ── confirm_answer_sheet_scan: teacher confirms detected answers ──────────
-- Upserts submissions + submission_answers from a scan's detected_answers,
-- scores objective answers the same way submit_submission() does, and
-- marks the scan CONFIRMED. p_overrides lets the teacher correct individual
-- questions in the review screen before confirming (merged over
-- detected_answers, same { "<question_id>": "A" } shape).
create or replace function public.confirm_answer_sheet_scan(
  p_scan_id   uuid,
  p_overrides jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_answer_sheet_id uuid;
  v_assignment_id   uuid;
  v_student_id      uuid;
  v_class_id        uuid;
  v_answers         jsonb;
  v_submission_id   uuid;
  v_question_id     uuid;
  v_answer          text;
  v_all_objective   boolean;
  v_total           numeric;
begin
  select ans.id, ans.assignment_id, ans.student_id, a.class_id, coalesce(s.detected_answers, '{}'::jsonb) || p_overrides
    into v_answer_sheet_id, v_assignment_id, v_student_id, v_class_id, v_answers
  from public.answer_sheet_scans s
  join public.answer_sheets ans on ans.id = s.answer_sheet_id
  join public.assignments a on a.id = ans.assignment_id
  where s.id = p_scan_id;

  if v_answer_sheet_id is null then
    raise exception 'Digitalização não encontrada' using errcode = '42501';
  end if;
  if not public.is_class_owner(v_class_id) then
    raise exception 'Sem permissão para confirmar esta digitalização' using errcode = '42501';
  end if;

  insert into public.submissions (assignment_id, student_id, status)
  values (v_assignment_id, v_student_id, 'PENDING')
  on conflict (assignment_id, student_id) where assignment_id is not null
  do update set updated_at = submissions.updated_at
  returning id into v_submission_id;

  for v_question_id, v_answer in select key::uuid, value #>> '{}' from jsonb_each(v_answers)
  loop
    insert into public.submission_answers (submission_id, question_id, answer)
    values (v_submission_id, v_question_id, to_jsonb(v_answer))
    on conflict (submission_id, question_id) do update set answer = excluded.answer;
  end loop;

  update public.submission_answers sa
     set is_correct = (q.type in ('MULTIPLA', 'VF') and sa.answer = q.correct_answer),
         score = case when q.type in ('MULTIPLA', 'VF') and sa.answer = q.correct_answer then 1 else 0 end
    from public.questions q
   where sa.question_id = q.id and sa.submission_id = v_submission_id and q.type in ('MULTIPLA', 'VF');

  update public.submissions set status = 'SUBMITTED', submitted_at = now() where id = v_submission_id;

  select not exists (
    select 1 from public.submission_answers sa
    join public.questions q on q.id = sa.question_id
    where sa.submission_id = v_submission_id and q.type = 'DISCURSIVA'
  ) into v_all_objective;

  if v_all_objective then
    select coalesce(sum(score), 0) into v_total from public.submission_answers where submission_id = v_submission_id;
    insert into public.grades (submission_id, total_score, graded_by)
    values (v_submission_id, v_total, 'AUTO')
    on conflict (submission_id) do update set total_score = excluded.total_score, graded_by = 'AUTO';

    update public.submissions set status = 'GRADED' where id = v_submission_id;
  end if;

  update public.answer_sheet_scans
     set status = 'CONFIRMED', confirmed_at = now(), confirmed_by = auth.uid()
   where id = p_scan_id;

  return v_submission_id;
end;
$$;
revoke all on function public.confirm_answer_sheet_scan(uuid, jsonb) from public;
grant execute on function public.confirm_answer_sheet_scan(uuid, jsonb) to authenticated;
