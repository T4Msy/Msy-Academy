-- ============================================================================
-- MSY Academy — Migration 0012: Fase 4 — Tutor IA (RAG).
--
-- Adds the one piece of scope this phase needs beyond docs/04: materials can
-- now be optionally attached to a class (`materials.class_id`). A material
-- with no class stays a private Biblioteca entry, never RAG-searchable —
-- only class-attached materials get chunked/embedded and become context for
-- that class's students. This is what makes "aluno não matriculado na turma
-- dona do material não recebe contexto dele" meaningful (Fase 4 DoD).
--
-- `embedding vector(8)` matches the mock provider's embed() output size
-- (lib/ai/providers/mock.ts). Swapping to a real provider later requires an
-- ALTER COLUMN TYPE to that provider's dimension (e.g. 1536) + a one-time
-- re-embed of existing chunks — expected migration cost when a provider is
-- chosen, not a design flaw.
-- ============================================================================

create extension if not exists vector;

alter table public.materials add column if not exists class_id uuid references public.classes (id) on delete set null;

-- ── material_chunks: RAG retrieval granularity below `materials` ───────────
create table if not exists public.material_chunks (
  id           uuid primary key default gen_random_uuid(),
  material_id  uuid not null references public.materials (id) on delete cascade,
  content      text not null,
  embedding    vector(8) not null,
  chunk_index  int not null,
  created_at   timestamptz not null default now()
);
create index if not exists material_chunks_material_idx on public.material_chunks (material_id, chunk_index);
create index if not exists material_chunks_embedding_idx on public.material_chunks using ivfflat (embedding vector_cosine_ops);

alter table public.material_chunks enable row level security;

-- Owner (professor, via the material's tenant) OR enrolled-member (aluno, via
-- the material's class_id) — same additive pattern as 0007/0009, reusing
-- is_enrolled_in_class (no new recursion risk: material_chunks/materials
-- have no policy that classes/enrollments reference back).
drop policy if exists material_chunks_select_owner on public.material_chunks;
create policy material_chunks_select_owner on public.material_chunks
  for select using (
    exists (select 1 from public.materials m where m.id = material_id and m.tenant_id = public.auth_tenant_id())
  );

drop policy if exists material_chunks_select_enrolled on public.material_chunks;
create policy material_chunks_select_enrolled on public.material_chunks
  for select using (
    exists (
      select 1 from public.materials m
      where m.id = material_id and m.class_id is not null and public.is_enrolled_in_class(m.class_id)
    )
  );

-- ── tutor_conversations + tutor_messages (RF-A01..A03) ──────────────────────
do $$ begin
  create type tutor_message_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

create table if not exists public.tutor_conversations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  student_id  uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Nova conversa',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tutor_conversations_student_idx on public.tutor_conversations (student_id, updated_at desc);

drop trigger if exists tutor_conversations_set_updated_at on public.tutor_conversations;
create trigger tutor_conversations_set_updated_at
  before update on public.tutor_conversations
  for each row execute function public.set_updated_at();

alter table public.tutor_conversations enable row level security;

drop policy if exists tutor_conversations_select_own on public.tutor_conversations;
create policy tutor_conversations_select_own on public.tutor_conversations
  for select using (student_id = auth.uid());
drop policy if exists tutor_conversations_insert_own on public.tutor_conversations;
create policy tutor_conversations_insert_own on public.tutor_conversations
  for insert with check (student_id = auth.uid() and tenant_id = public.auth_tenant_id());
drop policy if exists tutor_conversations_update_own on public.tutor_conversations;
create policy tutor_conversations_update_own on public.tutor_conversations
  for update using (student_id = auth.uid());

create table if not exists public.tutor_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.tutor_conversations (id) on delete cascade,
  role             tutor_message_role not null,
  content          text not null,
  created_at       timestamptz not null default now()
);
create index if not exists tutor_messages_conversation_idx on public.tutor_messages (conversation_id, created_at);

alter table public.tutor_messages enable row level security;

drop policy if exists tutor_messages_select_own on public.tutor_messages;
create policy tutor_messages_select_own on public.tutor_messages
  for select using (
    exists (select 1 from public.tutor_conversations c where c.id = conversation_id and c.student_id = auth.uid())
  );
drop policy if exists tutor_messages_insert_own on public.tutor_messages;
create policy tutor_messages_insert_own on public.tutor_messages
  for insert with check (
    exists (select 1 from public.tutor_conversations c where c.id = conversation_id and c.student_id = auth.uid())
  );
