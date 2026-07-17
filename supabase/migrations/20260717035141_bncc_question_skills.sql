-- ============================================================================
-- MSY Academy - BNCC support for the Question Bank.
--
-- BNCC skills are a global reference catalog, while question associations are
-- stored in a proper N:N table. This keeps `questions` free of duplicated code
-- arrays and lets future UI filters combine BNCC with the existing type,
-- difficulty and text-search filters.
-- ============================================================================

create table if not exists public.bncc_skills (
  id           uuid primary key default gen_random_uuid(),
  code         text not null,
  stage        text,
  subject      text,
  grade_range  text,
  competence   text,
  description  text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint bncc_skills_code_upper_chk check (code = upper(code)),
  constraint bncc_skills_code_format_chk check (code ~ '^[A-Z0-9]{4,20}$'),
  constraint bncc_skills_code_key unique (code)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bncc_skills_set_updated_at on public.bncc_skills;
create trigger bncc_skills_set_updated_at
  before update on public.bncc_skills
  for each row execute function public.set_updated_at();

create table if not exists public.question_bncc_skills (
  question_id    uuid not null references public.questions (id) on delete cascade,
  bncc_skill_id  uuid not null references public.bncc_skills (id) on delete restrict,
  created_at     timestamptz not null default now(),
  primary key (question_id, bncc_skill_id)
);
create index if not exists question_bncc_skills_skill_question_idx
  on public.question_bncc_skills (bncc_skill_id, question_id);

alter table public.bncc_skills enable row level security;
alter table public.question_bncc_skills enable row level security;

drop policy if exists bncc_skills_select_all on public.bncc_skills;
create policy bncc_skills_select_all on public.bncc_skills
  for select
  to authenticated
  using (true);

drop policy if exists question_bncc_skills_select_tenant on public.question_bncc_skills;
create policy question_bncc_skills_select_tenant on public.question_bncc_skills
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.questions q
       where q.id = question_id
         and q.tenant_id = public.auth_tenant_id()
         and q.deleted_at is null
    )
  );

drop policy if exists question_bncc_skills_insert_own on public.question_bncc_skills;
create policy question_bncc_skills_insert_own on public.question_bncc_skills
  for insert
  to authenticated
  with check (
    exists (
      select 1
        from public.questions q
       where q.id = question_id
         and q.tenant_id = public.auth_tenant_id()
         and q.author_id = auth.uid()
         and q.deleted_at is null
    )
  );

drop policy if exists question_bncc_skills_delete_own on public.question_bncc_skills;
create policy question_bncc_skills_delete_own on public.question_bncc_skills
  for delete
  to authenticated
  using (
    exists (
      select 1
        from public.questions q
       where q.id = question_id
         and q.tenant_id = public.auth_tenant_id()
         and q.author_id = auth.uid()
         and q.deleted_at is null
    )
  );

grant select on public.bncc_skills to authenticated;
grant select, insert, delete on public.question_bncc_skills to authenticated;

create or replace function public.normalize_bncc_codes(p_bncc_codes text[])
returns text[]
language sql
immutable
as $$
  select coalesce(
    array_agg(code order by code),
    '{}'::text[]
  )
  from (
    select distinct upper(trim(code)) as code
      from unnest(coalesce(p_bncc_codes, '{}'::text[])) as raw(code)
     where trim(code) <> ''
  ) normalized
  where code ~ '^[A-Z0-9]{4,20}$';
$$;

revoke all on function public.normalize_bncc_codes(text[]) from public;
grant execute on function public.normalize_bncc_codes(text[]) to authenticated;

