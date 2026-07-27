-- Banco de questões: expõe o contexto de onde cada questão foi usada e
-- permite filtrar o acervo por professor, matéria e conteúdo/assunto.
-- A função é SECURITY DEFINER porque os nomes de outros professores do mesmo
-- tenant não são legíveis diretamente pela policy restrita de `profiles`.

create or replace function public.search_question_bank_with_context(
  p_type question_type default null,
  p_difficulty difficulty_level default null,
  p_search text default null,
  p_bncc_codes text[] default null,
  p_tags text[] default null,
  p_author_id uuid default null,
  p_subject_id uuid default null,
  p_content text default null
)
returns table (
  id uuid,
  type question_type,
  statement text,
  difficulty difficulty_level,
  tags text[],
  created_at timestamptz,
  bncc_codes text[],
  author_id uuid,
  author_name text,
  origins jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with source_rows as (
    select
      eq.question_id,
      e.author_id as teacher_id,
      e.subject_id,
      nullif(coalesce(e.generation_params ->> 'assunto', e.course), '') as content,
      jsonb_build_object(
        'sourceType', 'Prova',
        'sourceTitle', e.title,
        'date', coalesce(a.starts_at, a.due_at, a.created_at, e.created_at),
        'className', c.name,
        'teacherId', e.author_id,
        'teacherName', p.full_name,
        'subjectId', e.subject_id,
        'subject', s.name,
        'content', nullif(coalesce(e.generation_params ->> 'assunto', e.course), '')
      ) as origin
    from public.exam_questions eq
    join public.exams e on e.id = eq.exam_id
    left join public.assignments a on a.content_type = 'EXAM' and a.content_id = e.id and a.deleted_at is null
    left join public.classes c on c.id = a.class_id and c.deleted_at is null
    left join public.profiles p on p.id = e.author_id
    left join public.subjects s on s.id = e.subject_id
    where e.tenant_id = public.auth_tenant_id() and e.deleted_at is null

    union all

    select
      ai.question_id,
      a.author_id as teacher_id,
      a.subject_id,
      nullif(a.generation_params ->> 'assunto', '') as content,
      jsonb_build_object(
        'sourceType', 'Atividade',
        'sourceTitle', a.title,
        'date', coalesce(ass.starts_at, ass.due_at, ass.created_at, a.created_at),
        'className', c.name,
        'teacherId', a.author_id,
        'teacherName', p.full_name,
        'subjectId', a.subject_id,
        'subject', s.name,
        'content', nullif(a.generation_params ->> 'assunto', '')
      ) as origin
    from public.activity_items ai
    join public.activities a on a.id = ai.activity_id
    left join public.assignments ass on ass.content_type = 'ACTIVITY' and ass.content_id = a.id and ass.deleted_at is null
    left join public.classes c on c.id = ass.class_id and c.deleted_at is null
    left join public.profiles p on p.id = a.author_id
    left join public.subjects s on s.id = a.subject_id
    where a.tenant_id = public.auth_tenant_id() and a.deleted_at is null
  ),
  codes as (
    select public.normalize_bncc_codes(p_bncc_codes) as value
  ),
  tags_filter as (
    select coalesce(
      array(select distinct lower(trim(value)) from unnest(coalesce(p_tags, '{}'::text[])) value where trim(value) <> ''),
      '{}'::text[]
    ) as value
  )
  select
    q.id,
    q.type,
    q.statement,
    q.difficulty,
    q.tags,
    q.created_at,
    coalesce(array_agg(distinct bs.code) filter (where bs.code is not null), '{}'::text[]) as bncc_codes,
    q.author_id,
    profile.full_name as author_name,
    coalesce(jsonb_agg(distinct sr.origin) filter (where sr.question_id is not null), '[]'::jsonb) as origins
  from public.questions q
  left join public.profiles profile on profile.id = q.author_id
  left join public.question_bncc_skills qbs on qbs.question_id = q.id
  left join public.bncc_skills bs on bs.id = qbs.bncc_skill_id
  left join source_rows sr on sr.question_id = q.id
  cross join codes c
  cross join tags_filter tf
  where q.tenant_id = public.auth_tenant_id()
    and q.deleted_at is null
    and (p_type is null or q.type = p_type)
    and (p_difficulty is null or q.difficulty = p_difficulty)
    and (p_search is null or p_search = '' or q.statement ilike '%' || p_search || '%')
    and (p_author_id is null or q.author_id = p_author_id or sr.teacher_id = p_author_id)
    and (p_subject_id is null or q.subject_id = p_subject_id or sr.subject_id = p_subject_id)
    and (
      nullif(trim(p_content), '') is null
      or sr.content ilike '%' || trim(p_content) || '%'
      or exists (select 1 from unnest(q.tags) tag where tag ilike '%' || trim(p_content) || '%')
    )
    and (
      coalesce(array_length(c.value, 1), 0) = 0
      or exists (
        select 1
        from public.question_bncc_skills f
        join public.bncc_skills skill on skill.id = f.bncc_skill_id
        where f.question_id = q.id and skill.code = any(c.value)
      )
    )
    and (
      coalesce(array_length(tf.value, 1), 0) = 0
      or exists (select 1 from unnest(q.tags) qtag where lower(qtag) = any(tf.value))
    )
  group by q.id, q.type, q.statement, q.difficulty, q.tags, q.created_at, q.author_id, profile.full_name
  order by q.created_at desc;
$$;

revoke all on function public.search_question_bank_with_context(question_type, difficulty_level, text, text[], text[], uuid, uuid, text) from public;
grant execute on function public.search_question_bank_with_context(question_type, difficulty_level, text, text[], text[], uuid, uuid, text) to authenticated;
