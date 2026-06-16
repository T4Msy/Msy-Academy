# 11 — Análise de Concorrentes

> Estudo de **Khan Academy, Quizlet, Google Classroom, Moodle e Duolingo** para extrair padrões que comprovadamente elevam **retenção, engajamento e monetização** — e traduzi-los em funcionalidades para a MSY Academy. Nenhum concorrente cobre a jornada completa professor↔aluno↔IA; cada um domina uma fatia. **Essa é a brecha que a MSY Academy ocupa.**

## 11.1 Quadro comparativo

| Plataforma | O que faz muito bem | Modelo de monetização | Lacuna que a MSY explora |
|------------|---------------------|----------------------|--------------------------|
| **Khan Academy** | Conteúdo estruturado por trilhas, "domínio" de habilidades, exercícios com feedback; tutor IA (Khanmigo) | Sem fins lucrativos / doações; Khanmigo pago p/ escolas | Não é ferramenta de **criação** para o professor; pouca gestão de turma própria |
| **Quizlet** | Memorização: flashcards, repetição espaçada, modos de estudo gamificados (Learn, Test, Match) | Freemium + Quizlet Plus (assinatura) + IA | Foco só em memorização; não cria provas/planos nem gere desempenho de turma |
| **Google Classroom** | Gestão: turmas, atribuições, prazos, entregas, notas; adoção massiva e gratuita | Gratuito (parte do Google Workspace for Education; tiers pagos) | **Não gera conteúdo nem tem IA pedagógica**; é "encanamento", não cérebro |
| **Moodle** | LMS completo, extensível, open-source, controle institucional total | Open-source + hosting/serviços (Moodle Workplace, parceiros) | Complexo, datado, curva de aprendizado alta; IA é plugin, não núcleo |
| **Duolingo** | **Engajamento/retenção**: streaks, XP, ligas, lembretes, gamificação magistral; aprendizado adaptativo | Freemium + Super/Max (assinatura) + IA (Max) | Domínio único (idiomas); não serve professores nem avaliação formal |

## 11.2 Padrões de **retenção** a adotar

| Padrão (origem) | Aplicação na MSY Academy | Onde entra |
|-----------------|--------------------------|------------|
| **Streaks e metas diárias** (Duolingo) | Streak de estudo do aluno; meta semanal; "não perca sua sequência" | Épico 17 / Dashboard Aluno (V2) |
| **Lembretes e notificações inteligentes** (Duolingo, Classroom) | Prazos, correções prontas, "hora de revisar" baseado em SRS | RF-G06 (V1) + flashcards (V2) |
| **Revisão espaçada (SRS)** (Quizlet, Duolingo) | Flashcards inteligentes que reaparecem na hora certa | Épico 12 (V2) |
| **Trilha de domínio/progresso visível** (Khan) | Barra de domínio por tema; "você dominou Funções" | Dashboard Aluno (V2) |
| **Onboarding até o "aha" rápido** (todos) | Checklist: criar 1ª prova, 1ª turma, 1º aluno | Épico 17 (V2), começa simples na V1 |

## 11.3 Padrões de **engajamento** a adotar

| Padrão | Aplicação na MSY Academy |
|--------|--------------------------|
| **Gamificação** (Duolingo: XP/ligas; Quizlet: Match) | XP por estudo/acerto; ranking opcional dentro da turma; modos de simulado "contra o tempo" |
| **Múltiplos modos de estudo** (Quizlet: Learn/Test/Match) | Mesmo conteúdo vira flashcard, simulado, lista de exercícios e revisão — reaproveitando o banco de questões |
| **Feedback imediato e comentado** (Khan, Duolingo) | Correção automática + resolução comentada na hora (RF-A05) |
| **Tutor IA conversacional** (Khanmigo) | Tutor IA da MSY — porém com **RAG no material da turma** (vai além do Khanmigo genérico) |
| **Aprendizado adaptativo** (Duolingo, Khan) | Plano de estudos que se re-adapta ao desempenho (RF-A08, V3) |
| **Social/colaboração leve** (Classroom, Quizlet) | Compartilhar conteúdo entre professores; turmas como espaço social leve |

## 11.4 Padrões de **monetização** a adotar

| Padrão (origem) | Aplicação na MSY Academy |
|-----------------|--------------------------|
| **Freemium com limite claro** (Quizlet, Duolingo) | Plano Free com cota de geração/IA; upsell ao atingir o limite (RF-IA02) |
| **Assinatura por perfil** (Quizlet Plus, Duolingo Super) | Planos Professor e Aluno separados, com benefícios distintos |
| **B2B institucional, maior ticket** (Classroom/Workspace, Moodle hosting, Khanmigo p/ escolas) | Plano Escola: múltiplos professores/turmas, relatórios, faturamento único |
| **IA como tier premium** (Duolingo Max, Quizlet IA, Khanmigo) | Recursos de IA avançados (correção de redação, RAG, relatórios) em planos superiores |
| **Cota de IA como alavanca de upgrade** | Créditos mensais por plano; comprar mais ou subir de plano |
| **Marketplace/comunidade** (TpT-style, ausente nos 5) | Professores compartilham/vendem conteúdo — vetor novo (V3) |

## 11.5 Síntese estratégica — o "fosso" da MSY Academy

Os concorrentes provam três coisas, separadamente:
1. **Conteúdo + IA tutora engajam o aluno** (Khan, Duolingo).
2. **Gestão de turma é o que prende o professor** (Classroom, Moodle).
3. **Gamificação + freemium + SRS retêm e monetizam** (Duolingo, Quizlet).

**Ninguém une os três numa plataforma IA-first que serve professor e aluno ao mesmo tempo.** A MSY Academy é projetada para isso: o professor **cria** (provas/atividades/planos), **gere** (turmas/correção/dashboards) e o aluno **aprende** (tutor IA/simulados/flashcards/plano de estudos) — com a IA gerando o conteúdo e o ciclo de dados fechando entre os dois.

### Diferenciais defensáveis
- **Ciclo de dados fechado** professor↔aluno↔IA → personalização que ferramentas isoladas não alcançam.
- **IA-first multi-provedor** → qualidade/custo otimizados, sem refém de um fornecedor.
- **Brasil-nativo** (BNCC/ENEM/concursos) → ajuste fino que players globais não priorizam.
- **Geração + gestão + estudo num só lugar** → consolida o gasto que hoje vai para 3–4 ferramentas.

## 11.6 Funcionalidades recomendadas a partir da análise (priorizadas)

| Prioridade | Funcionalidade | Inspiração | Impacto |
|------------|----------------|-----------|---------|
| Alta | Cota de IA + freemium com upsell | Duolingo/Quizlet | Monetização |
| Alta | Correção e feedback imediato comentado | Khan/Duolingo | Engajamento |
| Alta | Tutor IA com RAG no material da turma | Khanmigo (superado) | Diferenciação |
| Média | Flashcards + SRS | Quizlet | Retenção |
| Média | Streaks/metas/notificações | Duolingo | Retenção |
| Média | Múltiplos modos de estudo a partir do mesmo banco | Quizlet | Engajamento |
| Média | Plano Escola B2B + relatórios | Classroom/Moodle | Monetização (ticket) |
| Baixa | Gamificação social na turma (XP/ranking) | Duolingo | Engajamento |
| Baixa | Marketplace de conteúdo entre professores | (lacuna do mercado) | Monetização/rede |

---

⬅️ Voltar ao [índice](./README.md)
