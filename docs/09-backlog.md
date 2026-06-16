# 09 — Backlog

> Backlog organizado em **Épicos → Features → User Stories**. As US seguem o formato *"Como [perfil], quero [ação] para [valor]"* com critérios de aceite resumidos. Cada épico referencia os RFs de [05](./05-requisitos-funcionais.md) e a fase do [roadmap](./08-roadmap.md).

---

## ÉPICO 1 — Identidade, Contas e Multi-tenant *(MVP/V1)*

**Features:** cadastro/login, papéis, multi-tenant, perfil.

- **US-1.1** Como **professor**, quero criar conta com e-mail/senha ou Google para acessar a plataforma.
  - *Aceite:* validação de e-mail; senha com hash; sessão por token; erro claro em credencial inválida.
- **US-1.2** Como **usuário**, quero recuperar minha senha para não perder acesso.
- **US-1.3** Como **usuário**, quero ter um ou mais papéis (professor/aluno) e alternar contexto.
- **US-1.4** Como **sistema**, quero isolar dados por tenant para garantir privacidade entre contas.
  - *Aceite:* RLS impede acesso a dados de outro tenant (testado).

## ÉPICO 2 — Geração de Provas com IA *(MVP/V1)* ♻️

**Features:** formulário de geração, multi-IA, apostila PDF, gabarito, edição, exportação, histórico. (RF-P01..P10)

- **US-2.1** Como **professor**, quero gerar uma prova informando matéria, assunto, nível, tipo, quantidade e estilo para economizar tempo.
  - *Aceite:* prova gerada em < 60 s; respeita parâmetros; inclui gabarito se solicitado.
- **US-2.2** Como **professor**, quero escolher o modelo de IA para adequar à matéria.
- **US-2.3** Como **professor**, quero enviar um PDF/apostila como base para as questões.
  - *Aceite:* upload validado (tipo/tamanho); conteúdo usado na geração.
- **US-2.4** Como **professor**, quero **editar** cada questão da prova gerada para ajustar antes de usar.
  - *Aceite:* editar enunciado/alternativas/gabarito; regenerar questão individual; reordenar.
- **US-2.5** Como **professor**, quero exportar a prova em PDF/Word e imprimir.
- **US-2.6** Como **professor**, quero salvar a prova e ver meu histórico para reutilizar depois.
- **US-2.7** Como **professor**, quero gerar versões embaralhadas (A/B/C) para aplicar em sala. *(V2)*
- **US-2.8** Como **professor**, quero salvar questões no Banco de Questões e reaproveitá-las. *(V2)*

## ÉPICO 3 — Geração de Atividades *(V1)*

**Features:** exercícios, listas, trabalhos, revisões. (RF-P11..P12)

- **US-3.1** Como **professor**, quero gerar listas de exercícios/atividades com IA para complementar as aulas.
- **US-3.2** Como **professor**, quero reaproveitar o banco de questões nas atividades. *(V2)*

## ÉPICO 4 — Planejamento de Aula *(V1)*

**Features:** geração de plano de aula, edição, BNCC. (RF-P13..P15)

- **US-4.1** Como **professor**, quero informar disciplina/série/tema e receber um plano de aula completo (objetivos, conteúdo, atividades, avaliações) para planejar mais rápido.
- **US-4.2** Como **professor**, quero editar e salvar o plano na Biblioteca.
- **US-4.3** Como **professor**, quero alinhar o plano à BNCC. *(V2)*

## ÉPICO 5 — Biblioteca de Conteúdo *(V1)*

**Features:** armazenamento, busca, organização. (RF-P16..P18)

- **US-5.1** Como **professor**, quero salvar provas/atividades/materiais/planos num só lugar pesquisável.
  - *Aceite:* busca por título/tags/matéria; filtros; abrir/duplicar/excluir.
- **US-5.2** Como **professor**, quero organizar em coleções/pastas com tags. *(V2)*
- **US-5.3** Como **professor**, quero compartilhar conteúdo com outros professores. *(V3)*

## ÉPICO 6 — Gestão de Turmas *(V1)*

**Features:** criar turmas, convidar alunos, atribuir tarefas. (RF-P19..P21)

- **US-6.1** Como **professor**, quero criar turmas por disciplina para organizar meus alunos.
- **US-6.2** Como **professor**, quero convidar alunos por código/link para que entrem na turma.
- **US-6.3** Como **professor**, quero atribuir prova/atividade/simulado à turma com prazo.
  - *Aceite:* aluno vê a tarefa e o prazo; status muda ao entregar.

## ÉPICO 7 — Correção Inteligente *(V1/V2)*

**Features:** correção automática, sugestão de nota/feedback, lote. (RF-P22..P25)

- **US-7.1** Como **professor**, quero que as questões objetivas sejam corrigidas automaticamente.
- **US-7.2** Como **professor**, quero que a IA sugira nota e feedback para discursivas, que eu reviso. *(V2)*
  - *Aceite:* IA propõe nota + comentário; professor aceita/edita; fica registrado quem corrigiu.
- **US-7.3** Como **professor**, quero corrigir uma turma inteira de uma vez. *(V2)*

## ÉPICO 8 — Tutor IA do Aluno *(V1/V2)*

**Features:** chat educacional, adaptação de linguagem, RAG. (RF-A01..A03)

