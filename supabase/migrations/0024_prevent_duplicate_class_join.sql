-- ============================================================================
-- MSY Academy - Migration 0024: prevent duplicate active class enrollment.
--
-- The invite-code join flow may be used from a direct link or from the
-- student's "Minhas Turmas" dialog. Rejoining a previously REMOVED enrollment
-- is allowed, but an ACTIVE enrollment returns a clear server-side error.
-- ============================================================================

create or replace function public.join_class_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_status enrollment_status;
begin
  select id into v_class_id
    from public.classes
   where invite_code = upper(trim(p_invite_code))
     and deleted_at is null;

  if v_class_id is null then
    raise exception 'Codigo de convite invalido ou turma inativa' using errcode = 'P0002';
  end if;

  select status into v_status
    from public.enrollments
   where class_id = v_class_id
     and student_id = auth.uid();

  if v_status = 'ACTIVE' then
    raise exception 'Voce ja esta matriculado nesta turma' using errcode = '23505';
  end if;

  insert into public.enrollments (class_id, student_id, status)
  values (v_class_id, auth.uid(), 'ACTIVE')
  on conflict (class_id, student_id) do update set status = 'ACTIVE';

  return v_class_id;
end;
$$;
revoke all on function public.join_class_by_invite_code(text) from public;
grant execute on function public.join_class_by_invite_code(text) to authenticated;
