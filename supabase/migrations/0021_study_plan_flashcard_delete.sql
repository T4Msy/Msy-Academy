-- ============================================================================
-- MSY Academy — Migration 0021: políticas de DELETE ausentes em
-- study_plan_items/flashcards (filhos) e RPCs de soft-delete para
-- study_plans/flashcard_decks (pais) — migration 0016 só tinha
-- SELECT/INSERT (e UPDATE nos filhos), sem nenhuma forma de excluir.
--
-- Mesma assimetria já usada em exams/exam_questions (0003/0005) e
-- activities/activity_items (0007): filhos sem deleted_at usam DELETE
-- físico direto via policy; pais com deleted_at usam soft-delete via RPC
-- SECURITY DEFINER (motivo: um UPDATE direto que zera a visibilidade via
-- deleted_at viola a própria policy de SELECT se não for security definer
-- — ver o comentário original em soft_delete_exam, 0003).
-- ============================================================================

drop policy if exists study_plan_items_delete_own on public.study_plan_items;
create policy study_plan_items_delete_own on public.study_plan_items
  for delete using (
    exists (select 1 from public.study_plans p where p.id = study_plan_id and p.student_id = auth.uid())
  );

drop policy if exists flashcards_delete_own on public.flashcards;
create policy flashcards_delete_own on public.flashcards
  for delete using (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.student_id = auth.uid())
  );

create or replace function public.soft_delete_study_plan(p_study_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.study_plans
     set deleted_at = now()
   where id = p_study_plan_id
     and student_id = auth.uid()
     and deleted_at is null;

  if not found then
    raise exception 'Plano de estudos não encontrado ou sem permissão'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.soft_delete_study_plan(uuid) from public;
grant execute on function public.soft_delete_study_plan(uuid) to authenticated;

create or replace function public.soft_delete_flashcard_deck(p_deck_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.flashcard_decks
     set deleted_at = now()
   where id = p_deck_id
     and student_id = auth.uid()
     and deleted_at is null;

  if not found then
    raise exception 'Deck não encontrado ou sem permissão'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.soft_delete_flashcard_deck(uuid) from public;
grant execute on function public.soft_delete_flashcard_deck(uuid) to authenticated;
