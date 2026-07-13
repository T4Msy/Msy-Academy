<div align="center">

# 🎓 MSY Academy

### Plataforma educacional IA-first — ensino, provas, correção e evolução em um só lugar

</div>

---

MSY Academy é uma plataforma educacional **IA-first** para professores, alunos e instituições. O antigo **Gerador de Provas** (ProvaGen) deixa de ser o produto e passa a ser **um módulo** dentro dela.

Este repositório está em transição do protótipo para a plataforma. A **primeira fatia vertical do MVP** já está implementada: **contas de professor + gerador de provas migrado para uma API autenticada + persistência (histórico) + exportação**.

## 📚 Documentação oficial

Toda a visão, arquitetura, banco de dados, requisitos, roadmap e decisões vivem em **[`docs/`](./docs)** — a fonte de verdade do produto. Comece por:

| Doc | Conteúdo |
|-----|----------|
| [01 — Produto](./docs/01-produto.md) | Visão, público, proposta de valor, modelo de negócio |
| [03 — Arquitetura](./docs/03-arquitetura.md) | Arquitetura atual → alvo, fluxos, princípios |
| [04 — Banco de Dados](./docs/04-banco-de-dados.md) | Schema multi-tenant (Postgres + RLS) |
| [08 — Roadmap](./docs/08-roadmap.md) | MVP → V1 → V2 → V3 |
| [12 — ADR: Stack](./docs/12-adr-stack.md) | Decisões técnicas do MVP (Next + Supabase) |
| [13 — ADR: Revisão Arquitetural 2026-07](./docs/13-adr-revisao-arquitetural-2026-07.md) | **Decisões vigentes de stack, Design System, dados e IA** |
| [14 — Design System: Guidelines](./docs/14-design-system-guidelines.md) | Princípios, tokens e regras de uso do DS (doc viva em `/design-system`) |

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js (App Router) · React · TypeScript |
| UI / Design System | Tailwind v4 · shadcn/ui tematizado · Lucide · Motion — tokens próprios (terracota, Inter/Inter Tight), showcase em `/design-system` |
| Dados no client | TanStack Query (prefetch no server + hidratação) · Zustand |
| Backend/Dados | Supabase — Postgres + Auth + Storage + RLS multi-tenant |
| IA | `lib/ai/` — provider registry (anthropic/echo/mock) + orchestrator com quota e auditoria; prompts versionados |
| Export | @react-pdf/renderer (PDF) · docx (Word) · OMR para gabaritos (sharp/jsqr) |
| Qualidade | TypeScript strict · ESLint flat + Prettier · Vitest · CI (typecheck+lint+test+build) |

## 🚀 Como rodar (desenvolvimento)

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e
# SUPABASE_SERVICE_ROLE_KEY. IA roda com AI_PROVIDER=mock sem custo;
# para IA real: AI_PROVIDER=anthropic + ANTHROPIC_API_KEY.

# 3. Banco: aplique as migrações de supabase/migrations/ em ordem
#    - via CLI:  supabase db push   (após supabase link), ou
#    - via Supabase SQL Editor (copiar/colar)

# 4. Dev server
npm run dev        # http://localhost:3000
```

> **Auth:** para o cadastro entrar direto (sem confirmar e-mail) em ambiente de desenvolvimento, desative a confirmação de e-mail no painel do Supabase (Authentication → Providers → Email). Caso contrário, o usuário criado precisa confirmar o e-mail antes do primeiro login.

### Fluxo ponta-a-ponta
1. **Cadastro** → um `tenant` + `profile` + papel são criados por trigger; onboarding define o ambiente.
2. **Professor** → cria provas/atividades/planos com IA (`/professor/provas/nova` → `POST /api/ai/exams/generate`), gerencia turmas, biblioteca e correção (inclusive por gabarito escaneado/OMR).
3. **Aluno** → tarefas, simulados, flashcards (SRS), plano de estudos e tutor de IA com RAG.
4. **Tudo isolado por tenant via RLS**; uso de IA auditado em `ai_interactions` com quota mensal por plano.

## 📁 Estrutura

```
app/                     # App Router: (public), (app)/{professor,aluno,admin}, api
app/design-system/       # Doc viva do DS (showcase dos componentes reais)
components/ui/           # Primitivas do Design System (shadcn tematizado)
components/<domínio>/    # Componentes por domínio (shell, settings, charts…)
hooks/                   # Queries TanStack (useClassStats…) e stores
lib/<domínio>/           # ai, auth, billing, dashboard, exam, omr, query, srs, supabase
supabase/migrations/     # Schema + RLS + RPCs (aplicar em ordem)
docs/                    # 📚 Documentação oficial do produto (ADRs 12–13)
```

## 👤 Autor

**Tales — T4 MASAYOSHI** · Professor de informática · Estudante de Sistemas de Informação · Entusiasta de IA e automação

[![GitHub](https://img.shields.io/badge/GitHub-t4msy-181717?style=flat-square&logo=github)](https://github.com/t4msy)
