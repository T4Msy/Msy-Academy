# Autenticação — como funciona

Documento de referência de como login, cadastro, sessão e consentimento funcionam na MSY Academy hoje. Atende RF-G01 (cadastro/login por e-mail/senha + OAuth Google) e RNF-C01..C07 (LGPD/consentimento) de `docs/05-requisitos-funcionais.md` e `docs/06-requisitos-nao-funcionais.md`.

## 1. Visão geral

Toda autenticação passa pelo Supabase Auth (`@supabase/ssr`), que emite um cookie de sessão idêntico não importa o método usado — e-mail/senha ou OAuth. `lib/supabase/server.ts` expõe `createClient()` (client autenticado, respeita RLS) e `createAdminClient()` (service role, bypassa RLS, só server-side). `lib/supabase/middleware.ts` roda em toda requisição, atualiza a sessão e decide as regras grossas de roteamento.

Dois métodos de entrada:
- **E-mail/senha** — formulário próprio (`/login`, `/cadastro`), Server Actions em `lib/auth/actions.ts`.
- **Google OAuth** (RF-G01) — botão em `components/auth/GoogleSignInButton.tsx`, controlado por `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED`. Setup completo em `docs/17-setup-google-oauth.md`.

## 2. Fluxo e-mail/senha (`lib/auth/actions.ts`)

- **`login(formData)`** — `supabase.auth.signInWithPassword`. Erro vira `redirect("/login?error=...")`, nunca `throw` (Next.js redige mensagens de `throw` em Server Actions no build de produção — ver `lib/settings/actions.ts` e o resto deste arquivo pro mesmo padrão).
- **`signup(formData)`** — valida consentimento (`consent === "on"`) antes de qualquer chamada ao Supabase; chama `signUp({email, password, options:{data:{full_name}}})`; se a confirmação por e-mail estiver ativa no projeto (`!data.session`), manda pra `/login` com aviso; senão, grava `terms_accepted_at` no perfil e manda pra `/onboarding`.
- **`logout()`** — `signOut()` + redirect.
- **`requestPasswordReset(formData)`** — sempre retorna a mesma mensagem genérica de sucesso, mesmo se o e-mail não existir ou a requisição for barrada por rate limit (anti-enumeração). O link do e-mail aponta pra `/auth/callback?next=/redefinir-senha&flow=recovery`.
- **`updatePassword(formData)`** — exige uma sessão de recovery já estabelecida (pelo `/auth/callback`); troca a senha via `updateUser`.

## 3. Fluxo Google OAuth

1. Usuário clica em "Continuar com Google" (`GoogleSignInButton.tsx`) → `supabase.auth.signInWithOAuth({provider:"google", options:{redirectTo:".../auth/callback?next=...&flow=oauth"}})`.
2. Supabase troca com o Google e redireciona pro app em `/auth/callback` com um `code` (PKCE).
3. `app/auth/callback/route.ts` faz `exchangeCodeForSession(code)`. O parâmetro `flow` (`oauth` ou `recovery`, default `recovery` pra compatibilidade com links antigos) decide pra onde mandar em caso de falha — `/login?error=...` pro Google, `/recuperar-senha?error=...` pra recovery. Sucesso sempre vai pro `next`.
4. O trigger `handle_new_user()` (`supabase/migrations/0019_billing_admin.sql`) já cria `tenants`+`profiles`+`subscriptions` de forma idêntica pra Google ou e-mail/senha — nenhuma mudança de schema foi necessária pra isso funcionar.
5. Como o Google pula o formulário de `/cadastro` (e o checkbox de consentimento nele), o usuário cai no gate de `/consentimento-conta` na primeira navegação protegida — ver seção 6.

Guia completo de configuração externa (Google Cloud Console + Supabase Dashboard): `docs/17-setup-google-oauth.md`.

## 4. Sessão e middleware (`lib/supabase/middleware.ts`)

Ordem de checagem em toda requisição autenticada (depois do refresh de sessão):

1. **Rate limit** (`/api/ai/**`, `/api/search`) — não relacionado a auth em si, mas roda no mesmo arquivo.
2. **Não autenticado + rota protegida** → `/login?redirect=...`.
3. **Consentimento** (`profiles.terms_accepted_at is null`) → `/consentimento-conta` (seção 6). Roda antes do onboarding porque aceitar os termos é pré-condição pra usar o produto, não uma questão de role.
4. **Sem role ainda** (`user_roles` vazio) → `/onboarding`.
5. **Com role** → `/professor` ou `/aluno`.

Guards mais finos (PROFESSOR vs ALUNO) ficam em `app/(app)/professor/layout.tsx` / `app/(app)/aluno/layout.tsx`, fora do escopo deste middleware.

## 5. Onboarding

`app/onboarding/actions.ts` (`completeOnboarding`) insere a role escolhida em `user_roles` — não depende de qual método de auth foi usado, só verifica que existe uma sessão. Onboarding também é onde o consentimento de responsável pra menores é iniciado (RNF-C02, `guardian_consents`, ver `/consentimento/[token]` — fluxo diferente do desta seção, ver abaixo).

