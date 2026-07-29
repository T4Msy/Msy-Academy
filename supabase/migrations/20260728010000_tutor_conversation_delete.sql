-- A conversa e suas mensagens pertencem exclusivamente ao aluno.
-- A FK de tutor_messages usa ON DELETE CASCADE, removendo o histórico junto.
drop policy if exists tutor_conversations_delete_own on public.tutor_conversations;
create policy tutor_conversations_delete_own on public.tutor_conversations
  for delete using (student_id = auth.uid());
