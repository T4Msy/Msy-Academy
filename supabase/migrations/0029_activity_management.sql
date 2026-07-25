-- Metadados de ciclo de vida para a biblioteca própria de atividades.
alter table public.activities
  add column if not exists description text,
  add column if not exists origin text not null default 'manual',
  add column if not exists parent_activity_id uuid references public.activities (id) on delete set null;

alter table public.activities drop constraint if exists activities_origin_check;
alter table public.activities add constraint activities_origin_check check (origin in ('ai', 'manual'));
create index if not exists activities_author_created_idx on public.activities (author_id, created_at desc) where deleted_at is null;

-- Conteúdo privado do professor: a política de aluno continua aditiva na
-- migration 0009/0027 e permite somente atividades atribuídas.
drop policy if exists activities_select_tenant on public.activities;
create policy activities_select_tenant on public.activities
  for select using (author_id = auth.uid() and deleted_at is null);
drop policy if exists activities_update_own on public.activities;
create policy activities_update_own on public.activities
  for update using (author_id = auth.uid() and deleted_at is null)
  with check (author_id = auth.uid());

drop policy if exists activity_items_select_tenant on public.activity_items;
create policy activity_items_select_tenant on public.activity_items
  for select using (
    exists (select 1 from public.activities a where a.id = activity_id and ((a.author_id = auth.uid() and a.deleted_at is null) or exists (
      select 1 from public.assignments asg where asg.content_type = 'ACTIVITY' and asg.content_id = a.id and public.assignment_visible_to_current_student(asg.id)
    )))
  );
