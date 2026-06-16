# 03 — Arquitetura

## 3.1 Arquitetura atual

```
┌──────────────────────────────────────────────┐
│  Navegador (GitHub Pages)                      │
│  HTML + CSS + JS vanilla  (ProvaGen)           │
│  - formulário 5 etapas                         │
│  - FormData POST (JSON "dados" + PDF)          │
└───────────────────────┬──────────────────────┘
                        │  HTTPS (URL hardcoded)
                        ▼
┌──────────────────────────────────────────────┐
│  Cloudflare Tunnel (temporário)                │
└───────────────────────┬──────────────────────┘
                        ▼
┌──────────────────────────────────────────────┐
│  n8n (self-hosted)  — TODA a lógica de negócio │
│  Webhook → Validar → Switch (provedor)         │
│  → HTTP(Groq/Perplexity/DeepSeek/OpenAI/Gemini)│
│  → Parse → Build HTML → Webhook Response       │
└──────────────────────────────────────────────┘
```

**Características:** sem estado, sem banco, sem autenticação, um único módulo, lógica acoplada ao n8n, segredos e cota de IA sem proteção. Adequado para protótipo/demo; **inadequado para um SaaS multiusuário**.

## 3.2 Princípios da arquitetura futura

1. **IA-first.** Existe um **AI Orchestration Service** central que toda funcionalidade consome. A IA não é chamada ad-hoc; é um serviço de primeira classe com cota, fallback, cache e observabilidade.
2. **Multi-tenant desde o dia 1.** Todo dado pertence a um `tenant` (professor individual ou escola). Isolamento lógico via `tenant_id` + políticas de acesso por linha (RLS).
3. **API própria como única fonte de verdade.** O navegador nunca fala direto com provedores de IA nem com n8n. Tudo passa pela API autenticada.
4. **Modular / orientado a domínios.** Cada módulo (provas, atividades, turmas, tutor, simulados...) é um domínio com fronteiras claras — começa como módulo dentro de um monólito e pode virar serviço se a escala exigir.
5. **Stateless + escalável horizontalmente.** API sem estado, sessão via tokens, jobs pesados (geração/correção em lote) processados de forma assíncrona por filas.
6. **Segurança e privacidade por padrão.** Segredos no backend, rate limiting por usuário/plano, LGPD-by-design (dados de menores de idade exigem cuidado especial).

## 3.3 Arquitetura futura (alvo da V1 → V3)

```
┌───────────────────────────────────────────────────────────────┐
│                         CLIENTES                                │
│  Web App (SPA)        ·  Futuro: PWA / Mobile                   │
│  Ambiente Professor · Ambiente Aluno · Painel Admin            │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTPS / REST (ou tRPC/GraphQL)
                                │ Auth: JWT/Session
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      API GATEWAY / BACKEND                      │
│  AuthN/AuthZ (RBAC por perfil)  ·  Rate limiting por plano     │
│  Multi-tenant (tenant_id)        ·  Validação · Logs/auditoria │
├───────────────────────────────────────────────────────────────┤
│                    DOMÍNIOS / MÓDULOS                           │
│  Identidade & Assinaturas │ Provas │ Atividades │ Planos de aula│
│  Turmas │ Correção │ Tutor IA │ Simulados │ Plano de estudos    │
│  Flashcards │ Biblioteca │ Dashboards/Analytics                 │
├───────────────────────────────────────────────────────────────┤
│              AI ORCHESTRATION SERVICE (núcleo)                  │
│  Roteamento por tarefa/custo · Prompt templates versionados    │
│  Cota & créditos por plano · Fallback entre provedores         │
│  Cache semântico · Moderação · Observabilidade de custo/tokens │
│        └── Adapters: Groq · Perplexity · DeepSeek · OpenAI · Gemini
├───────────────────────────────────────────────────────────────┤
│              PROCESSAMENTO ASSÍNCRONO (Workers/Filas)          │
│  Geração em lote · Correção em lote · OCR/parse de PDF          │
│  Geração de flashcards · Relatórios · Envio de e-mails         │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌──────────────────────────────┐
│  Banco relacional (Postgres)│   │  Storage de arquivos (S3-like)│
│  + RLS multi-tenant         │   │  PDFs, materiais, exports     │
│  (ver 04-banco-de-dados)    │   └──────────────────────────────┘
└───────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────┐
│  Serviços de apoio                          │
│  - Cache (Redis): sessões, rate limit, cota │
│  - Busca/Vetorial: biblioteca + RAG do tutor│
│  - Billing (Stripe/assinaturas)             │
│  - Observabilidade (logs/métricas/traces)   │
└───────────────────────────────────────────┘
```

### O papel do n8n na arquitetura futura
O n8n pode **permanecer** — mas como **detalhe interno** atrás do AI Orchestration Service (ex.: orquestração de pipelines de conteúdo, integrações com sistemas externos da escola), **nunca** mais exposto ao navegador. A recomendação para produção é portar a lógica crítica de geração para código versionado e testável; o n8n fica para automações periféricas.