## 6. Consentimento LGPD (RNF-C01)

Duas camadas, complementares:

- **Checkbox no cadastro** (`components/auth/SignupConsent.tsx`) — re-checado no server em `signup()` antes de criar a conta. Cobre o fluxo e-mail/senha.
- **Persistência + gate server-side** (`profiles.terms_accepted_at`, migration `0025_profiles_terms_accepted_at.sql`) — necessário porque, até esta rodada, o consentimento nunca era gravado no banco pra nenhum dos dois métodos, e o Google pula o checkbox inteiro (o único gate que existia pra ele era um `disabled` client-side, contornável chamando a API do Supabase direto). Qualquer usuário autenticado com `terms_accepted_at` nulo é redirecionado pelo middleware pra `/consentimento-conta` (`app/consentimento-conta/page.tsx` + `actions.ts`), onde aceita os termos e a coluna é gravada via `update` normal (RLS `profiles_update_own` já permite).

**Não confundir com `/consentimento/[token]`** — esse é o fluxo de um responsável legal (sem conta na plataforma) aprovando a conta de um aluno menor de idade (RNF-C02, `guardian_consents`). São conceitos e atores completamente diferentes: `/consentimento-conta` é o próprio dono da conta aceitando os Termos/Privacidade; `/consentimento/[token]` é um terceiro aprovando a conta de outra pessoa.

Usuários que já existiam antes desta coluna existir tiveram `terms_accepted_at` preenchido com `created_at` (backfill na migration) — não precisam re-aceitar nada.

## 7. Rate limiting

`lib/ratelimit.ts` (categoria `"auth"`, 5 tentativas / 10 minutos por IP, via `lib/http/client-ip.ts`) protege `login`, `signup` e `requestPasswordReset` — chaveado por IP porque essas três rotas não exigem (ou ainda não têm) um usuário autenticado pra chavear por user id, diferente do rate limit de IA (`lib/supabase/middleware.ts`), que é por user id. `updatePassword` fica de fora — exige uma sessão de recovery já estabelecida, superfície de abuso bem menor. Sem `UPSTASH_REDIS_REST_URL`/`TOKEN` configuradas, é um no-op (nunca bloqueia, nunca derruba o app).

## 8. CAPTCHA (Cloudflare Turnstile)

`components/auth/TurnstileWidget.tsx`, renderizado em `/login`, `/cadastro` e `/recuperar-senha`. Sem `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, o componente retorna `null` (nenhum widget, nenhum token) e os fluxos continuam funcionando normalmente. O Supabase Auth verifica o token 100% do lado dele (`options.captchaToken` nas chamadas `signInWithPassword`/`signUp`/`resetPasswordForEmail`) — nenhum backend de verificação próprio necessário.

**Ordem de deploy obrigatória**: subir o código que envia o token → confirmar que login/cadastro reais continuam funcionando → só então ligar "Enable CAPTCHA protection" no Supabase Dashboard (Authentication → Attack Protection). Ligar o toggle antes do código estar em produção bloqueia todo mundo, inclusive quem está testando. Esta é a única integração deste documento onde a env var e um toggle de dashboard precisam andar em lockstep — todas as outras (Upstash, Google, Resend) degradam de forma independente.

## 9. E-mail transacional (Resend) — recuperação de senha

Hoje `requestPasswordReset` usa o envio de e-mail nativo do Supabase (genérico, sem marca, com limites de volume). Trocar por um provedor dedicado nesta rodada é **puramente configuração de dashboard, sem diff de código**:

1. Criar conta no [Resend](https://resend.com) e verificar um domínio de envio (registros SPF/DKIM).
2. No Resend, aba **SMTP**, pegar host/porta/usuário e gerar uma API key (usada como senha SMTP).
3. Supabase Dashboard → **Project Settings → Auth → SMTP Settings** → preencher com os dados do Resend → salvar.
4. Mandar um e-mail de teste pelo próprio dashboard.
5. (Opcional) editar o template de recuperação de senha em **Auth → Email Templates**.

**Nenhuma `RESEND_API_KEY` entra no `.env` deste app Next.js** com essa abordagem — o app nunca fala com o Resend diretamente, é o Supabase quem envia os e-mails usando o relay SMTP configurado. Uma `RESEND_API_KEY` só seria necessária se, no futuro, um **Auth Hook** (Edge Function que intercepta o evento de "enviar e-mail" e chama a API do Resend direto, pra template 100% customizado em todos os e-mails de auth, não só recuperação de senha) fosse adotado — nesse caso a chave viveria como secret de Edge Function no Supabase, não como env var do Next.js. Isso fica como melhoria futura, não construído nesta rodada.

## 10. Referências

- Guia de setup do Google: `docs/17-setup-google-oauth.md`.
- Migration do consentimento: `supabase/migrations/0025_profiles_terms_accepted_at.sql`.
- Requisitos: `docs/05-requisitos-funcionais.md` (RF-G01), `docs/06-requisitos-nao-funcionais.md` (RNF-C01..C07).