- **US-8.1** Como **aluno**, quero tirar dúvidas num chat com IA para entender o conteúdo na hora.
  - *Aceite:* resposta com streaming; pode pedir exemplos; histórico salvo.
- **US-8.2** Como **aluno**, quero que o tutor adapte a explicação ao meu nível. *(V2)*
- **US-8.3** Como **aluno**, quero respostas alinhadas ao material da minha turma (RAG). *(V2)*

## ÉPICO 9 — Tarefas e Entregas do Aluno *(V1)*

**Features:** ver tarefas, resolver online, ver notas. (RF-A11..A13)

- **US-9.1** Como **aluno**, quero ver as tarefas atribuídas e seus prazos.
- **US-9.2** Como **aluno**, quero resolver/entregar online.
- **US-9.3** Como **aluno**, quero ver minha nota, o gabarito e o feedback após a correção.

## ÉPICO 10 — Simulados *(V1/V2)*

**Features:** simulados personalizados, por matéria/dificuldade, correção. (RF-A04..A06)

- **US-10.1** Como **aluno**, quero fazer simulados por matéria e dificuldade para me preparar.
- **US-10.2** Como **aluno**, quero ver correção e resolução comentada ao terminar.
- **US-10.3** Como **aluno**, quero simulados no estilo ENEM/vestibular/concurso. *(V2)*

## ÉPICO 11 — Plano de Estudos *(V2/V3)*

**Features:** geração de cronograma, adaptação. (RF-A07..A08)

- **US-11.1** Como **aluno**, quero informar objetivo, data da prova e disponibilidade e receber um cronograma com revisões e exercícios.
- **US-11.2** Como **aluno**, quero que o plano se ajuste conforme meu desempenho. *(V3)*

## ÉPICO 12 — Flashcards Inteligentes *(V2)*

**Features:** geração a partir de material, revisão espaçada. (RF-A09..A10)

- **US-12.1** Como **aluno**, quero gerar flashcards a partir de um PDF/resumo para revisar mais rápido.
- **US-12.2** Como **aluno**, quero revisão espaçada que me diga o que revisar e quando.

## ÉPICO 13 — Dashboards e Analytics *(V2)*

**Features:** dashboard aluno, dashboard professor, alunos em risco. (RF-A14, RF-P26..P28)

- **US-13.1** Como **aluno**, quero ver minha evolução, desempenho e metas.
- **US-13.2** Como **professor**, quero ver o desempenho das turmas e estatísticas.
- **US-13.3** Como **professor**, quero identificar alunos em risco para intervir cedo.
- **US-13.4** Como **escola**, quero relatórios institucionais de desempenho. *(V3)*

## ÉPICO 14 — Assinaturas, Planos e Billing *(V1)*

**Features:** planos, cota de IA, pagamento. (RF-G05, RF-AD01..AD03, RF-AD07)

- **US-14.1** Como **usuário**, quero assinar um plano (Professor/Aluno/Escola) e pagar online.
- **US-14.2** Como **sistema**, quero impor cota de IA por plano e oferecer upgrade ao exceder.
- **US-14.3** Como **escola**, quero faturamento único para múltiplos professores e turmas.

## ÉPICO 15 — AI Orchestration (núcleo) *(V1/V2)*

**Features:** roteamento, cota, fallback, prompts versionados, observabilidade. (RF-IA01..IA07)

- **US-15.1** Como **plataforma**, quero rotear cada tarefa ao melhor provedor por custo/qualidade.
- **US-15.2** Como **plataforma**, quero fazer fallback automático se um provedor falhar.
- **US-15.3** Como **plataforma**, quero versionar prompts e medir qualidade/custo por feature.
- **US-15.4** Como **plataforma**, quero cache (inclusive semântico) para reduzir custo. *(V2)*

## ÉPICO 16 — Administração e Conformidade *(V1/V2)*

**Features:** gestão de usuários/tenants, moderação, auditoria, LGPD. (RF-AD01..AD08)

- **US-16.1** Como **admin**, quero gerenciar usuários, papéis e assinaturas.
- **US-16.2** Como **admin**, quero ver uso e custo de IA por tenant/feature. *(V2)*
- **US-16.3** Como **titular de dados**, quero exportar/excluir meus dados (LGPD).
- **US-16.4** Como **admin**, quero auditoria de ações sensíveis (notas, papéis, exclusões). *(V2)*

## ÉPICO 17 — Engajamento e Retenção *(V2/V3)*

**Features:** onboarding, gamificação, notificações. (inspirado em [11](./11-analise-concorrentes.md))

- **US-17.1** Como **novo usuário**, quero um onboarding com checklist que me leve ao primeiro valor rápido.
- **US-17.2** Como **aluno**, quero streaks/metas que me motivem a estudar com regularidade.
- **US-17.3** Como **usuário**, quero notificações de prazos e correções prontas.

---

## Priorização (resumo MoSCoW para V1)

| Must have | Should have | Could have | Won't (agora) |
|-----------|-------------|------------|---------------|
| Épicos 1, 2, 6, 9, 14, 15 | Épicos 3, 4, 5, 7(auto), 8, 10, 16 | Onboarding/gamificação (17) | Marketplace (5.3), redação (7.3 ENEM), i18n |

---

➡️ Próximo: [10 — Débitos Técnicos](./10-debitos-tecnicos.md)
