-- Assessment deadlines are enforced at the database boundary as well as in
-- the UI/server actions. This prevents direct clients from creating or
-- filling submissions after an assignment has expired.

create or replace function public.enforce_assignment_deadline()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.assignment_id is not null and new.status = 'PENDING' and exists (
    select 1 from public.assignments a
    where a.id = new.assignment_id and a.due_at is not null and a.due_at <= now()
  ) then
    raise exception 'A avaliação foi encerrada e não aceita mais respostas.' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and old.status = 'PENDING' and new.status <> 'PENDING'
     and new.assignment_id is not null and exists (
       select 1 from public.assignments a
       where a.id = new.assignment_id and a.due_at is not null and a.due_at <= now()
     ) then
    raise exception 'A avaliação foi encerrada e não aceita mais respostas.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_enforce_assignment_deadline on public.submissions;
create trigger submissions_enforce_assignment_deadline
  before insert or update of assignment_id, status on public.submissions
  for each row execute function public.enforce_assignment_deadline();

drop policy if exists submissions_insert_own on public.submissions;
create policy submissions_insert_own on public.submissions
  for insert with check (
    student_id = auth.uid()
    and (
      (assignment_id is not null and exists (
        select 1 from public.assignments a
        where a.id = assignment_id
          and public.is_enrolled_in_class(a.class_id)
          and (a.due_at is null or a.due_at > now())
      ))
      or (simulado_id is not null and exists (
        select 1 from public.simulados s where s.id = simulado_id and s.student_id = auth.uid()
      ))
    )
  );

drop policy if exists submission_answers_insert_own on public.submission_answers;
create policy submission_answers_insert_own on public.submission_answers
  for insert with check (
    exists (
      select 1 from public.submissions sub
      where sub.id = submission_id
        and sub.student_id = auth.uid()
        and (
          sub.assignment_id is null
          or exists (
            select 1 from public.assignments a
            where a.id = sub.assignment_id and (a.due_at is null or a.due_at > now())
          )
        )
    )
  );

create or replace function public.close_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.submissions sub
    where sub.id = p_submission_id and sub.student_id = auth.uid() and sub.status = 'PENDING'
      and (
        sub.assignment_id is null
        or exists (
          select 1 from public.assignments a
          where a.id = sub.assignment_id and (a.due_at is null or a.due_at > now())
        )
      )
  ) then
    raise exception 'A avaliação foi encerrada e não aceita mais respostas.' using errcode = 'P0001';
  end if;

  update public.submissions
     set status = 'SUBMITTED', submitted_at = now()
   where id = p_submission_id and student_id = auth.uid() and status = 'PENDING';
end;
$$;

revoke all on function public.close_submission(uuid) from public;
grant execute on function public.close_submission(uuid) to authenticated;
