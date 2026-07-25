-- Notifica somente os destinatários efetivos. A atribuição individual é
-- notificada no insert de assignment_students, depois da lista estar validada.
create or replace function public.notify_assignment_student(p_assignment_id uuid, p_student_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_tenant_id uuid; v_class_name text; v_student_tenant uuid;
begin
  select a.tenant_id, c.name into v_tenant_id, v_class_name
    from public.assignments a join public.classes c on c.id = a.class_id where a.id = p_assignment_id;
  select tenant_id into v_student_tenant from public.profiles where id = p_student_id;
  if v_student_tenant is not null then
    insert into public.notifications (tenant_id, user_id, kind, title, body, link)
    select v_student_tenant, p_student_id, 'NEW_ASSIGNMENT', 'Nova atividade em ' || coalesce(v_class_name, 'sua turma'),
      'Uma nova prova ou atividade foi atribuída.', '/aluno/tarefas/' || p_assignment_id
    where not exists (
      select 1 from public.notifications n where n.user_id = p_student_id and n.kind = 'NEW_ASSIGNMENT'
        and n.link = '/aluno/tarefas/' || p_assignment_id
    );
  end if;
end;
$$;

create or replace function public.notify_new_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_student record;
begin
  if new.audience_type = 'class' then
    for v_student in select e.student_id from public.enrollments e where e.class_id = new.class_id and e.status = 'ACTIVE'
    loop perform public.notify_assignment_student(new.id, v_student.student_id); end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists assignments_notify on public.assignments;
create trigger assignments_notify after insert on public.assignments for each row execute function public.notify_new_assignment();

create or replace function public.notify_individual_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.notify_assignment_student(new.assignment_id, new.student_id); return new; end;
$$;
drop trigger if exists assignment_students_notify on public.assignment_students;
create trigger assignment_students_notify after insert on public.assignment_students for each row execute function public.notify_individual_assignment();
