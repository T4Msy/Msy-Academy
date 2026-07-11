-- ============================================================================
-- MSY Academy — Migration 0003: soft-delete via SECURITY DEFINER
-- The `exams_select_tenant` policy (0001) filters `deleted_at is null`. Postgres
-- enforces the SELECT policy as a WITH CHECK on any UPDATE that returns rows, so
-- a plain `update exams set deleted_at = now()` fails with 42501 — the new row
-- is "invisible" to SELECT. Rather than weaken the SELECT policy (which would let
-- clients read deleted rows), soft-delete runs through this definer function,
-- which bypasses RLS internally while still verifying authorship via auth.uid().
-- ============================================================================

create or replace function public.soft_delete_exam(p_exam_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.exams
     set deleted_at = now()
   where id = p_exam_id
     and author_id = auth.uid()
     and deleted_at is null;

  if not found then
    raise exception 'Prova não encontrada ou sem permissão'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.soft_delete_exam(uuid) from public;
grant execute on function public.soft_delete_exam(uuid) to authenticated;
