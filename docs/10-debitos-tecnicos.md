# 10 — Débitos Técnicos

> Débitos identificados na análise do código atual ([02](./02-analise-projeto-atual.md)) + melhorias e refatorações necessárias para sustentar a plataforma. Classificados por **severidade** (🔴 crítico · 🟠 alto · 🟡 médio · 🟢 baixo) e marcados como **bloqueante de V1** quando impedem o lançamento como SaaS.

## 10.1 Débitos críticos (bloqueantes de V1)

| ID | Débito | Severidade | Impacto | Ação |
|----|--------|-----------|---------|------|
| DT-01 | **Sem autenticação/contas** | 🔴 | Impossível ter professor/aluno, multi-tenant ou cobrança | Construir auth + RBAC + multi-tenant (Épico 1) |
| DT-02 | **Sem persistência/banco** | 🔴 | Nada é salvo; sem histórico/biblioteca/banco de questões | Implementar Postgres conforme [04](./04-banco-de-dados.md) |
| DT-03 | **Webhook hardcoded + túnel temporário** (`script.js:10`, `trycloudflare.com`) | 🔴 | URL instável, quebra em produção; sem ambiente confiável | API própria autenticada; n8n atrás do backend |
| DT-04 | **Segredos/cota de IA expostos** — qualquer um com a URL do webhook consome crédito | 🔴 | Custo descontrolado, abuso | Segredos no backend + auth + rate limit + cota por plano (RNF-S01/S04/S05) |
| DT-05 | **Lógica de negócio só no n8n, não versionada** (workflow citado no README não está no repo) | 🔴 | Sem versionamento/teste/CI; "verdade" fora do código | Portar geração crítica para código versionado e testável |

## 10.2 Débitos altos

| ID | Débito | Severidade | Impacto | Ação |
|----|--------|-----------|---------|------|
| DT-06 | **Prova como HTML cru em iframe** (`renderProva`) | 🟠 | Sem edição, sem reuso, sem versões, sem analytics; risco de **XSS** ao injetar HTML da IA | IA retorna **dados estruturados**; renderizar e sanitizar no front (RNF-S07) |
| DT-07 | **Front sem componentização/build** (JS vanilla, manipulação direta de DOM) | 🟠 | Não escala para 12 módulos; difícil manter/testar | Migrar p/ framework componentizado preservando UX e design system |
| DT-08 | **Sem testes automatizados** (nenhum teste no repo) | 🟠 | Regressões silenciosas | Suite de testes + CI/CD (RNF-M01/M02) |
| DT-09 | **Sem tratamento de cota/rate limit** | 🟠 | Abuso e custo | Implementar no AI Orchestration (RF-IA02) |
| DT-10 | **Dependências de IA via CDN sem fallback** (html2pdf, html-docx via CDN) | 🟠 | Falha de CDN quebra export; SRI só em uma das libs | Empacotar dependências no build; SRI/auto-host |

## 10.3 Débitos médios

| ID | Débito | Severidade | Ação |
|----|--------|-----------|------|
| DT-11 | **Sem validação robusta de formulário** (campos numéricos/obrigatórios) | 🟡 | Validação client + server; mensagens claras |
| DT-12 | **`alert()` para erros** (dropzone, export) | 🟡 | Substituir por UI de notice consistente (já existe `notice` no design) |
| DT-13 | **Parser de resposta de IA frágil/defensivo** (`extractHtmlProva` cobre muitos formatos) | 🟡 | Contrato de resposta estável no AI Orchestration (saída estruturada validada) |
| DT-14 | **Sem i18n** (strings PT-BR hardcoded) | 🟡 | Extrair strings; preparar i18n (RF-G08, V3) |
| DT-15 | **Sem observabilidade** (logs/métricas/tracing) | 🟡 | Instrumentar API e IA (RNF-M06, RF-IA07) |
| DT-16 | **Acessibilidade parcial** | 🟡 | Boa base atual; auditar p/ WCAG 2.1 AA completo |
| DT-17 | **Sem upload seguro de PDF** (validação só por extensão no client) | 🟡 | Validar tipo/tamanho/scan no server; storage isolado (RNF-S08) |

## 10.4 Débitos baixos

| ID | Débito | Ação |
|----|--------|------|
| DT-18 | Marca inconsistente ("ProvaGen"/"Masayoshi" no código vs. "MSY Academy") | Unificar identidade de marca |
| DT-19 | `versoes: 1` fixo no payload (`buildPayload`) | Tornar configurável (liga ao RF-P08) |
| DT-20 | Sem tema claro (só escuro) | Adicionar variante clara (UX) |
| DT-21 | Workflow n8n não versionado no repo | Versionar export do workflow enquanto o n8n existir |

## 10.5 Refatorações recomendadas (resumo)

1. **Geração estruturada** — a maior alavanca: IA → JSON de questões em vez de HTML. Destrava edição, banco de questões, versões, correção e analytics (DT-06).
2. **Backend como fonte de verdade** — tirar lógica do n8n e do front; API autenticada no centro (DT-03, DT-05).
3. **AI Orchestration Service** — centralizar provedores, cota, fallback, prompts versionados e observabilidade (DT-04, DT-09, DT-13, DT-15).
4. **Front componentizado sobre o design system atual** — preservar o que é bom (tokens, componentes, UX por etapas), modernizar a base (DT-07, DT-12).
5. **Fundação de qualidade** — testes, CI/CD, ambientes, migrations, monitoramento (DT-08).

## 10.6 O que **preservar** (não é débito — é ativo)

- ✅ Design system (`styles.css`): tokens, componentes acessíveis, identidade visual.
- ✅ UX do formulário guiado em etapas (validada, rápida).
- ✅ Conceito multi-IA com roteamento (base do AI Orchestration).
- ✅ Lógica de exportação PDF/Word/print.
- ✅ Acessibilidade básica já presente (ARIA, teclado).

## 10.7 Ordem sugerida de quitação

```
1. DT-01, DT-02, DT-03, DT-04, DT-05  (fundação — MVP, bloqueantes)
2. DT-06, DT-07  (geração estruturada + front componentizado — MVP/V1)
3. DT-08, DT-09, DT-10  (qualidade, cota, dependências — V1)
4. DT-11..DT-17  (robustez, segurança fina, observabilidade — V1/V2)
5. DT-18..DT-21  (polimento — contínuo)
```

---

⬅️ Voltar ao [índice](./README.md)
