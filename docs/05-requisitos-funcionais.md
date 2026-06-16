# 05 — Requisitos Funcionais

> Requisitos organizados por perfil. Cada RF indica a fase do [roadmap](./08-roadmap.md) em que entra: **(MVP) · (V1) · (V2) · (V3)**.
> Legenda de origem: ♻️ evolui algo já existente · 🆕 totalmente novo.

## 5.0 Transversais (todos os perfis)

| ID | Requisito | Fase |
|----|-----------|------|
| RF-G01 | 🆕 Cadastro e login (e-mail/senha + OAuth Google) | MVP |
| RF-G02 | 🆕 Recuperação de senha e verificação de e-mail | MVP |
| RF-G03 | 🆕 Perfil de usuário com papéis (professor/aluno/admin) e troca de contexto | MVP |
| RF-G04 | 🆕 Isolamento multi-tenant (cada conta só acessa seus dados) | MVP |
| RF-G05 | 🆕 Assinatura/plano ativo controla acesso a funcionalidades e **cota de IA** | V1 |
| RF-G06 | 🆕 Notificações (in-app e e-mail): convites, prazos, correções prontas | V1 |
| RF-G07 | 🆕 Busca global pesquisável na Biblioteca | V1 |
| RF-G08 | 🆕 Internacionalização (PT-BR primeiro; arquitetura preparada p/ i18n) | V3 |

---

## 5.1 Professor

### Gerador de Provas ♻️ (módulo existente, a evoluir)
| ID | Requisito | Fase |
|----|-----------|------|
| RF-P01 | Gerar prova com IA a partir de curso, matéria, assunto, público, estilo, nível, tipo, quantidade, pontos, distribuição de dificuldade e observações | MVP |
| RF-P02 | Escolher o modelo de IA (multi-provedor) | MVP |
| RF-P03 | Usar PDF/apostila como base das questões (upload) | MVP |
| RF-P04 | Gerar gabarito automático | MVP |
| RF-P05 | **Editar** a prova gerada questão a questão (destravado por geração estruturada) | V1 |
| RF-P06 | Exportar em PDF e Word, e imprimir | MVP |
| RF-P07 | **Salvar** prova e ter **histórico** de provas | V1 |
| RF-P08 | Gerar **múltiplas versões** embaralhadas (v1/v2/v3) | V2 |
| RF-P09 | Salvar questões no **Banco de Questões** e reutilizá-las | V2 |
| RF-P10 | Tags BNCC nas questões | V2 |

### Gerador de Atividades 🆕
| RF-P11 | Gerar exercícios, trabalhos, listas, revisões e simulados com IA | V1 |
| RF-P12 | Reaproveitar parâmetros e banco de questões nas atividades | V2 |

### Planejamento de Aula 🆕
| RF-P13 | Informar disciplina, série e tema; IA gera plano de aula (objetivos, conteúdo, atividades, avaliações sugeridas) | V1 |
| RF-P14 | Editar e salvar planos de aula na Biblioteca | V1 |
| RF-P15 | Alinhar plano à BNCC | V2 |

### Biblioteca de Conteúdo 🆕
| RF-P16 | Armazenar provas, atividades, materiais e planos de aula, organizados e pesquisáveis | V1 |
| RF-P17 | Pastas/coleções, tags e filtros | V2 |
| RF-P18 | Compartilhar conteúdo entre professores (marketplace/comunidade) | V3 |

### Gestão de Turmas 🆕
| RF-P19 | Criar turmas, cadastrar/convidar alunos (código de convite), organizar por disciplina | V1 |
| RF-P20 | Atribuir provas/atividades/simulados à turma com prazo | V1 |
| RF-P21 | Gerenciar matrículas (remover, reconvidar) | V1 |

### Correção Inteligente 🆕
| RF-P22 | Correção automática de questões objetivas | V1 |
| RF-P23 | IA sugere nota e feedback individual para discursivas; professor revisa/ajusta | V2 |
| RF-P24 | Correção em lote de uma turma inteira | V2 |
| RF-P25 | Correção de redação com critérios (ex.: competências ENEM) | V3 |

