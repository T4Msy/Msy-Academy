# 07 — UX / UI

> Estrutura de telas, navegação, jornadas e design system.
> **Atualização (2026-07):** o Design System agora é formal — Tailwind v4 + shadcn/ui
> tematizado (terracota `#D97757`, Inter/Inter Tight), primitivas em `components/ui/`,
> doc viva em `/design-system`. Princípios e regras:
> [14-design-system-guidelines.md](./14-design-system-guidelines.md) ·
> decisões: [ADR 13](./13-adr-revisao-arquitetural-2026-07.md).

## 7.1 Princípios de UX

1. **IA visível mas no controle do usuário** — a IA propõe; o professor/aluno edita e aprova. Nada é "caixa-preta".
2. **Time-to-value em segundos** — manter a promessa "prova pronta em < 60 s"; aplicar a mesma rapidez aos novos módulos.
3. **Dois ambientes, uma identidade** — Professor e Aluno são experiências distintas, mas com o mesmo design system e troca de contexto fluida (quem é os dois).
4. **Guiado quando complexo, direto quando simples** — formulários por etapas (como o atual) para geração; ações de um clique para o recorrente.
5. **Progressivo** — usuário novo vê onboarding e templates; usuário avançado tem atalhos.

## 7.2 Design system (base existente → evolução)

Extraído de `styles.css` (`:root`):

| Token | Valor atual | Papel |
|-------|-------------|-------|
| `--bg` / `--bg-card` | `#0a0a0a` / `#111` | Fundo (tema escuro) |
| `--accent` | `#2EE59D` (verde) | Ação primária, foco, sucesso |
| `--danger` | `#ef4444` | Erro/remoção |
| `--fg` / `--fg-muted` | `#f0f0f0` / `#888` | Texto |
| `--radius` / `--radius-lg` | `14px` / `20px` | Cantos |
| `--font-display` / `--font-body` | Syne / DM Sans | Tipografia |

**Componentes já prontos para reuso:** cards, `step-badge`, switches acessíveis, `ia-tile` (radio-group), dropzone, chips, botões (primary/ghost/danger), notices, progress-track por etapas.

**Evolução necessária para a plataforma:**
- Adicionar **tema claro** (alunos/escolas costumam preferir; o preview da prova já usa fundo claro).
- **Shell de aplicação** (sidebar + topbar) — hoje só existe a tela única do gerador.
- Sistema de **navegação por contexto** (Professor/Aluno/Admin).
- Componentes novos: tabelas/listas de turmas e alunos, chat (tutor IA), calendário (plano de estudos), gráficos (dashboards), editor de questões, cards de flashcard.
- Tokenizar como **design tokens** reutilizáveis no front componentizado.

## 7.3 Estrutura de navegação (information architecture)

```
MSY Academy
├── Público
│   ├── Landing / Planos / Preços
│   ├── Login · Cadastro · Recuperar senha
│
├── Onboarding (escolhe papel: Professor / Aluno / ambos)
│
├── 🧑‍🏫 AMBIENTE DO PROFESSOR
│   ├── Início (resumo + ações rápidas)
│   ├── Criar
│   │   ├── Prova        ← módulo existente (evoluído)
│   │   ├── Atividade
│   │   └── Plano de aula
│   ├── Biblioteca       (provas, atividades, materiais, planos — pesquisável)
│   ├── Banco de Questões
│   ├── Turmas           (lista → turma → alunos / atribuições)
│   ├── Correção         (fila de correção + revisão)
│   ├── Dashboard        (desempenho de turmas, alunos em risco, relatórios)
│   └── Configurações / Plano & Cota de IA
│
├── 🎓 AMBIENTE DO ALUNO
│   ├── Início (próximas tarefas, metas, continuar estudando)
│   ├── Tutor IA        (chat)
│   ├── Tarefas         (atribuídas pela turma + entregas + notas)
│   ├── Simulados
│   ├── Plano de Estudos (cronograma)
│   ├── Flashcards
│   ├── Dashboard       (evolução, desempenho, histórico, metas)
│   └── Configurações / Plano
│
└── 🛠️ PAINEL ADMIN
    ├── Usuários · Tenants/Escolas · Assinaturas & Planos
    ├── Uso & Custo de IA · Moderação · Auditoria
    └── Conteúdo institucional
```

