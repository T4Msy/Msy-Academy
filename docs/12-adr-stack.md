# 12 — ADR: Stack e Fundação Técnica (MVP Fatia 1)

> Este documento **fecha** a pendência apontada em [03 — Arquitetura](./03-arquitetura.md) ("escolher a stack definitivamente") e registra as decisões tomadas ao implementar a **primeira fatia vertical do MVP**: contas + gerador migrado + persistência.

Status: **Aceito** · Escopo: MVP de Fundação · Ver roadmap [08](./08-roadmap.md).

---

## Contexto

O protótipo era HTML/CSS/JS vanilla (`legacy/`) + webhook n8n hardcoded, sem contas, backend, banco ou persistência. O objetivo desta fatia é atingir o **critério de saída do MVP**: _"um professor cria conta, gera e salva provas, exporta — tudo seguro e persistido"_.

## Decisões

### ADR-01 — Frontend: Next.js (App Router) + React + TypeScript
- **Porquê:** o prompt de produto exige React; o App Router entrega SSR, rotas e API num só framework, e prepara Web → PWA/Mobile/Electron (RNF em [06](./06-requisitos-nao-funcionais.md)).
- **Alternativa descartada:** SvelteKit (menor ecossistema React/mobile).

### ADR-02 — Backend/Dados: Supabase (Postgres + Auth + Storage + RLS)
- **Porquê:** entrega multi-tenant com RLS, autenticação e storage num pacote — o caminho mais rápido para a fundação, como já sinalizado em [03 §3.4](./03-arquitetura.md). Segredos e cota ficam no servidor.
- **Alternativa descartada (por ora):** backend Node dedicado (NestJS/Fastify) — reavaliar se a escala B2B exigir portabilidade.

### ADR-03 — IA atrás de rota autenticada (embrião do AI Orchestration Service)
- O navegador **nunca** chama o n8n. `POST /api/exams/generate` (server-side) valida o usuário, chama o `N8N_WEBHOOK_URL` (env secreto) e persiste o resultado. Cumpre o princípio "API própria como única fonte de verdade" ([03 §3.2](./03-arquitetura.md)).

### ADR-04 — Persistência pragmática: HTML agora, dados estruturados no fast-follow
- Nesta fatia a prova é salva como `generation_params` (JSONB, 1:1 com `buildExamParams`) **+ `generated_html`**. **Não** normalizamos em `questions`/`exam_questions` ainda.
- **Trade-off consciente:** o critério de saída do MVP não exige estrutura; salvar HTML destrava a jornada ponta-a-ponta imediatamente. A **IA-retorna-dados-estruturados** (que destrava edição, versões e banco de questões — [03 §3.6](./03-arquitetura.md)) é o **próximo passo imediato**.

### ADR-05 — Design system reaproveitado diretamente
- O CSS do protótipo (`legacy/styles.css`) já é um design system coeso. Foi **portado como stylesheet global** (`app/globals.css`) preservando tokens e classes, em vez de reescrito em Tailwind — **menos risco, fidelidade total**. Tailwind pode ser adotado depois sem perder os tokens.

## Estrutura entregue

```
app/(auth)/{login,signup}        · autenticação (Supabase Auth) + server actions
app/(app)/dashboard              · histórico de provas (RLS)
app/(app)/provas/nova            · formulário 5 etapas migrado (ExamForm)
app/(app)/provas/[id]            · preview + export (PDF/Word/print)
app/api/exams/generate           · rota autenticada → n8n server-side → persiste
lib/supabase/{client,server,middleware} · clientes SSR
lib/exam/{buildPayload,extractHtml,types} · parsers portados de legacy/script.js
supabase/migrations/0001_init.sql · tenants, profiles, user_roles, exams + RLS + trigger
middleware.ts                    · refresh de sessão + guard de rotas
```

## Consequências
- Débitos [10](./10-debitos-tecnicos.md) endereçados: webhook hardcoded → env server-side; sem auth → Supabase Auth; sem persistência → Postgres + RLS; monólito vanilla → app componentizado.
- Débitos remanescentes: geração ainda retorna HTML (ADR-04); n8n workflow ainda não versionado no repo; sem testes automatizados ainda.

## Próximo passo imediato
IA retornando **dados estruturados** → popular `questions`/`exam_questions`, tornando a prova editável. Depois, seguir o roadmap V1 (Turmas, atribuições, ambiente do Aluno, cota/billing).

---

⬅️ Anterior: [11 — Análise de Concorrentes](./11-analise-concorrentes.md)
