# Guia — habilitar login com Google (RF-G01)

Passo a passo para configurar o login com Google de verdade. Todo o trabalho de código já está pronto (`components/auth/GoogleSignInButton.tsx`, `app/auth/callback/route.ts`, o gate de consentimento em `/consentimento-conta`) — o que falta é 100% configuração externa (Google Cloud Console + Supabase Auth Dashboard), que só quem tem acesso a essas contas consegue fazer.

## 1. Criar as credenciais no Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/) e crie (ou selecione) um projeto.
2. Vá em **APIs & Services → OAuth consent screen** e configure o básico (nome do app, e-mail de suporte, domínio). Para uso interno/teste, "External" + modo "Testing" já basta antes de publicar.
3. Vá em **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Tipo de aplicação: **Web application**.
5. **Authorized JavaScript origins**: o domínio real do app (ex: `https://academia.msy.com.br`, e `http://localhost:3000` se quiser testar localmente contra o provider real).
6. **Authorized redirect URIs**: `https://<project-ref>.supabase.co/auth/v1/callback` — substitua `<project-ref>` pela referência do seu projeto Supabase (aparece na URL do dashboard e em `NEXT_PUBLIC_SUPABASE_URL`). **Esta URL é do Supabase, não do seu app** — é o Supabase quem recebe o retorno do Google, não o Next.js diretamente.
7. Salve e copie o **Client ID** e o **Client Secret** gerados.

## 2. Habilitar o provider no Supabase

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) do projeto.
2. Vá em **Authentication → Providers → Google**.
3. Ative o toggle, cole o **Client ID** e o **Client Secret** do passo anterior.
4. Salve.
5. Ainda em **Authentication → URL Configuration**, confira que **Site URL** e **Additional Redirect URLs** batem com o domínio real do app (e `http://localhost:3000` se for testar localmente) — sem isso o Supabase pode recusar o redirect de volta pro app mesmo com o provider Google configurado certo.

## 3. Ligar no código

1. No ambiente de deploy (Vercel ou onde o app rodar), defina a env var:
   ```
   NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
   ```
2. Redeploy (ou reinicie o dev server local, se `.env.local`).

## 4. Testar ponta a ponta

1. Acesse `/login` — o botão "Continuar com Google" deve estar habilitado (sem o chip "Em breve").
2. Clique, escolha uma conta Google, autorize.
3. Você deve cair primeiro em `/consentimento-conta` (só na primeira vez — é o gate de LGPD, já que o login por Google pula o checkbox do formulário de cadastro), aceitar os termos, e então em `/onboarding`.
4. Confira no banco (`profiles`, filtrando pelo seu `id`) que `terms_accepted_at` foi preenchido.

## 5. Troubleshooting

- **`redirect_uri_mismatch`**: a Authorized redirect URI no Google Cloud Console não bate exatamente com `https://<project-ref>.supabase.co/auth/v1/callback` (confira barra final, http vs https, etc.).
- **Erro genérico "Não foi possível entrar com o Google"** (mensagem do próprio app, `app/auth/callback/route.ts`): normalmente o provider Google ainda não está habilitado no Supabase Dashboard, ou o Client ID/Secret estão errados.
- **Botão continua "Em breve"**: `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` não está setada como `"true"` no ambiente que você está testando, ou o deploy/restart não pegou a env var nova.
- **Login funciona mas trava em `/consentimento-conta`**: comportamento esperado na primeira vez — é o usuário precisando aceitar os termos. Se o loop persistir depois de aceitar, confira se a policy `profiles_update_own` (migration `0001_init.sql`) segue ativa e se `supabase.from("profiles").update(...)` em `app/consentimento-conta/actions.ts` não está retornando erro (logs do servidor).
