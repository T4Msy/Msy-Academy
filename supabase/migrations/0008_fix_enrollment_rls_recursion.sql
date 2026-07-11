-- ============================================================================
-- MSY Academy — Migration 0008: fix infinite RLS recursion between
-- `classes` and `enrollments` (introduced in 0007).
--
-- `classes` and `enrollments` policies referenced each other directly (a
-- student reads a class via their enrollment; a professor reads enrollments
-- via owning the class). Cross-referencing RLS-protected tables directly
-- inside a policy makes Postgres recursively re-evaluate both tables'
-- policies — infinite recursion (SQLSTATE 42P17), caught by a real
-- end-to-end test (a plain `select tenant_id from profiles` failed once a
-- profiles policy also joined enrollments+classes).
--
-- Fix: same pattern as `auth_tenant_id()` from migration 0001 — wrap each
-- cross-table check in its own SECURITY DEFINER function. It runs as the
-- (RLS-bypassing) function owner internally, so the check terminates
-- instead of looping back into the caller's RLS evaluation.
-- ============================================================================

create or replace function public.is_class_owner(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.tenant_id = public.auth_tenant_id()
  );
$$;

create or replace function public.is_enrolled_in_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments e
    where e.class_id = p_class_id and e.student_id = auth.uid() and e.status = 'ACTIVE'
  );
$$;

drop policy if exists classes_select_enrolled on public.classes;
create policy classes_select_enrolled on public.classes
  for select using (deleted_at is null and public.is_enrolled_in_class(id));

drop policy if exists enrollments_select_owner on public.enrollments;
create policy enrollments_select_owner on public.enrollments
  for select using (public.is_class_owner(class_id));

-- Still queries `enrollments` directly (not via a helper), but that's fine
-- now: enrollments' own SELECT policies terminate (select_own is a plain
-- column check; select_owner now calls the SECURITY DEFINER helper above).
drop policy if exists profiles_select_enrolled_student on public.profiles;
create policy profiles_select_enrolled_student on public.profiles
  for select using (
    exists (
      select 1 from public.enrollments e
      where e.student_id = profiles.id and public.is_class_owner(e.class_id)
    )
  );
