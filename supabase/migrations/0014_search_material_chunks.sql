-- ============================================================================
-- MSY Academy — Migration 0014: Fase 4 — vector similarity search RPC.
--
-- supabase-js has no query-builder support for pgvector's `<=>` operator, so
-- this is a plain SQL function the client calls via .rpc(). Deliberately
-- NOT security definer (default is SECURITY INVOKER): it runs as the calling
-- user, so RLS on material_chunks (0012/0013) keeps applying automatically —
-- an aluno's search only ever ranks chunks they're already allowed to read.
-- No extra scoping logic needed here; RLS is the scoping.
-- ============================================================================

create or replace function public.search_material_chunks(
  p_query_embedding vector(8),
  p_match_count int default 4
)
returns table (chunk_id uuid, material_id uuid, content text, similarity float)
language sql
stable
as $$
  select id, material_id, content, 1 - (embedding <=> p_query_embedding) as similarity
  from public.material_chunks
  order by embedding <=> p_query_embedding
  limit p_match_count;
$$;

grant execute on function public.search_material_chunks(vector, int) to authenticated;