## 7.4 Telas-chave (estrutura)

### Shell da aplicação
- **Sidebar** (navegação do ambiente atual) + **Topbar** (busca global, troca de contexto Professor/Aluno, notificações, conta/cota de IA).
- Responsivo: sidebar colapsa em drawer no mobile.

### Criar Prova (evolução da tela atual)
- Mantém o **formulário guiado em 5 etapas** já validado (IA & Geral → Conteúdo → Formato → Apoio → Gerar) com o progress-track.
- **Novo:** ao gerar, em vez de HTML cru em iframe, exibir prova **editável** (cada questão é um card editável; reordenar, regenerar questão individual, trocar dificuldade).
- **Novo:** botões "Salvar na Biblioteca", "Atribuir a uma turma", "Gerar versão B".

### Turmas
- Lista de turmas (cards) → turma → abas: **Alunos** (convite por código), **Atribuições** (com prazos/status), **Desempenho**.

### Correção
- Fila de entregas; objetivas já corrigidas; discursivas com **sugestão de nota + feedback da IA** que o professor aceita/edita; correção em lote.

### Tutor IA (aluno)
- Interface de chat com **streaming**, sugestões de perguntas, anexos de material, histórico de conversas, botões 👍/👎.

### Plano de Estudos (aluno)
- Wizard (objetivo + data + disponibilidade) → **calendário/cronograma** com itens diários (revisão/exercício/leitura) e progresso.

### Dashboards
- **Aluno:** evolução temporal, acertos por tema, metas, próximos passos sugeridos pela IA.
- **Professor:** desempenho por turma, **alunos em risco** (destaque), estatísticas por questão/tema, exportar relatório.

## 7.5 Jornadas dos usuários

### Jornada do Professor (primeiro uso → recorrência)
```
Descobre (landing) → Cadastra → Onboarding (papel: Professor)
→ Cria 1ª prova com IA em < 60 s (momento "aha")
→ Salva na Biblioteca → Cria uma Turma → Atribui a prova
→ Alunos resolvem → Correção Inteligente → vê Dashboard da turma
→ Reutiliza Banco de Questões → vira hábito semanal → converte para pago
```

### Jornada do Aluno
```
Recebe convite da turma (ou assina plano Aluno) → Onboarding
→ Vê tarefa atribuída → resolve → recebe nota + feedback
→ Tira dúvida no Tutor IA → cria Plano de Estudos para a prova
→ Faz Simulados → revisa com Flashcards → acompanha evolução no Dashboard
```

### Jornada da Escola (Admin)
```
Contrata plano Escola → Admin cadastra professores → professores criam turmas
→ alunos entram → coordenação acompanha relatórios institucionais e custo de IA
```

## 7.6 Onboarding e ativação

- **Seleção de papel** no primeiro acesso (Professor / Aluno / ambos) define o ambiente padrão.
- **Templates e exemplos** prontos (prova-exemplo, plano de aula-exemplo) para o primeiro "aha" sem partir do zero.
- **Checklist de ativação** (criar 1ª prova, criar turma, convidar aluno) — alavanca de retenção inspirada em concorrentes (ver [11](./11-analise-concorrentes.md)).

## 7.7 Diretrizes visuais

- Manter identidade **escura, moderna e "tech"** já estabelecida + variante clara.
- Acento verde (`#2EE59D`) como cor de marca/ação.
- Acessibilidade WCAG 2.1 AA (contraste, foco visível, navegação por teclado — já presente nos componentes atuais).
- Microinterações de feedback de IA (estados de "gerando…", streaming, progresso) para tornar a espera tangível.

---

➡️ Próximo: [08 — Roadmap](./08-roadmap.md)
