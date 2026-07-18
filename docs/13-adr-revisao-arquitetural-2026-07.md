# ADR 13 — Revisão Arquitetural (julho/2026)

**Status:** aceito · **Data:** 2026-07-13 · **Decisores:** Tales (product owner) + sessão de arquitetura com IA
**Contexto:** elevar a MSY Academy a padrão de produto premium antes de novas features. Revisão conduzida como sessão estruturada de decisões (5 etapas), partindo de diagnóstico completo do código. Substitui o ADR 12 onde conflitar.

## Diagnóstico que motivou as decisões (resumo)

Pontos fortes: arquitetura server-first limpa (Server Components + 22 arquivos de Server Actions + 9 route handlers), Supabase maduro (21+ migrations, RLS multi-tenant, RPCs security definer), camada de IA abstraída (registry/orchestrator/prompts versionados), CSS próprio token-driven com dark/light e a11y deliberada.

Lacunas: nenhuma primitiva React (páginas escrevem strings de classe à mão; overlays sem focus trap), validação de input por `if`s manuais, estado client via useState/fetch ad hoc, embeddings placeholder (RAG do tutor não é semântico de verdade), zero observabilidade/rate limiting, testes ~2,4%, lint inexistente, docs defasados (n8n).

## Decisões

### Etapa 1 — Fundação de UI e estado
1. **Tailwind v4 + shadcn/ui** como base de UI, migração completa. Tokens existentes portados para `@theme`; shadcn tematizado com a identidade própria (nunca o visual default).
2. **Ritmo: fundação primeiro** (base+tokens+primitivas+shell), depois migração página a página (professor → aluno → admin). Features novas nascem no DS; CSS legado convive em cascade layer e é deletado por seção.
3. **TanStack Query + Zustand como padrão global de estado client** (escolha do product owner; a alternativa server-first-pontual foi avaliada e descartada por ele).
4. **Identidade visual: manter e refinar** — dark-first, terracota `#D97757`, Inter Tight (display) + Inter (body). Refinar = type scale formal, spacing scale, estados, microinterações. Sem rebrand.

### Etapa 2 — Design System e organização
5. **Integração do TanStack Query: prefetch no server + `HydrationBoundary`** (padrão oficial TanStack para App Router). Server Component faz `prefetchQuery` com o client Supabase autenticado; `useQuery` assume no client; mutações continuam Server Actions que invalidam as query keys. Piloto: dashboard do professor (`hooks/useClassStats.ts`).
6. **Espaçamento: escala padrão do Tailwind (4px).** **Tipografia: type scale própria** (tokens `--text-2xs`…`--text-4xl`, incl. `--text-md` 14px para controles), Inter Tight/Inter.
7. **Doc viva do DS: rota `/design-system`** (ADMIN em prod, sessão em dev) renderizando os componentes reais + `docs/14-design-system-guidelines.md`.
8. **Organização: evolução da estrutura atual** — `app/` + `components/ui` (primitivas) + `components/<domínio>` + `hooks/` (queries/stores) + `lib/<domínio>`. Sem migração para `src/features`.

### Etapa 3 — Forms, validação e libs de feature
9. **React Hook Form + Zod como contrato único**: todo form usa RHF + zodResolver; toda Server Action/route handler valida com o MESMO schema (`lib/<domínio>/schemas.ts`), incluindo payloads de IA.
10. **Tiptap como editor padrão de conteúdo rico** (`<RichTextEditor>` no DS; armazenar JSON, não HTML cru).
11. **Recharts tematizado** (tokens `--cat-1..8`, wrappers do DS; substitui os charts SVG autorais).
12. **Lucide como set único de ícones** (feito — `navIcons.tsx` é adapter fino). **Motion para microinterações com guidelines** (durações/easings tokenizados, `prefers-reduced-motion`, CSS para o trivial).

### Etapa 4 — Arquitetura de IA
13. **Embeddings reais: Voyage AI** (recomendado pela Anthropic). Migrar `vector(8)` para a dimensão do modelo + re-ingest dos materiais.
14. **Vercel AI SDK como motor de IA** (streamText/generateObject/useChat; provider via AI Gateway). O orchestrator próprio PERMANECE envolvendo o SDK (quota + auditoria + prompt registry versionado) e vira choke point único — o tutor deixa de bypassá-lo.
15. **Primitivas de IA no DS**: indicador de geração/streaming, container de conteúdo gerado (regenerar/editar/aceitar), indicador de quota, erro 402 padronizado, badge "gerado por IA".

