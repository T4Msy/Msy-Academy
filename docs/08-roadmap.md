# 08 — Roadmap

> **Premissa inegociável:** a **V1 não é um gerador de provas** — é a **primeira versão pública e comercializável da plataforma**, entregando os **dois ambientes** (Professor e Aluno) com IA no núcleo. O MVP é a etapa de fundação técnica que antecede esse lançamento (interno/beta fechado), não o produto vendido.

Datas-âncora relativas a **junho de 2026** (ajustar conforme capacidade do time).

---

## 🧱 MVP — Fundação (beta fechado, não comercial)

**Objetivo:** transformar o protótipo (front estático + n8n) numa **plataforma real com contas e persistência**, com o gerador de provas já dentro dela. Validar com poucos professores reais.

**Entrega:**
- 🆕 Backend/API próprio + banco de dados (Postgres) + multi-tenant (RLS).
- 🆕 Autenticação e contas (professor); papéis básicos.
- ♻️ Gerador de provas **migrado** para a plataforma: geração via API autenticada (não mais webhook hardcoded), IA retornando **dados estruturados**.
- 🆕 Persistência: salvar provas + **histórico**.
- ♻️ Exportação PDF/Word/print preservada.
- 🆕 AI Orchestration Service v1 (roteamento multi-provedor + segredos no backend).
- 🆕 Design system migrado para front componentizado.

**Critério de saída:** um professor cria conta, gera e **salva** provas, exporta — tudo seguro e persistido. Pronto para construir o resto.

---

## 🚀 V1 — Lançamento público comercial (Professor **e** Aluno)

**Objetivo:** **produto utilizável e vendável desde o primeiro dia**, com a experiência completa dos dois ambientes — não um único módulo.

**Ambiente do Professor:**
- Gerador de Provas completo (editável, salvável) — RF-P01..P07
- Gerador de Atividades — RF-P11
- Planejamento de Aula com IA — RF-P13..P14
- Biblioteca de Conteúdo pesquisável — RF-P16
- Gestão de Turmas + atribuições com prazo — RF-P19..P21
- Correção automática de objetivas — RF-P22

**Ambiente do Aluno:**
- Tutor IA (chat) — RF-A01
- Tarefas atribuídas + entregas online + notas/feedback — RF-A11..A13
- Simulados (personalizado/matéria/dificuldade) com correção — RF-A04..A05

**Plataforma/negócio:**
- Assinaturas e planos **Professor / Aluno / Escola** com **cota de IA** — RF-G05, RF-AD01..AD03, RF-AD07
- AI Orchestration com cota, fallback e prompts versionados — RF-IA01..IA04
- Onboarding por papel + checklist de ativação
- Billing (Stripe) + RNFs de segurança/escala essenciais

**Critério de saída:** um professor e seus alunos usam a plataforma de ponta a ponta (criar → atribuir → resolver → corrigir → tutor IA) e **é possível assinar e pagar**.

---

## 📈 V2 — Inteligência, engajamento e profundidade

**Objetivo:** aumentar **retenção, engajamento e valor** com os módulos de personalização e os dashboards (inspirado nos concorrentes — ver [11](./11-analise-concorrentes.md)).

**Professor:**
- Banco de Questões + reuso + múltiplas versões de prova — RF-P08..P10
- Correção de discursivas com IA (sugestão de nota/feedback) + correção em lote — RF-P23..P24
- Dashboard do Professor + alunos em risco — RF-P26..P27
- Tags BNCC; coleções na Biblioteca — RF-P10, RF-P15, RF-P17

**Aluno:**
- Plano de Estudos com IA — RF-A07
- Flashcards Inteligentes + revisão espaçada — RF-A09..A10
- Dashboard do Aluno (evolução/metas) — RF-A14
- Tutor IA com RAG (contexto da turma) — RF-A02..A03

**Plataforma:**
- Cache semântico de IA + observabilidade de custo/qualidade — RF-IA05..IA07
- PWA / mobile-friendly; tema claro
- Gamificação leve (streaks, metas) para engajamento
- Painel Admin: uso/custo de IA, moderação, auditoria — RF-AD04..AD06, RF-AD08

---

## 🌐 V3 — Escala, ecossistema e diferenciação

**Objetivo:** consolidar como **ecossistema** e abrir vetores de crescimento/monetização.

- Relatórios institucionais (plano Escola) — RF-P28
- Plano de estudos adaptativo (re-planeja por desempenho) — RF-A08
- Correção de redação por IA (competências ENEM) — RF-P25
- Marketplace/comunidade de conteúdo entre professores — RF-P18
- Integrações: Google Classroom, diários eletrônicos, LMS (importar/exportar), Google Forms
- Internacionalização (i18n) — RF-G08
- App mobile nativo
- Recomendações proativas de IA (próxima ação para professor e aluno)

---

## 🗺️ Visão em uma linha

```
MVP  →  plataforma com contas + gerador migrado (beta fechado)
V1   →  produto público vendável: Professor + Aluno completos, IA-first
V2   →  personalização + dashboards + engajamento (retenção)
V3   →  ecossistema, escala, integrações, internacionalização
```

## ⚠️ Riscos e dependências

| Risco | Mitigação |
|-------|-----------|
| Custo de IA cresce mais que a receita | Cota por plano, cache, roteamento por custo, observabilidade desde a V1 |
| Escopo da V1 grande (2 ambientes) | Priorizar o caminho "criar→atribuir→resolver→corrigir→tutor"; cortar profundidade, não amplitude |
| Qualidade do conteúdo gerado | Prompts versionados, feedback do usuário, revisão humana onde a nota importa |
| LGPD / dados de menores | Conformidade by design desde o MVP (ver [06](./06-requisitos-nao-funcionais.md)) |
| Dependência de provedor único de IA | Fallback multi-provedor (já é a base técnica existente) |

---

➡️ Próximo: [09 — Backlog](./09-backlog.md)
