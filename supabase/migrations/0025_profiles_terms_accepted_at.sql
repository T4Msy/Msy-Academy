-- Persiste o aceite dos Termos de Uso / Política de Privacidade (RNF-C01),
-- hoje só um checkbox de UI nunca gravado no banco. Necessário como backstop
-- server-side para o login via Google (RF-G01), que pula o formulário de
-- cadastro por e-mail/senha inteiro — sem esta coluna não há como o
-- middleware garantir que um usuário OAuth aceitou os termos antes de usar
-- o produto.
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- Backfill: todo usuário existente já clicou no checkbox antes de criar a
-- conta (só não ficou gravado) — tratamos a aceitação anterior como válida
-- em vez de forçar todo mundo a re-aceitar no próximo login.
update public.profiles set terms_accepted_at = created_at where terms_accepted_at is null;
