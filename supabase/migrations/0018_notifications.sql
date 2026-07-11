-- ============================================================================
-- MSY Academy — Migration 0018: Fase 6 — Notificações (RF-G06).
--
-- Event-driven only: "nova tarefa" (on assignments insert) and "nota
-- lançada" (on grades insert) fire via triggers, synchronously, same as the
-- Biblioteca sync triggers from 0007. "Prazo próximo" is deliberately NOT
-- implemented here — it needs a scheduled/cron job to poll upcoming due
-- dates, which is out of scope (same "fila assíncrona é trabalho futuro"
-- boundary the plan already draws for RAG ingestion).
-- ============================================================================

do $$ begin
  create type notification_kind as enum ('NEW_ASSIGNMENT', 'GRADE_POSTED');
exception when duplicate_object then null; end $$;

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        notification_kind not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid());

-- ── Trigger: new assignment -> notify every enrolled student ────────────
create or replace function public.notify_new_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_class_name text;
  v_student record;
begin
  select name into v_class_name from public.classes where id = new.class_id;

  for v_student in
    select e.student_id, p.tenant_id
    from public.enrollments e
    join public.profiles p on p.id = e.student_id
    where e.class_id = new.class_id and e.status = 'ACTIVE'
  loop
    insert into public.notifications (tenant_id, user_id, kind, title, body, link)
    values (
      v_student.tenant_id, v_student.student_id, 'NEW_ASSIGNMENT',
      'Nova tarefa em ' || coalesce(v_class_name, 'sua turma'),
      'Uma nova prova ou atividade foi atribuída.',
      '/aluno/tarefas/' || new.id
    );
  end loop;
  return new;
end;
$$;
drop trigger if exists assignments_notify on public.assignments;
create trigger assignments_notify
  after insert on public.assignments
  for each row execute function public.notify_new_assignment();

-- ── Trigger: grade posted -> notify the student ──────────────────────────
create or replace function public.notify_grade_posted()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_student_id uuid;
  v_tenant_id  uuid;
begin
  select sub.student_id, p.tenant_id into v_student_id, v_tenant_id
  from public.submissions sub
  join public.profiles p on p.id = sub.student_id
  where sub.id = new.submission_id;

  if v_student_id is not null then
    insert into public.notifications (tenant_id, user_id, kind, title, body, link)
    values (
      v_tenant_id, v_student_id, 'GRADE_POSTED',
      'Sua nota foi lançada',
      'Nota: ' || new.total_score,
      '/aluno/tarefas'
    );
  end if;
  return new;
end;
$$;
drop trigger if exists grades_notify on public.grades;
create trigger grades_notify
  after insert on public.grades
  for each row execute function public.notify_grade_posted();
