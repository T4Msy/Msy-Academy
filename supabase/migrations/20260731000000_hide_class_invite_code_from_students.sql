-- Students must never receive a class invite code after enrollment.
-- They read a deliberately restricted projection through this RPC instead
-- of selecting the full `classes` row.
create or replace function public.student_visible_classes()
returns table (
  id uuid,
  name text,
  subject_id uuid,
  grade_level_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.subject_id, c.grade_level_id, c.created_at, c.updated_at
  from public.classes c
  join public.enrollments e on e.class_id = c.id
  where e.student_id = auth.uid()
    and e.status = 'ACTIVE'
    and c.deleted_at is null
  order by e.created_at desc;
$$;

revoke all on function public.student_visible_classes() from public;
grant execute on function public.student_visible_classes() to authenticated;

-- An enrolled student previously received the entire row, including
-- `invite_code`, through this policy. Safe class metadata remains available
-- through `student_visible_classes()`. Teacher/owner access is unchanged.
drop policy if exists classes_select_enrolled on public.classes;
