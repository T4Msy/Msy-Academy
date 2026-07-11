-- ============================================================================
-- MSY Academy — Migration 0017: Fase 6 — increment ai_usage atomically.
--
-- `ai_usage` (migration 0004) has a unique (tenant_id, period) constraint but
-- nothing ever wrote to it — this RPC is the write path, called by the
-- orchestrator server-side (never by a client; ai_usage still has no client
-- write policy, same as ai_interactions). Atomic upsert avoids a
-- read-then-write race between concurrent AI calls for the same tenant.
-- ============================================================================

create or replace function public.increment_ai_usage(
  p_tenant_id  uuid,
  p_period     text,
  p_tokens     bigint
)
returns void
language sql
as $$
  insert into public.ai_usage (tenant_id, period, tokens_used, requests_count)
  values (p_tenant_id, p_period, p_tokens, 1)
  on conflict (tenant_id, period) do update
    set tokens_used = public.ai_usage.tokens_used + excluded.tokens_used,
        requests_count = public.ai_usage.requests_count + 1;
$$;

-- Not granted to `authenticated` on purpose — same server-only write
-- discipline as ai_interactions; only the admin/service-role client (used
-- exclusively by lib/ai/orchestrator.ts) calls this.
