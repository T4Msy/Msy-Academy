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
| [12 — ADR: Stack](./docs/12-adr-stack.md) | **Decisões técnicas do MVP (Next + Supabase)** |

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js (App Router) · React · TypeScript |
| Backend/Dados | Supabase — Postgres + Auth + Storage + RLS |
| IA | Rota autenticada → n8n server-side (embrião do AI Orchestration Service) |
| Export | html2pdf.js · html-docx-js (carregados sob demanda) |
| Design | Design system próprio (portado de `legacy/`) |

## 🚀 Como rodar (desenvolvimento)

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY e N8N_WEBHOOK_URL

# 3. Banco: aplique a migração em supabase/migrations/0001_init.sql
#    - via Supabase SQL Editor (copiar/colar), ou
#    - via CLI:  supabase db push   (após supabase link)

# 4. Dev server
npm run dev        # http://localhost:3000
```

> **Auth:** para o cadastro entrar direto (sem confirmar e-mail) em ambiente de desenvolvimento, desative a confirmação de e-mail no painel do Supabase (Authentication → Providers → Email). Caso contrário, o usuário criado precisa confirmar o e-mail antes do primeiro login.

### Fluxo ponta-a-ponta
1. **Cadastro** → um `tenant` + `profile` + papel `PROFESSOR` são criados por trigger.
2. **Nova Prova** (`/provas/nova`) → o formulário chama `POST /api/exams/generate`, que fala com o n8n **no servidor** e salva a prova.
3. **Minhas Provas** (`/dashboard`) → histórico, isolado por tenant via RLS.
4. **Abrir uma prova** → preview + exportar **PDF / Word / Imprimir**.

## 📁 Estrutura

```
app/                     # Next App Router (auth, dashboard, provas, api)
components/              # Componentes compartilhados (Header, Logo)
lib/supabase/            # Clientes SSR (browser, server, middleware)
lib/exam/                # Parsers portados: buildPayload, extractHtml, tipos
supabase/migrations/     # Schema + RLS + trigger de signup
docs/                    # 📚 Documentação oficial do produto
legacy/                  # 🗄️ Protótipo vanilla original (ProvaGen) — referência
```

## 🗄️ Sobre `legacy/`

O protótipo original (HTML/CSS/JS + webhook n8n) foi preservado em [`legacy/`](./legacy) para referência histórica e de design. Ele **não** faz parte do build da plataforma.

## 👤 Autor

**Tales — T4 MASAYOSHI** · Professor de informática · Estudante de Sistemas de Informação · Entusiasta de IA e automação

[![GitHub](https://img.shields.io/badge/GitHub-t4msy-181717?style=flat-square&logo=github)](https://github.com/t4msy)
