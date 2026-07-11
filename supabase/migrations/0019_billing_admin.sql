-- ============================================================================
-- MSY Academy — Migration 0019: Billing (planos/assinaturas) + Admin.
--
-- Implementa o que docs/04 já previa (`plans`/`subscriptions`) e que a
-- reescrita V1+V2 deixou de propósito fora de escopo: RF-G05, RF-AD01-03,
-- RF-AD07. Sem RLS nova para visibilidade cross-tenant — o painel admin lê
-- via service-role client (mesma disciplina de ai_usage/ai_interactions),
-- não via policy "admin vê tudo" (evita reabrir a superfície de RLS
-- multi-perfil documentada como sensível).
--
-- Preço/cota dos planos abaixo são placeholders — editáveis depois em
-- /admin/planos (RF-AD07), não são decisão de pricing final.
-- ============================================================================

do $$ begin
  create type plan_code as enum ('FREE', 'PROFESSOR', 'ALUNO', 'ESCOLA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');
exception when duplicate_object then null; end $$;

-- ── plans: dado de referência, legível por qualquer autenticado ────────────
create table if not exists public.plans (
  id                uuid primary key default gen_random_uuid(),
  code              plan_code not null unique,
  name              text not null,
  ai_quota_monthly  bigint not null,
  price_cents       int not null default 0,
  stripe_price_id   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

alter table public.plans enable row level security;

drop policy if exists plans_select_all on public.plans;
create policy plans_select_all on public.plans
  for select to authenticated using (true);

insert into public.plans (code, name, ai_quota_monthly, price_cents)
values
  ('FREE', 'Gratuito', 50000, 0),
  ('PROFESSOR', 'Professor', 300000, 2990),
  ('ALUNO', 'Aluno', 150000, 1490),
  ('ESCOLA', 'Escola', 1500000, 9990)
on conflict (code) do nothing;

-- ── subscriptions: uma por tenant ───────────────────────────────────────────
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null unique references public.tenants (id) on delete cascade,
  plan_id                uuid not null references public.plans (id),
  status                 subscription_status not null default 'ACTIVE',
  current_period_end     timestamptz,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists subscriptions_tenant_idx on public.subscriptions (tenant_id);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select using (tenant_id = public.auth_tenant_id());

-- Nenhuma insert/update policy: toda escrita de subscriptions passa pelo
-- service-role client (webhook do Stripe, ou ação de admin) — mesma
-- disciplina de ai_usage/ai_interactions.

-- ── profiles: suspensão de conta (RF-AD01) ──────────────────────────────────
alter table public.profiles add column if not exists suspended_at timestamptz;

-- ── handle_new_user(): agora também provisiona a subscription FREE ─────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  display_name  text;
  free_plan_id  uuid;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.tenants (name, type)
  values (display_name, 'INDIVIDUAL')
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, full_name)
  values (new.id, new_tenant_id, display_name);

  select id into free_plan_id from public.plans where code = 'FREE';
  if free_plan_id is not null then
    insert into public.subscriptions (tenant_id, plan_id, status)
    values (new_tenant_id, free_plan_id, 'ACTIVE');
  end if;

  return new;
end;
$$;

-- ── Backfill: tenants criados antes desta migration ganham FREE também ─────
insert into public.subscriptions (tenant_id, plan_id, status)
select t.id, (select id from public.plans where code = 'FREE'), 'ACTIVE'
from public.tenants t
where not exists (select 1 from public.subscriptions s where s.tenant_id = t.id);