### Etapa 5 — Qualidade, segurança e observabilidade
16. **Testes: pirâmide pragmática** — Vitest (lógica+schemas), Testing Library (primitivas do DS + componentes de IA), Playwright E2E nos ~5 fluxos críticos (login, criar prova com IA, responder tarefa, correção, billing). Meta = fluxos protegidos, não % de coverage.
17. **ESLint 9 flat (eslint-config-next core-web-vitals + typescript) + Prettier com plugin Tailwind.** Lint é etapa do CI. Dívida pré-existente (anys, setState-in-effect) está como `warn` com prazo: vira `error` ao final da migração da Fase 2.
18. **Sentry (errors+tracing com contexto tenant/rota) + Vercel Analytics/Speed Insights.** PostHog adiado até haver base de usuários.
19. **`@upstash/ratelimit` nas rotas quentes** — IA (por usuário), auth/signup (por IP), busca.

### Decisões declaradas (sem fork)
- Fontes via `next/font` (feito — vars `--font-inter`/`--font-inter-tight`).
- Toasts padronizados: sonner via shadcn, montado no root (resolve lacuna de aria-live).
- Focus management de overlays via Radix (feito no shell: UserMenu/NotificationBell/RenameDeleteMenu).
- Docs sincronizados com o código (este ADR + README/.env.example corrigidos; n8n/html2pdf/legacy removidos).

## Roadmap de execução

- **Fase 1 — Fundação (CONCLUÍDA nesta revisão):** Tailwind v4 em cascade layers (`app/tailwind.css`), 18 primitivas tematizadas em `components/ui/`, Lucide, overlays do shell em Radix, TanStack Query com piloto hidratado, ESLint/Prettier/CI, `/design-system`, docs.
- **Fase 2 (CONCLUÍDA):** ~90 arquivos de páginas/componentes convertidos de classes legadas para utilities do DS (tradução fiel sobre os mesmos tokens); os 5 forms de geração por IA em RHF+Zod com contrato único client/server (`lib/*/schemas.ts` validando também nos route handlers) + QuotaNotice/useAiGenerate; primitivas de IA (AiThinking/AiBadge/QuotaNotice/GeneratedContentActions) e PageHeader; `<RichTextEditor>` (Tiptap) e camada Recharts tematizada (`components/charts/recharts.tsx`) prontos no DS — a adoção do Tiptap nos conteúdos gerados acontece com a mudança de formato de armazenamento na Fase 3 (hoje texto puro alimenta o export PDF/DOCX); lint promovido a error (anys tipados na fronteira PostgREST, shell em useSyncExternalStore, GlobalSearch em useQuery); globals.css podado de 155 regras órfãs (2.177 → 1.732 linhas). Permanecem no globals.css, por decisão: shell (sidebar/topbar/tab bar), landing/legal (folha própria da página de marketing) e blocos coesos single-consumer (tutor chat, scanner OMR, dropzone, opt-check, ia-tile, error/404) — cada um migra quando sua tela for redesenhada.
- **Fase 3:** motor de IA — Vercel AI SDK sob o orchestrator; Voyage embeddings + re-ingest; tutor via orchestrator.
- **Fase 4:** Sentry + Vercel Analytics; @upstash/ratelimit; revisão de sanitização — **concluída em 2026-07-17**: a coluna `exams.generated_html` citada aqui já não existe (removida na migration `0005_ai_exams_questions.sql`, antes deste próprio ADR ser escrito); todo conteúdo gerado por IA hoje é `text`/`jsonb` puro, renderizado via interpolação JSX (`{q.statement}`), escapado por padrão pelo React — nenhum vetor de XSS ativo encontrado (auditoria completa do repo por `dangerouslySetInnerHTML`: único uso é o script estático de tema em `app/layout.tsx`, sem relação com IA). Adicionados headers de defesa em profundidade (`next.config.mjs`: CSP, `X-Frame-Options`, `X-Content-Type-Options`, etc.) mesmo sem vetor ativo. Guardrail para quando o Tiptap for conectado a conteúdo de IA (Fase 3) em `docs/15-guardrail-sanitizacao-tiptap.md`.
- **Fase 5:** Playwright E2E dos fluxos críticos; remoção final do globals.css legado (ligar preflight).

## Consequências

- Curto prazo: dois sistemas visuais convivem (layer `legacy` abaixo de `utilities` garante que o DS sempre vence conflitos); custo de manutenção temporário aceito conscientemente.
- `next lint` deprecado → lint SÓ via `npm run lint` (CI); `eslint.ignoreDuringBuilds` permanece true com essa justificativa.
- Toda tela nova DEVE nascer no DS (primitivas + tokens). Strings de classe legadas (`btn btn-primary`, `card`) são proibidas em código novo.
