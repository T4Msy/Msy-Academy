-- ============================================================================
-- MSY Academy — Migration 0013: fix aluno access to class-attached materials
-- (and their chunks) — introduced in 0012.
--
-- `material_chunks_select_enrolled` (0012) does `exists (select 1 from
-- materials m where ...)` — but that subquery is itself subject to
-- `materials`' OWN RLS for the calling aluno. Since `materials` only had an
-- owner-only policy (migration 0007), the aluno's subquery silently saw zero
-- rows, so the exists() always evaluated false — chunks were unreachable
-- even though is_enrolled_in_class() alone returned true when called
-- directly. Caught by a real end-to-end test, not the migration apply.
--
-- Fix: add the missing owner-OR-enrolled-member SELECT policy on `materials`
-- itself (same pattern as exams_select_assigned/activities_select_assigned,
-- migration 0009). Once the aluno's RLS view of `materials` includes
-- class-attached rows, the existing exists() subquery in
-- material_chunks_select_enrolled starts succeeding — no change needed
-- there.
-- ============================================================================

drop policy if exists materials_select_enrolled on public.materials;
create policy materials_select_enrolled on public.materials
  for select using (
    deleted_at is null and class_id is not null and public.is_enrolled_in_class(class_id)
  );
