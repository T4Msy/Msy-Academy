-- Destinatários explícitos para atribuições de provas e atividades.
-- A ausência de linhas em assignment_students representa a atribuição legada
-- para a turma inteira (audience_type = 'class').

alter table public.assignments
  add column if not exists audience_type text not null default 'class',
  add column if not exists application_type text not null default 'regular',
  add column if not exists starts_at timestamptz,
  add column if not exists instructions text;

alter table public.assignments
  drop constraint if exists assignments_audience_type_check;
alter table public.assignments
  add constraint assignments_audience_type_check check (audience_type in ('class', 'students'));

create table if not exists public.assignment_students (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);
create index if not exists assignment_students_student_idx
  on public.assignment_students (student_id, assignment_id);

alter table public.assignment_students enable row level security;
drop policy if exists assignment_students_select_own_or_teacher on public.assignment_students;
create policy assignment_students_select_own_or_teacher on public.assignment_students
  for select using (
    student_id = auth.uid()
    or exists (select 1 from public.assignments a where a.id = assignment_id and public.is_class_owner(a.class_id))
  );

create or replace function public.assignment_visible_to_current_student(p_assignment_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assignments a
    where a.id = p_assignment_id and a.deleted_at is null
      and (
        (a.audience_type = 'class' and public.is_enrolled_in_class(a.class_id))
        or (a.audience_type = 'students' and exists (
          select 1 from public.assignment_students ast
          where ast.assignment_id = a.id and ast.student_id = auth.uid()
        ))
      )
  );
$$;

drop policy if exists assignments_select_owner_or_enrolled on public.assignments;
create policy assignments_select_owner_or_enrolled on public.assignments
  for select using (
    deleted_at is null and (public.is_class_owner(class_id) or public.assignment_visible_to_current_student(id))
  );

-- Retorna apenas alunos ativos da turma, para uso tanto pelo servidor quanto
-- por consultas autenticadas do professor.
drop policy if exists profiles_select_enrolled_student on public.profiles;
create policy profiles_select_enrolled_student on public.profiles
  for select using (
    exists (
      select 1 from public.enrollments e
      join public.classes c on c.id = e.class_id
      where e.student_id = profiles.id and e.status = 'ACTIVE'
        and c.owner_id = auth.uid() and c.deleted_at is null
    )
  );

