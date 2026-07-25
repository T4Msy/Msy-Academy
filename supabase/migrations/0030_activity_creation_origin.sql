-- A origem é definida dentro da transação que cria a atividade e suas
-- questões. Isso elimina o estado parcial "criada, mas sem origem".
create or replace function public.create_activity_with_questions(
  p_title text,
  p_subject_id uuid,
  p_grade_level_id uuid,
  p_generation_params jsonb,
  p_ai_provider text,
  p_questions jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_tenant_id uuid := public.auth_tenant_id();
  v_activity_id uuid;
  v_question jsonb;
  v_question_id uuid;
  v_position int := 0;
begin
  insert into public.activities (tenant_id, author_id, title, subject_id, grade_level_id, generation_params, status, ai_provider, origin)
  values (v_tenant_id, auth.uid(), p_title, p_subject_id, p_grade_level_id, coalesce(p_generation_params, '{}'::jsonb), 'READY', p_ai_provider, case when p_ai_provider is null then 'manual' else 'ai' end)
  returning id into v_activity_id;

  for v_question in select * from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb)) loop
    v_position := v_position + 1;
    insert into public.questions (tenant_id, author_id, type, difficulty, statement, options, correct_answer, explanation, tags, ai_provider)
    values (v_tenant_id, auth.uid(), (v_question->>'type')::question_type, coalesce((v_question->>'difficulty')::difficulty_level, 'MEDIO'), v_question->>'statement', v_question->'options', v_question->'correctAnswer', v_question->>'explanation', coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_question->'tags', '[]'::jsonb)) x), '{}'::text[]), p_ai_provider)
    returning id into v_question_id;
    perform public.set_question_bncc_skills(v_question_id, coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_question->'bnccCodes', '[]'::jsonb)) x), '{}'::text[]));
    insert into public.activity_items (activity_id, question_id, position, points) values (v_activity_id, v_question_id, v_position, 1);
  end loop;
  return v_activity_id;
end;
$$;
grant execute on function public.create_activity_with_questions(text, uuid, uuid, jsonb, text, jsonb) to authenticated;