## 3.4 Recomendações de stack (sugestão, não imposição)

A escolha final cabe ao time, mas estas opções equilibram velocidade de entrega da V1 com escalabilidade:

| Camada | Sugestão pragmática | Alternativa robusta |
|--------|--------------------|---------------------|
| Frontend | React + TypeScript (Next.js) ou SvelteKit | Reaproveitar design system atual como base de tokens |
| Backend | Node.js (NestJS/Fastify) ou Next.js API routes | Backend dedicado se a escala B2B crescer |
| Banco | **PostgreSQL** (Supabase acelera auth + RLS + storage) | Postgres gerenciado (RDS/Cloud SQL) |
| Auth | Supabase Auth / Auth.js / Clerk | Keycloak (escolas com SSO) |
| IA | AI Orchestration próprio sobre os 5 provedores existentes | Camada de cache vetorial (pgvector) |
| Filas | Redis + BullMQ | SQS / Cloud Tasks |
| Storage | Supabase Storage / S3 | — |
| Billing | Stripe | Gateways locais (Brasil) p/ escolas |
| Busca/RAG | pgvector (Postgres) | OpenSearch / dedicated vector DB |

> **Nota:** Supabase é destacado porque entrega Postgres + Auth + Storage + RLS num pacote só, acelerando muito a fundação da V1 — alinhado, inclusive, com a "Melhoria Futura" já citada no README original (contas de professores e histórico).

## 3.5 Fluxos de negócio principais

### Fluxo A — Geração de avaliação (professor) ♻️ evolui o fluxo atual
```
Professor autentica → seleciona "Nova Prova" → preenche parâmetros
   → API valida + checa cota do plano
   → AI Orchestration escolhe provedor → gera ESTRUTURA (questões como dados)
   → API persiste prova + questões no banco (vinculadas ao tenant/professor)
   → Front renderiza prova editável (não mais HTML cru)
   → Professor edita/aprova → salva na Biblioteca / exporta PDF-Word / atribui à turma
   → Questões alimentam o Banco de Questões (reuso futuro)
```

### Fluxo B — Atribuição e resolução (professor → aluno)
```
Professor atribui avaliação/atividade a uma Turma (com prazo)
   → Alunos da turma recebem a tarefa no ambiente do aluno
   → Aluno resolve online (ou entrega) dentro do prazo
   → Respostas persistidas → disparam Correção Inteligente
```

### Fluxo C — Correção inteligente
```
Entrega do aluno → fila de correção
   → Objetivas: correção automática imediata
   → Discursivas: IA sugere nota + feedback individual (professor revisa/ajusta)
   → Notas e feedback gravados → atualizam dashboards do aluno e da turma
```

### Fluxo D — Tutor IA do aluno (RAG)
```
Aluno faz pergunta → API monta contexto (matéria, material da turma, histórico)
   → Recuperação semântica (biblioteca + materiais permitidos)
   → AI Orchestration responde adaptando linguagem ao nível do aluno
   → Interação registrada → vira sinal de desempenho e recomendação de estudo
```

### Fluxo E — Plano de estudos (aluno)
```
Aluno informa objetivo + data da prova + disponibilidade
   → IA gera cronograma + revisões + exercícios recomendados
   → Conforme o aluno avança/erra, plano se re-adapta (loop de personalização)
```

### Fluxo F — Geração de flashcards
```
Fonte (PDF/material/resumo/aula) → fila → OCR/parse
   → IA extrai conceitos-chave → gera flashcards (pergunta/resposta)
   → Revisão espaçada (SRS) agenda quando o aluno revê cada card
```

### Fluxo transversal — Cota e billing de IA
```
Toda chamada de IA → AI Orchestration debita créditos do plano (Redis)
   → Se exceder cota → bloqueia/oferece upgrade
   → Custo por provedor registrado para análise de margem
```

## 3.6 Decisões arquiteturais-chave (ADR resumido)

| Decisão | Escolha | Porquê |
|---------|---------|--------|
| Estrutura inicial | **Monólito modular** | Velocidade na V1; fronteiras de domínio permitem extrair serviços depois |
| Multi-tenant | `tenant_id` + RLS no Postgres | Isolamento simples e seguro sem multiplicar bancos |
| IA | Serviço central de orquestração | Controle de custo/cota/fallback; evita acoplamento a um provedor |
| Geração | IA retorna **dados estruturados**, não HTML | Destrava edição, versões, banco de questões e analytics |
| Backend exposto | API própria autenticada | Protege segredos e cota; navegador nunca toca provedores/n8n |
| Assíncrono | Filas para lote/IA pesada | Mantém API responsiva; escala por workers |

---

➡️ Próximo: [04 — Banco de Dados](./04-banco-de-dados.md)
