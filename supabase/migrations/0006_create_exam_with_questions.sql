-- ============================================================================
-- MSY Academy — Migration 0006: create_exam_with_questions
-- Persiste uma prova gerada (exam + questions + exam_questions) numa única
-- chamada — Postgres já trata o corpo de uma função como uma transação
-- implícita, então isso satisfaz "persistir em transação" sem precisar de
-- BEGIN/COMMIT client-side (que o PostgREST não expõe entre múltiplas
-- chamadas .from()).
--
-- Roda como SECURITY INVOKER (padrão): auth.uid()/auth_tenant_id() resolvem
-- para o usuário autenticado chamando a rota, e os INSERTs continuam sendo
-- verificados pelas policies de RLS já existentes (exams_insert_own,
-- questions_insert_own, exam_questions_insert_own) — a função não contorna
-- RLS, só agrupa os inserts numa unidade atômica.
-- ============================================================================

create or replace function public.create_exam_with_questions(
  p_title               text,
  p_course              text,
  p_style               text,
  p_generation_params   jsonb,
  p_include_answer_key  boolean,
  p_ai_provider         text,
  p_questions           jsonb -- array of {type, statement, options, correctAnswer, explanation, difficulty, tags}
)
returns uuid
language plpgsql
as $$
declare
  v_tenant_id   uuid := public.auth_tenant_id();
  v_exam_id     uuid;
  v_question    jsonb;
  v_question_id uuid;
  v_position    int := 0;
begin
  insert into public.exams (
    tenant_id, author_id, title, course, style, generation_params,
    include_answer_key, status, ai_provider, version
  ) values (
    v_tenant_id, auth.uid(), p_title, p_course, p_style,
    coalesce(p_generation_params, '{}'::jsonb),
    coalesce(p_include_answer_key, true), 'READY', p_ai_provider, 1
  ) returning id into v_exam_id;

  for v_question in select * from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb))
  loop
    v_position := v_position + 1;

    insert into public.questions (
      tenant_id, author_id, type, difficulty, statement, options,
      correct_answer, explanation, tags, ai_provider
    ) values (
      v_tenant_id, auth.uid(),
      (v_question->>'type')::question_type,
      coalesce((v_question->>'difficulty')::difficulty_level, 'MEDIO'),
      v_question->>'statement',
      v_question->'options',
      v_question->'correctAnswer',
      v_question->>'explanation',
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(coalesce(v_question->'tags', '[]'::jsonb)) x),
        '{}'::text[]
      ),
      p_ai_provider
    ) returning id into v_question_id;

    insert into public.exam_questions (exam_id, question_id, position, points)
    values (v_exam_id, v_question_id, v_position, 1);
  end loop;

  return v_exam_id;
end;
$$;

grant execute on function public.create_exam_with_questions(
  text, text, text, jsonb, boolean, text, jsonb
) to authenticated;
