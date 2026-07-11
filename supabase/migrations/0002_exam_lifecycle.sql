-- ============================================================================
-- MSY Academy — Migration 0002: Exam lifecycle (rename / duplicate / soft-delete)
-- No new tables: the lifecycle rides on the existing `exams` policies.
--   • rename / duplicate  → `exams_update_own` / `exams_insert_own` (0001)
--   • soft-delete         → set `deleted_at`; `exams_select_tenant` (0001) already
--     filters `deleted_at is null`, so the row disappears with no extra policy.
-- This migration adds the plumbing that makes those flows correct and fast:
--   1. keep `updated_at` fresh on every write (rename/duplicate touch it);
--   2. a partial index for the common "active exams of a tenant" listing.
-- ============================================================================

-- ── Keep updated_at fresh ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists exams_set_updated_at on public.exams;
create trigger exams_set_updated_at
  before update on public.exams
  for each row execute function public.set_updated_at();

-- ── Fast listing of a tenant's non-deleted exams (dashboard) ─────────────────
create index if not exists exams_tenant_active_idx
  on public.exams (tenant_id, created_at desc)
  where deleted_at is null;
