-- ============================================================================
-- MSY Academy — Migration 0004: role onboarding (Fase 0 do redesign completo)
-- Até aqui, o signup atribuía PROFESSOR automaticamente (migration 0001). Isso
-- conflita com o onboarding de escolha de papel (Professor/Aluno/ambos) e com
-- a entrada de aluno via convite de turma. A partir desta migration:
--   • o trigger de signup cria só tenant+profile, sem role;
--   • a tela de onboarding insere a(s) role(s) escolhidas diretamente do
--     client, então user_roles precisa de uma policy de INSERT — restrita a
--     PROFESSOR/ALUNO (nunca ADMIN, que não é auto-atribuível via onboarding);
--   • ai_usage é criada agora (tracking de uso de IA) para não retrofitar
--     schema quando a Fase 1 ligar a geração de verdade — sem enforcement de
--     cota ainda, só leitura pelo próprio tenant; escrita é sempre server-side
--     (service role), nunca pelo client autenticado.
-- ============================================================================

-- ── Signup trigger: só tenant + profile, sem role ────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  display_name  text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.tenants (name, type)
  values (display_name, 'INDIVIDUAL')
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, full_name)
  values (new.id, new_tenant_id, display_name);

  return new;
end;
$$;

-- ── user_roles: permitir que o próprio usuário se auto-atribua PROFESSOR/ALUNO
-- (nunca ADMIN) no onboarding ou ao entrar por convite de turma. ────────────
drop policy if exists user_roles_insert_own on public.user_roles;
create policy user_roles_insert_own on public.user_roles
  for insert with check (
    user_id = auth.uid() and role in ('PROFESSOR', 'ALUNO')
  );

-- ── ai_usage: tracking de consumo de IA por tenant/período, sem enforcement
-- de cota ainda (Fase 1+ passa a incrementar; billing fica fora desta rodada).
create table if not exists public.ai_usage (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  user_id         uuid references auth.users (id) on delete set null,
  period          text not null, -- 'YYYY-MM'
  tokens_used     bigint not null default 0,
  requests_count  int not null default 0,
  cost_cents      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, period)
);
create index if not exists ai_usage_tenant_period_idx on public.ai_usage (tenant_id, period);

drop trigger if exists ai_usage_set_updated_at on public.ai_usage;
create trigger ai_usage_set_updated_at
  before update on public.ai_usage
  for each row execute function public.set_updated_at();

alter table public.ai_usage enable row level security;

-- Leitura: só o próprio tenant. Sem policy de insert/update para
-- `authenticated` — escrita é sempre via service role (backend), nunca client.
drop policy if exists ai_usage_select_own on public.ai_usage;
create policy ai_usage_select_own on public.ai_usage
  for select using (tenant_id = public.auth_tenant_id());