### Dashboard do Professor 🆕
| RF-P26 | Visualizar desempenho das turmas, estatísticas e relatórios | V2 |
| RF-P27 | Identificar **alunos em risco** (sinais de baixo desempenho) | V2 |
| RF-P28 | Relatórios institucionais (plano Escola) | V3 |

---

## 5.2 Aluno

### Tutor IA 🆕
| ID | Requisito | Fase |
|----|-----------|------|
| RF-A01 | Chat com tutor IA especializado em educação: explicar conteúdos, resolver dúvidas, criar exemplos | V1 |
| RF-A02 | Tutor adapta linguagem ao nível do aluno e orienta estudos | V2 |
| RF-A03 | Tutor usa contexto da turma/material (RAG) para respostas alinhadas ao que o professor ensina | V2 |

### Simulados 🆕
| RF-A04 | Fazer simulados personalizados, por matéria e por dificuldade | V1 |
| RF-A05 | Receber correção e resolução comentada ao final | V1 |
| RF-A06 | Simulados no estilo ENEM/vestibular/concurso | V2 |

### Plano de Estudos 🆕
| RF-A07 | Informar objetivo, data da prova e disponibilidade; IA gera cronograma, revisões e exercícios recomendados | V2 |
| RF-A08 | Plano se re-adapta conforme desempenho | V3 |

### Flashcards Inteligentes 🆕
| RF-A09 | Gerar flashcards automaticamente a partir de PDFs, conteúdos, aulas e resumos | V2 |
| RF-A10 | Revisão espaçada (SRS) agendando o que revisar | V2 |

### Atividades e entregas 🆕
| RF-A11 | Ver tarefas atribuídas pela turma e prazos | V1 |
| RF-A12 | Resolver/entregar atividades e provas online | V1 |
| RF-A13 | Ver notas, gabarito e feedback após correção | V1 |

### Dashboard do Aluno 🆕
| RF-A14 | Visualizar evolução, desempenho, histórico e metas | V2 |

---

## 5.3 Administrador

| ID | Requisito | Fase |
|----|-----------|------|
| RF-AD01 | Gestão de usuários (criar, suspender, atribuir papéis) | V1 |
| RF-AD02 | Gestão de assinaturas e planos (Professor/Aluno/Escola) | V1 |
| RF-AD03 | Gestão de tenants/escolas (professores e turmas vinculados) | V1 |
| RF-AD04 | Gestão de conteúdo institucional (materiais oficiais, comunicados) | V2 |
| RF-AD05 | Painel de uso e custo de IA (por tenant, por feature) | V2 |
| RF-AD06 | Moderação de conteúdo gerado e relatórios de abuso | V2 |
| RF-AD07 | Configuração de limites/cotas por plano | V1 |
| RF-AD08 | Auditoria (quem fez o quê) | V2 |

---

## 5.4 Requisitos de IA (núcleo, transversal)

| ID | Requisito | Fase |
|----|-----------|------|
| RF-IA01 | Serviço central de orquestração de IA com roteamento por tarefa/custo | V1 |
| RF-IA02 | Cota/créditos de IA por plano, com bloqueio e upsell ao exceder | V1 |
| RF-IA03 | Fallback automático entre provedores em caso de falha | V1 |
| RF-IA04 | Prompts versionados por feature (governança de qualidade) | V1 |
| RF-IA05 | Moderação/segurança do conteúdo gerado (filtragem) | V2 |
| RF-IA06 | Cache (inclusive semântico) para reduzir custo/latência | V2 |
| RF-IA07 | Observabilidade: tokens, custo, latência e qualidade por feature/provedor | V2 |

---

➡️ Próximo: [06 — Requisitos Não Funcionais](./06-requisitos-nao-funcionais.md)
