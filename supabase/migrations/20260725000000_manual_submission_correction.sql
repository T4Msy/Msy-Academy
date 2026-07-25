-- Toda entrega passa a aguardar a revisão do professor. O aluno nunca recebe
-- correção ou nota automática ao enviar uma prova/atividade.

create or replace function public.submit_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.submissions where id = p_submission_id and student_id = auth.uid() and status = 'PENDING') then
    raise exception 'Envio não encontrado, já enviado ou sem permissão' using errcode = '42501';
  end if;

  update public.submissions
     set status = 'SUBMITTED', submitted_at = now()
   where id = p_submission_id;
end;
$$;

-- O professor aplica o gabarito somente quando decidir corrigir a entrega.
-- Questões discursivas continuam com nota manual/assistida no fluxo existente.
create or replace function public.grade_submission_by_answer_key(p_submission_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric;
begin
  if not exists (
    select 1
      from public.submissions sub
      join public.assignments assignment on assignment.id = sub.assignment_id
     where sub.id = p_submission_id
       and sub.status = 'SUBMITTED'
       and public.is_class_owner(assignment.class_id)
  ) then
    raise exception 'Entrega não encontrada, já corrigida ou sem permissão' using errcode = '42501';
  end if;

  update public.submission_answers answer
     set is_correct = answer.answer = question.correct_answer,
         score = case when answer.answer = question.correct_answer then 1 else 0 end
    from public.questions question
   where answer.question_id = question.id
     and answer.submission_id = p_submission_id
     and question.type in ('MULTIPLA', 'VF');

  select coalesce(sum(score), 0)
    into v_total
    from public.submission_answers
   where submission_id = p_submission_id;

  return v_total;
end;
$$;

revoke all on function public.grade_submission_by_answer_key(uuid) from public;
grant execute on function public.grade_submission_by_answer_key(uuid) to authenticated;
