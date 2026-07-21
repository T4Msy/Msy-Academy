drop function if exists public.search_question_bank(question_type, difficulty_level, text, text[]);
create function public.search_question_bank(p_type question_type default null, p_difficulty difficulty_level default null, p_search text default null, p_bncc_codes text[] default null, p_tags text[] default null)
returns table (id uuid, type question_type, statement text, difficulty difficulty_level, tags text[], created_at timestamptz, bncc_codes text[])
language sql stable security invoker as $$
  with codes as (select public.normalize_bncc_codes(p_bncc_codes) as value), tags_filter as (select coalesce(array(select distinct lower(trim(value)) from unnest(coalesce(p_tags, '{}'::text[])) value where trim(value) <> ''), '{}'::text[]) as value)
  select q.id, q.type, q.statement, q.difficulty, q.tags, q.created_at, coalesce(array_agg(bs.code order by bs.code) filter (where bs.code is not null), '{}'::text[])
  from public.questions q cross join codes c cross join tags_filter tf
  left join public.question_bncc_skills qbs on qbs.question_id = q.id
  left join public.bncc_skills bs on bs.id = qbs.bncc_skill_id
  where q.deleted_at is null and (p_type is null or q.type = p_type) and (p_difficulty is null or q.difficulty = p_difficulty) and (p_search is null or p_search = '' or q.statement ilike '%' || p_search || '%')
    and (coalesce(array_length(c.value, 1), 0) = 0 or exists (select 1 from public.question_bncc_skills f join public.bncc_skills s on s.id = f.bncc_skill_id where f.question_id = q.id and s.code = any(c.value)))
    and (coalesce(array_length(tf.value, 1), 0) = 0 or exists (select 1 from unnest(q.tags) qtag where lower(qtag) = any(tf.value)))
  group by q.id, q.type, q.statement, q.difficulty, q.tags, q.created_at order by q.created_at desc;
$$;
revoke all on function public.search_question_bank(question_type, difficulty_level, text, text[], text[]) from public;
grant execute on function public.search_question_bank(question_type, difficulty_level, text, text[], text[]) to authenticated;
