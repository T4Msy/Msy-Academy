# 04 — Banco de Dados

> Modelo de dados sugerido para a MSY Academy. Assume **PostgreSQL** com **multi-tenant** via `tenant_id` e Row-Level Security (RLS). Hoje **não existe banco de dados**; este é o desenho-alvo da V1, com colunas e relacionamentos pensados para os 12 módulos.

## 4.1 Convenções

- Toda tabela tem `id` (UUID), `created_at`, `updated_at`. A maioria tem `tenant_id` (FK → `tenants`).
- Soft delete via `deleted_at` onde fizer sentido (provas, atividades, materiais).
- Conteúdo gerado por IA guarda metadados: `ai_provider`, `ai_model`, `prompt_version`, `tokens_used`.
- Enums em UPPER_SNAKE_CASE. Campos flexíveis (parâmetros de geração, estrutura de questão) em `JSONB`.

## 4.2 Entidades (visão geral)

```
IDENTIDADE & ASSINATURA
  tenants ──< users ──< user_roles
  tenants ──< subscriptions ── plans
  users ──< ai_usage (cota/créditos)

ESTRUTURA ACADÊMICA
  tenants ──< classes (turmas) ──< enrollments >── users(aluno)
  subjects (disciplinas)  ·  grade_levels (séries/níveis)

CONTEÚDO (criado por professor / IA)
  exams (provas) ──< exam_questions >── questions (banco de questões)
  activities (atividades) ──< activity_items
  lesson_plans (planos de aula)
  materials (biblioteca de conteúdo / arquivos)
  flashcard_decks ──< flashcards

AVALIAÇÃO & DESEMPENHO
  assignments (atribuições a turmas) ── (exam|activity|simulado)
  submissions (entregas do aluno) ──< submission_answers
  grades (notas + feedback)
  simulados ──< simulado_questions
  study_plans ──< study_plan_items
  performance_metrics / analytics_events

IA
  ai_interactions (tutor IA, gerações) · prompt_templates (versionados)
```

## 4.3 Tabelas principais (esquema sugerido)

### Identidade e assinatura

**`tenants`** — uma conta (professor individual *ou* escola)
| Coluna | Tipo | Notas |
|--------|------|------|
| id | UUID PK | |
| name | text | nome da escola/professor |
| type | enum(`INDIVIDUAL`,`SCHOOL`) | |
| created_at / updated_at | timestamptz | |

**`users`**
| Coluna | Tipo | Notas |
|--------|------|------|
| id | UUID PK | |
| tenant_id | UUID FK→tenants | |
| email | citext unique | |
| password_hash | text | (ou auth externo) |
| full_name | text | |
| birth_date | date | importante p/ menores (LGPD) |
| status | enum(`ACTIVE`,`INVITED`,`SUSPENDED`) | |

**`user_roles`** — um usuário pode ter mais de um papel
| Coluna | Tipo | Notas |
|--------|------|------|
| user_id | UUID FK→users | |
| role | enum(`PROFESSOR`,`ALUNO`,`ADMIN`) | |
| PK (user_id, role) | | |

**`plans`** / **`subscriptions`**
| plans | tipo | | subscriptions | tipo |
|-------|------|--|---------------|------|
| id | UUID PK | | id | UUID PK |
| code | enum(`FREE`,`PROFESSOR`,`ALUNO`,`ESCOLA`) | | tenant_id | FK→tenants |
| ai_quota_monthly | int | | plan_id | FK→plans |
| limits | JSONB | | status | enum(`TRIALING`,`ACTIVE`,`PAST_DUE`,`CANCELED`) |
| price_cents | int | | current_period_end | timestamptz |
| | | | external_ref | text (Stripe) |

**`ai_usage`** — consumo/créditos (também espelhado em Redis para velocidade)
| Coluna | Tipo |
|--------|------|
| id | UUID PK |
| tenant_id / user_id | UUID FK |
| period (YYYY-MM) | text |
| tokens_used / requests_count | int |
| cost_cents | int |

### Estrutura acadêmica

**`subjects`** (disciplinas) · **`grade_levels`** (séries/níveis: infantil, fundamental, médio, graduação, técnico, concurso) — tabelas de referência, podem ser globais + customizáveis por tenant.

**`classes`** (turmas)
| Coluna | Tipo | Notas |
|--------|------|------|
| id | UUID PK | |
| tenant_id | FK→tenants | |
| owner_id | FK→users(professor) | |
| name | text | ex: "3º ano B" |
| subject_id | FK→subjects | |
| grade_level_id | FK→grade_levels | |
| invite_code | text | convite de alunos |

**`enrollments`** (matrícula aluno↔turma) — N:N
| class_id | FK→classes |
| student_id | FK→users(aluno) |
| status | enum(`ACTIVE`,`INVITED`,`REMOVED`) |
| PK (class_id, student_id) |

### Conteúdo

**`questions`** (banco de questões reutilizável) — peça central destravada ao a IA retornar dados, não HTML
| Coluna | Tipo | Notas |
|--------|------|------|
| id | UUID PK | |
| tenant_id | FK | |
| author_id | FK→users | |
| subject_id / grade_level_id | FK | |
| type | enum(`MULTIPLA`,`VF`,`DISCURSIVA`) | |
| difficulty | enum(`FACIL`,`MEDIO`,`DIFICIL`) | |
| statement | text | enunciado |
| options | JSONB | alternativas (para múltipla/VF) |
| correct_answer | JSONB | gabarito |
| explanation | text | resolução comentada |
| tags | text[] | BNCC, tema etc. |
| ai_provider / ai_model / prompt_version | text | proveniência |

