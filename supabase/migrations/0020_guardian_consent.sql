-- ============================================================================
-- MSY Academy — Migration 0020: Guardian consent for minor students (RNF-C02)
--
-- LGPD Art. 14 requires specific consent from a parent/legal guardian for
-- processing a minor's data. There is no transactional email provider wired
-- into this app (that's a separate credential/decision — see project memory
-- msy-academy-fase-0-a-6-status), so this is a share-a-link flow instead of
-- an email flow: a student who declares themselves under 18 at onboarding
-- gets a token to share with their guardian directly (same "share the code"
-- pattern already used for class invites, migration 0007's invite_code).
-- The guardian visits a public, token-scoped page — no account needed — and
-- confirms. Nothing here is enforced as a hard access gate (see the aluno
-- layout banner in app code) — deciding whether/how to gate access on
-- pending consent is a product/legal policy call, not something to bake
-- into the schema unilaterally.
-- ============================================================================

alter table public.profiles add column if not exists birth_date date;

create table if not exists public.guardian_consents (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants (id) on delete cascade,
  student_id     uuid not null references auth.users (id) on delete cascade,
  guardian_name  text,
  token          text not null unique default encode(gen_random_bytes(24), 'hex'),
  status         text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED')),
  created_at     timestamptz not null default now(),
  confirmed_at   timestamptz
);
create index if not exists guardian_consents_student_id_idx on public.guardian_consents (student_id);

alter table public.guardian_consents enable row level security;

-- Students read their own consent record (to render a status banner) — this
-- also exposes `token` back to them, which is fine: they're the ones who
-- received it in the first place, to share onward with their guardian.
drop policy if exists guardian_consents_select_own on public.guardian_consents;
create policy guardian_consents_select_own on public.guardian_consents
  for select using (student_id = auth.uid());

-- No insert/update policy for regular users: creation (onboarding) and
-- confirmation (the public /consentimento/[token] page, visited by a
-- guardian with no account at all) both go through the admin client in
-- server actions, the same pattern used for admin-only writes elsewhere
-- (e.g. app/(app)/admin/usuarios/actions.ts). The `token` itself — a 24-byte
-- random value — is the authorization for the confirm path, same trust
-- model as a password-reset link.
