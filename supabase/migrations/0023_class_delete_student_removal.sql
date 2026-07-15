-- ============================================================================
-- MSY Academy - Migration 0023: class deletion and student removal.
--
-- Both operations are exposed only through SECURITY DEFINER RPCs so the
-- authorization rule is enforced in the database: the caller must be the
-- exact owner_id of the class, not merely another user in the same tenant.
-- ============================================================================

create or replace function public.delete_class(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.classes c
   where c.id = p_class_id
     and c.owner_id = auth.uid();

  if not found then
    raise exception 'Turma nao encontrada ou sem permissao' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.delete_class(uuid) from public;
grant execute on function public.delete_class(uuid) to authenticated;

create or replace function public.remove_student_from_class(
  p_class_id uuid,
  p_student_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.enrollments e
   where e.class_id = p_class_id
     and e.student_id = p_student_id
     and exists (
       select 1
         from public.classes c
        where c.id = p_class_id
          and c.owner_id = auth.uid()
     );

  if not found then
    raise exception 'Matricula nao encontrada ou sem permissao' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.remove_student_from_class(uuid, uuid) from public;
grant execute on function public.remove_student_from_class(uuid, uuid) to authenticated;
