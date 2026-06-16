# 📚 Documentação Oficial — MSY Academy

> **MSY Academy** é uma **plataforma educacional inteligente** desenvolvida pela **MSY**: um ecossistema completo que conecta **professores, alunos e inteligência artificial** numa única plataforma.
>
> Este repositório nasceu como **ProvaGen**, um gerador de provas com IA. Esse módulo **não é o produto** — é a **primeira funcionalidade** e a base sobre a qual a plataforma será construída.

---

## ⚠️ Leia isto primeiro (direção para humanos e IA)

O objetivo **não** é construir um "SaaS de provas".

O objetivo é construir uma **plataforma educacional completa com IA para professores e alunos desde a primeira versão pública**. O gerador de provas é um ponto de partida, não o destino. Toda decisão de arquitetura, banco de dados, UX e roadmap nesta documentação assume essa visão maior.

A IA é o **núcleo** do produto, não um recurso adicional.

---

## 🗂️ Índice da Documentação

| # | Documento | Conteúdo |
|---|-----------|----------|
| 00 | [README.md](./README.md) | Este índice e a leitura obrigatória |
| 01 | [01-produto.md](./01-produto.md) | Visão, missão, público-alvo, proposta de valor, modelo de negócio |
| 02 | [02-analise-projeto-atual.md](./02-analise-projeto-atual.md) | O que existe hoje, tecnologias, o que reaproveitar/refatorar/criar |
| 03 | [03-arquitetura.md](./03-arquitetura.md) | Arquitetura atual, arquitetura futura, fluxos de negócio |
| 04 | [04-banco-de-dados.md](./04-banco-de-dados.md) | Entidades, relacionamentos, modelo de dados sugerido |
| 05 | [05-requisitos-funcionais.md](./05-requisitos-funcionais.md) | Requisitos por perfil (professor, aluno, administrador) |
| 06 | [06-requisitos-nao-funcionais.md](./06-requisitos-nao-funcionais.md) | Performance, segurança, escalabilidade, IA, conformidade |
| 07 | [07-ux-ui.md](./07-ux-ui.md) | Estrutura de telas, navegação, jornadas, design system |
| 08 | [08-roadmap.md](./08-roadmap.md) | MVP, V1, V2, V3 |
| 09 | [09-backlog.md](./09-backlog.md) | Épicos, features e user stories |
| 10 | [10-debitos-tecnicos.md](./10-debitos-tecnicos.md) | Débitos técnicos, melhorias e refatorações |
| 11 | [11-analise-concorrentes.md](./11-analise-concorrentes.md) | Khan Academy, Quizlet, Google Classroom, Moodle, Duolingo |

---

## 🧭 Resumo executivo

A educação está fragmentada: professores usam uma ferramenta para criar provas, outra para planejar aulas, outra para gerenciar notas; alunos usam plataformas separadas para estudar, revisar e tirar dúvidas. A **MSY Academy** centraliza toda essa jornada num único **"sistema operacional educacional"** potencializado por IA — um **copiloto educacional** para quem ensina e para quem aprende.

A plataforma se organiza em **dois ambientes** (Professor e Aluno) mais um painel **Administrador**, e em **12 módulos** que vão do gerador de provas (já existente) até tutor IA, simulados, flashcards inteligentes, planos de estudo e dashboards de desempenho.

**Estado atual:** existe um front-end estático funcional (ProvaGen) que conversa com um workflow n8n multi-IA. **Não há** backend próprio, banco de dados, autenticação, contas ou persistência. A V1 exige construir essa fundação.

---

## 📌 Convenções desta documentação

- **MVP / V1 / V2 / V3** referem-se às fases do [roadmap](./08-roadmap.md).
- **RF** = Requisito Funcional · **RNF** = Requisito Não Funcional.
- **Perfis**: `Professor`, `Aluno`, `Administrador`.
- Datas relativas foram convertidas para absolutas com base em **junho de 2026**.
- Esta documentação é **viva**: deve ser versionada junto ao código e atualizada a cada release.

---

<div align="center">
<sub>Documentação oficial da <strong>MSY Academy</strong> · Mantida pela MSY</sub>
</div>