create or replace function public.create_assignment(
  p_class_id uuid,
  p_content_type assignment_content_type,
  p_content_id uuid,
  p_audience_type text,
  p_student_ids uuid[],
  p_due_at timestamptz,
  p_starts_at timestamptz default null,
  p_application_type text default 'regular',
  p_instructions text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_assignment_id uuid;
  v_tenant_id uuid;
  v_student_count int;
begin
  if not public.is_class_owner(p_class_id) then
    raise exception 'Turma inexistente ou sem permissão' using errcode = '42501';
  end if;
  select tenant_id into v_tenant_id from public.classes
    where id = p_class_id and deleted_at is null;
  if v_tenant_id is null then raise exception 'Turma inexistente ou inativa'; end if;
  if p_audience_type not in ('class', 'students') then raise exception 'Destinatários inválidos'; end if;
  if p_audience_type = 'students' and coalesce(array_length(p_student_ids, 1), 0) = 0 then
    raise exception 'Selecione pelo menos um aluno';
  end if;
  if p_audience_type = 'class' and coalesce(array_length(p_student_ids, 1), 0) <> 0 then
    raise exception 'Destinatários incompatíveis';
  end if;
  if p_audience_type = 'students' then
    select count(*) into v_student_count
      from public.enrollments
      where class_id = p_class_id and status = 'ACTIVE'
        and student_id = any(p_student_ids);
    if v_student_count <> (select count(distinct x) from unnest(p_student_ids) x) then
      raise exception 'Todos os alunos precisam estar ativos na turma';
    end if;
  end if;
  if exists (
    select 1 from public.assignments a
    where a.class_id = p_class_id and a.content_type = p_content_type
      and a.content_id = p_content_id and a.audience_type = p_audience_type
      and a.application_type = coalesce(p_application_type, 'regular')
      and a.due_at is not distinct from p_due_at and a.deleted_at is null
      and (p_audience_type = 'class' or exists (
        select 1 from public.assignment_students old
        where old.assignment_id = a.id
        group by old.assignment_id
        having array_agg(old.student_id order by old.student_id) =
          (select array_agg(x order by x) from unnest(p_student_ids) x)
      ))
  ) then raise exception 'Esta atribuição idêntica já existe'; end if;

  insert into public.assignments
    (tenant_id, class_id, content_type, content_id, due_at, starts_at, audience_type, application_type, instructions)
  values
    (v_tenant_id, p_class_id, p_content_type, p_content_id, p_due_at, p_starts_at,
     p_audience_type, coalesce(p_application_type, 'regular'), p_instructions)
  returning id into v_assignment_id;

  if p_audience_type = 'students' then
    insert into public.assignment_students (assignment_id, student_id)
      select v_assignment_id, x from unnest(p_student_ids) x;
  end if;
  return v_assignment_id;
end;
$$;
revoke all on function public.create_assignment(uuid, assignment_content_type, uuid, text, uuid[], timestamptz, timestamptz, text, text) from public;
grant execute on function public.create_assignment(uuid, assignment_content_type, uuid, text, uuid[], timestamptz, timestamptz, text, text) to authenticated;

-- Conteúdo e submissões usam a mesma regra de visibilidade da atribuição.
drop policy if exists exams_select_assigned on public.exams;
create policy exams_select_assigned on public.exams for select using (
  deleted_at is null and exists (select 1 from public.assignments a where a.content_type = 'EXAM' and a.content_id = exams.id and public.assignment_visible_to_current_student(a.id))
);
drop policy if exists activities_select_assigned on public.activities;
create policy activities_select_assigned on public.activities for select using (
  deleted_at is null and exists (select 1 from public.assignments a where a.content_type = 'ACTIVITY' and a.content_id = activities.id and public.assignment_visible_to_current_student(a.id))
);
drop policy if exists exam_questions_select_assigned on public.exam_questions;
create policy exam_questions_select_assigned on public.exam_questions for select using (
  exists (select 1 from public.assignments a where a.content_type = 'EXAM' and a.content_id = exam_questions.exam_id and public.assignment_visible_to_current_student(a.id))
);
drop policy if exists activity_items_select_assigned on public.activity_items;
create policy activity_items_select_assigned on public.activity_items for select using (
  exists (select 1 from public.assignments a where a.content_type = 'ACTIVITY' and a.content_id = activity_items.activity_id and public.assignment_visible_to_current_student(a.id))
);
drop policy if exists questions_select_assigned on public.questions;
create policy questions_select_assigned on public.questions for select using (
  deleted_at is null and (
    exists (select 1 from public.exam_questions eq join public.assignments a on a.content_type = 'EXAM' and a.content_id = eq.exam_id where eq.question_id = questions.id and public.assignment_visible_to_current_student(a.id))
    or exists (select 1 from public.activity_items ai join public.assignments a on a.content_type = 'ACTIVITY' and a.content_id = ai.activity_id where ai.question_id = questions.id and public.assignment_visible_to_current_student(a.id))
  )
);

drop policy if exists submissions_insert_own on public.submissions;
create policy submissions_insert_own on public.submissions for insert with check (
  student_id = auth.uid() and (
    (assignment_id is not null and public.assignment_visible_to_current_student(assignment_id)
      and exists (select 1 from public.assignments a where a.id = assignment_id and (a.due_at is null or a.due_at > now())))
    or (simulado_id is not null and exists (select 1 from public.simulados s where s.id = simulado_id and s.student_id = auth.uid()))
  )
);
