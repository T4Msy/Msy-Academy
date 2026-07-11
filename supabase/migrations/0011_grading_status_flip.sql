-- ============================================================================
-- MSY Academy — Migration 0011: Fase 3 — Correção (mark submission graded).
--
-- `grades` already has working RLS insert/update policies for the owning
-- teacher (migration 0009). What's missing: nothing lets the teacher flip
-- `submissions.status` to 'GRADED' afterward — that table has no UPDATE
-- policy for anyone (by design: a client should never freely rewrite
-- submission state). This RPC is the single, narrow, verified path for that
-- one transition, and only fires once an actual grade row exists — so it
-- can't be called to fake a "graded" status with no grade behind it.
-- ============================================================================

create or replace function public.mark_submission_graded(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_owner boolean;
begin
  select exists (
    select 1 from public.submissions sub
    join public.assignments a on a.id = sub.assignment_id
    where sub.id = p_submission_id and public.is_class_owner(a.class_id)
  ) into v_is_owner;

  if not v_is_owner then
    raise exception 'Envio não encontrado ou sem permissão' using errcode = '42501';
  end if;

  if not exists (select 1 from public.grades where submission_id = p_submission_id) then
    raise exception 'É preciso salvar uma nota antes de marcar como corrigido' using errcode = 'P0002';
  end if;

  update public.submissions set status = 'GRADED' where id = p_submission_id;
end;
$$;
revoke all on function public.mark_submission_graded(uuid) from public;
grant execute on function public.mark_submission_graded(uuid) to authenticated;