**`exams`** (provas)
| Coluna | Tipo | Notas |
|--------|------|------|
| id, tenant_id, author_id | | |
| title | text | |
| course / subject_id / grade_level_id | | |
| style | enum(`ESCOLAR`,`ENEM`,`VESTIBULAR`,`TECNICO`,`DESAFIADOR`) | |
| generation_params | JSONB | snapshot do formulário (curso, público, distniveis, observações...) |
| include_answer_key | bool | |
| status | enum(`DRAFT`,`READY`,`ARCHIVED`) | |
| version | int | múltiplas versões embaralhadas |

**`exam_questions`** (ordena questões dentro de uma prova) — N:N entre `exams` e `questions`
| exam_id | FK | question_id | FK | position | int | points | numeric |

**`activities`** + **`activity_items`** — exercícios, trabalhos, listas, revisões (estrutura análoga a exams).

**`lesson_plans`** (planos de aula)
| Coluna | Tipo |
|--------|------|
| id, tenant_id, author_id | |
| subject_id, grade_level_id, theme | |
| objectives / content / suggested_activities / suggested_assessments | JSONB / text |

**`materials`** (biblioteca de conteúdo)
| Coluna | Tipo | Notas |
|--------|------|------|
| id, tenant_id, owner_id | | |
| kind | enum(`EXAM`,`ACTIVITY`,`LESSON_PLAN`,`FILE`,`PDF`) | |
| ref_id | UUID | aponta p/ exam/activity/etc. (polimórfico) |
| file_url | text | storage S3-like |
| title / tags / search_vector (tsvector) | | biblioteca pesquisável |

**`flashcard_decks`** + **`flashcards`**
| flashcards | tipo |
|-----------|------|
| deck_id | FK |
| front / back | text |
| source_material_id | FK→materials (gerado a partir de PDF/resumo) |
| srs_state | JSONB | dados de repetição espaçada |

### Avaliação e desempenho

**`assignments`** (atribuição de prova/atividade/simulado a uma turma)
| Coluna | Tipo |
|--------|------|
| id, tenant_id, class_id | |
| content_type | enum(`EXAM`,`ACTIVITY`,`SIMULADO`) |
| content_id | UUID |
| due_at | timestamptz |
| status | enum(`OPEN`,`CLOSED`) |

**`submissions`** (entrega do aluno) + **`submission_answers`**
| submissions | tipo |
|-------------|------|
| id, assignment_id, student_id | |
| submitted_at | timestamptz |
| status | enum(`PENDING`,`SUBMITTED`,`GRADED`) |
| submission_answers | question_id, answer (JSONB), is_correct (bool), score (numeric) |

**`grades`**
| submission_id | FK | total_score | numeric | feedback | text | graded_by | enum(`AUTO`,`AI_SUGGESTED`,`TEACHER`) | reviewed_by | FK→users |

**`simulados`** + **`simulado_questions`** — análogo a exams, com `mode` (por matéria, por dificuldade, personalizado) e vínculo a `users(aluno)`.

**`study_plans`** + **`study_plan_items`**
| study_plans | tipo |
|-------------|------|
| id, student_id, goal, exam_date, availability (JSONB) | |
| study_plan_items | date, topic, type(`REVISAO`,`EXERCICIO`,`LEITURA`), status |

**`performance_metrics`** / **`analytics_events`** — agregados de desempenho por aluno/turma/disciplina (acerto por tema, evolução temporal, "alunos em risco") + log de eventos para os dashboards.

### IA

**`ai_interactions`** — toda chamada de IA (tutor, geração, correção)
| Coluna | Tipo |
|--------|------|
| id, tenant_id, user_id | |
| feature | enum(`EXAM_GEN`,`ACTIVITY_GEN`,`LESSON_PLAN`,`TUTOR`,`GRADING`,`FLASHCARDS`,`STUDY_PLAN`) |
| provider / model / prompt_version | text |
| input (JSONB) / output (JSONB) | |
| tokens_in / tokens_out / cost_cents | int |
| latency_ms | int |

**`prompt_templates`** — prompts versionados por feature (governança e A/B de qualidade).

## 4.4 Relacionamentos-chave (resumo)

- `tenants` **1:N** `users`, `classes`, `subscriptions`, todo conteúdo.
- `users` **N:N** `classes` via `enrollments` (alunos) ; `classes.owner_id` (professor).
- `exams` **N:N** `questions` via `exam_questions` (mesma questão reutilizada em várias provas → **banco de questões**).
- `assignments` ligam conteúdo (`exam`/`activity`/`simulado`) a `classes`; geram `submissions` por aluno; `submissions` geram `grades`.
- `materials` é o índice pesquisável da **Biblioteca**, polimórfico sobre os tipos de conteúdo.
- `ai_interactions` + `ai_usage` sustentam **cota, billing e observabilidade** da IA.

## 4.5 Diretrizes de implementação

1. **RLS obrigatório**: toda query filtra por `tenant_id`; políticas garantem que professor só vê sua turma e aluno só vê o que lhe foi atribuído.
2. **`JSONB` para o que é flexível** (estrutura de questão, parâmetros de geração, srs_state) — sem engessar o schema enquanto os módulos evoluem.
3. **Busca**: `tsvector`/`pgvector` para Biblioteca (texto) e Tutor IA (semântica/RAG).
4. **Auditoria**: registrar quem criou/editou/corrigiu (compliance escolar).
5. **Dados de menores**: `birth_date` permite aplicar regras de consentimento/privacidade (LGPD — ver [06](./06-requisitos-nao-funcionais.md)).
6. **Migração do atual**: o `payload` de `buildPayload()` (script.js) mapeia quase 1:1 para `exams.generation_params` — a migração do gerador para o novo modelo é direta.

---

➡️ Próximo: [05 — Requisitos Funcionais](./05-requisitos-funcionais.md)