create or replace function public.set_question_bncc_skills(
  p_question_id uuid,
  p_bncc_codes  text[]
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codes text[] := public.normalize_bncc_codes(p_bncc_codes);
  v_invalid_count int;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado' using errcode = '42501';
  end if;

  select count(*) into v_invalid_count
    from unnest(coalesce(p_bncc_codes, '{}'::text[])) as raw(code)
   where trim(code) <> ''
     and upper(trim(code)) !~ '^[A-Z0-9]{4,20}$';

  if v_invalid_count > 0 then
    raise exception 'Codigo BNCC invalido' using errcode = '22023';
  end if;

  perform 1
    from public.questions q
   where q.id = p_question_id
     and q.tenant_id = public.auth_tenant_id()
     and q.author_id = auth.uid()
     and q.deleted_at is null;

  if not found then
    raise exception 'Questao nao encontrada ou sem permissao'
      using errcode = '42501';
  end if;

  insert into public.bncc_skills (code)
  select code from unnest(v_codes) as normalized(code)
  on conflict (code) do nothing;

  delete from public.question_bncc_skills
   where question_id = p_question_id;

  insert into public.question_bncc_skills (question_id, bncc_skill_id)
  select p_question_id, bs.id
    from public.bncc_skills bs
   where bs.code = any(v_codes)
  on conflict do nothing;

  return v_codes;
end;
$$;
revoke all on function public.set_question_bncc_skills(uuid, text[]) from public;
grant execute on function public.set_question_bncc_skills(uuid, text[]) to authenticated;

create or replace function public.search_question_bank(
  p_type        question_type default null,
  p_difficulty  difficulty_level default null,
  p_search      text default null,
  p_bncc_codes  text[] default null
)
returns table (
  id          uuid,
  type        question_type,
  statement   text,
  difficulty  difficulty_level,
  tags        text[],
  created_at  timestamptz,
  bncc_codes  text[]
)
language sql
stable
security invoker
as $$
  with filter_codes as (
    select public.normalize_bncc_codes(p_bncc_codes) as codes
  )
  select
    q.id,
    q.type,
    q.statement,
    q.difficulty,
    q.tags,
    q.created_at,
    coalesce(
      array_agg(bs.code order by bs.code) filter (where bs.code is not null),
      '{}'::text[]
    ) as bncc_codes
  from public.questions q
  cross join filter_codes fc
  left join public.question_bncc_skills qbs on qbs.question_id = q.id
  left join public.bncc_skills bs on bs.id = qbs.bncc_skill_id
  where q.deleted_at is null
    and (p_type is null or q.type = p_type)
    and (p_difficulty is null or q.difficulty = p_difficulty)
    and (p_search is null or p_search = '' or q.statement ilike '%' || p_search || '%')
    and (
      coalesce(array_length(fc.codes, 1), 0) = 0
      or exists (
        select 1
          from public.question_bncc_skills qbs_filter
          join public.bncc_skills bs_filter on bs_filter.id = qbs_filter.bncc_skill_id
         where qbs_filter.question_id = q.id
           and bs_filter.code = any(fc.codes)
      )
    )
  group by q.id, q.type, q.statement, q.difficulty, q.tags, q.created_at
  order by q.created_at desc;
$$;
revoke all on function public.search_question_bank(question_type, difficulty_level, text, text[]) from public;
grant execute on function public.search_question_bank(question_type, difficulty_level, text, text[]) to authenticated;

create or replace function public.create_exam_with_questions(
  p_title               text,
  p_course              text,
  p_style               text,
  p_generation_params   jsonb,
  p_include_answer_key  boolean,
  p_ai_provider         text,
  p_questions           jsonb
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

    perform public.set_question_bncc_skills(
      v_question_id,
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(coalesce(v_question->'bnccCodes', '[]'::jsonb)) x),
        '{}'::text[]
      )
    );

    insert into public.exam_questions (exam_id, question_id, position, points)
    values (v_exam_id, v_question_id, v_position, 1);
  end loop;

  return v_exam_id;
end;
$$;

grant execute on function public.create_exam_with_questions(
  text, text, text, jsonb, boolean, text, jsonb
) to authenticated;

create or replace function public.create_activity_with_questions(
  p_title              text,
  p_subject_id         uuid,
  p_grade_level_id     uuid,
  p_generation_params  jsonb,
  p_ai_provider        text,
  p_questions          jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_tenant_id     uuid := public.auth_tenant_id();
  v_activity_id   uuid;
  v_question      jsonb;
  v_question_id   uuid;
  v_position      int := 0;
begin
  insert into public.activities (tenant_id, author_id, title, subject_id, grade_level_id, generation_params, status, ai_provider)
  values (v_tenant_id, auth.uid(), p_title, p_subject_id, p_grade_level_id, coalesce(p_generation_params, '{}'::jsonb), 'READY', p_ai_provider)
  returning id into v_activity_id;

  for v_question in select * from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb))
  loop
    v_position := v_position + 1;
    insert into public.questions (tenant_id, author_id, type, difficulty, statement, options, correct_answer, explanation, tags, ai_provider)
    values (
      v_tenant_id, auth.uid(),
      (v_question->>'type')::question_type,
      coalesce((v_question->>'difficulty')::difficulty_level, 'MEDIO'),
      v_question->>'statement', v_question->'options', v_question->'correctAnswer', v_question->>'explanation',
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_question->'tags', '[]'::jsonb)) x), '{}'::text[]),
      p_ai_provider
    ) returning id into v_question_id;

    perform public.set_question_bncc_skills(
      v_question_id,
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(coalesce(v_question->'bnccCodes', '[]'::jsonb)) x),
        '{}'::text[]
      )
    );

    insert into public.activity_items (activity_id, question_id, position, points)
    values (v_activity_id, v_question_id, v_position, 1);
  end loop;

  return v_activity_id;
end;
$$;
grant execute on function public.create_activity_with_questions(text, uuid, uuid, jsonb, text, jsonb) to authenticated;
