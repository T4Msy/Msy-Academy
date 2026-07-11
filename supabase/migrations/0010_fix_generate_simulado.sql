-- ============================================================================
-- MSY Academy — Migration 0010: fix generate_simulado() (introduced in 0009).
--
-- `select distinct q.id ... order by random()` is invalid Postgres: with
-- SELECT DISTINCT, every ORDER BY expression must appear in the select list,
-- and random() doesn't. This only surfaces when the function actually runs
-- (CREATE FUNCTION doesn't fully validate embedded query semantics), caught
-- by a real end-to-end test calling the RPC. Fixed by GROUP BY (which both
-- dedupes and has no such ORDER BY restriction) instead of DISTINCT.
-- ============================================================================

create or replace function public.generate_simulado(
  p_title      text,
  p_mode       simulado_mode,
  p_quantidade int,
  p_subject_id uuid default null,
  p_difficulty difficulty_level default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id    uuid := public.auth_tenant_id();
  v_simulado_id  uuid;
  v_question_id  uuid;
  v_position     int := 0;
begin
  insert into public.simulados (tenant_id, student_id, title, mode)
  values (v_tenant_id, auth.uid(), p_title, p_mode)
  returning id into v_simulado_id;

  for v_question_id in
    select q.id
    from public.questions q
    where q.deleted_at is null
      and (p_subject_id is null or q.subject_id = p_subject_id)
      and (p_difficulty is null or q.difficulty = p_difficulty)
      and (
        exists (
          select 1 from public.exam_questions eq
          join public.assignments a on a.content_type = 'EXAM' and a.content_id = eq.exam_id and a.deleted_at is null
          where eq.question_id = q.id and public.is_enrolled_in_class(a.class_id)
        )
        or exists (
          select 1 from public.activity_items ai
          join public.assignments a on a.content_type = 'ACTIVITY' and a.content_id = ai.activity_id and a.deleted_at is null
          where ai.question_id = q.id and public.is_enrolled_in_class(a.class_id)
        )
      )
    group by q.id
    order by random()
    limit greatest(p_quantidade, 0)
  loop
    v_position := v_position + 1;
    insert into public.simulado_questions (simulado_id, question_id, position)
    values (v_simulado_id, v_question_id, v_position);
  end loop;

  if v_position = 0 then
    raise exception 'Nenhuma questão disponível para os filtros escolhidos. Resolva ao menos uma tarefa atribuída antes de gerar um simulado.'
      using errcode = 'P0002';
  end if;

  return v_simulado_id;
end;
$$;
