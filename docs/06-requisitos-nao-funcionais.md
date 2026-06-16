# 06 — Requisitos Não Funcionais

> RNFs que sustentam a MSY Academy como SaaS educacional confiável. Cada um traz uma **meta mensurável** quando possível.

## 6.1 Performance

| ID | Requisito | Meta |
|----|-----------|------|
| RNF-P01 | Tempo de resposta da API (operações comuns: CRUD, listagens) | p95 < 300 ms |
| RNF-P02 | Carregamento inicial do app web | LCP < 2,5 s em 4G |
| RNF-P03 | Geração de conteúdo por IA (prova/atividade) | Feedback em < 1 s + streaming/progresso; resultado típico < 30 s |
| RNF-P04 | Operações pesadas (geração/correção em lote, OCR de PDF) | **Assíncronas** via fila, com notificação ao concluir |
| RNF-P05 | Tutor IA (chat) | Resposta com **streaming** token a token; primeira palavra < 2 s |
| RNF-P06 | Cache de respostas de IA e de listagens | Reduzir custo e latência em conteúdo repetido |

## 6.2 Segurança

| ID | Requisito |
|----|-----------|
| RNF-S01 | **Segredos só no backend.** Chaves de API de IA, credenciais e tokens nunca expostos ao navegador (corrige a falha atual do webhook hardcoded). |
| RNF-S02 | Autenticação forte (hash de senha com bcrypt/argon2; tokens com expiração; refresh seguro). |
| RNF-S03 | **Autorização RBAC** por perfil + isolamento multi-tenant com RLS no banco. |
| RNF-S04 | **Rate limiting e cota de IA por usuário/plano** (impede abuso e estouro de custo). |
| RNF-S05 | Proteção do endpoint de geração: nenhum consumo de IA sem usuário autenticado e dentro da cota. |
| RNF-S06 | TLS em todo tráfego; HSTS; cabeçalhos de segurança (CSP, X-Frame-Options). |
| RNF-S07 | Validação e sanitização de toda entrada (inclusive o **HTML gerado pela IA** antes de renderizar — risco de XSS no iframe atual). |
| RNF-S08 | Upload seguro de PDF: verificação de tipo/tamanho, varredura, storage isolado. |
| RNF-S09 | Auditoria de ações sensíveis (notas, exclusões, mudança de papéis). |
| RNF-S10 | Backups regulares e testados; criptografia em repouso de dados sensíveis. |

## 6.3 Escalabilidade

| ID | Requisito |
|----|-----------|
| RNF-E01 | **API stateless**, escalável horizontalmente (sessão em token/Redis, não em memória). |
| RNF-E02 | **Multi-tenant desde o dia 1**, suportando de 1 professor a redes de escolas sem mudança de arquitetura. |
| RNF-E03 | Workers/filas escaláveis de forma independente da API para picos (ex.: período de provas). |
| RNF-E04 | Banco preparado para crescimento (índices, particionamento futuro de tabelas de alto volume como `submissions`, `ai_interactions`, `analytics_events`). |
| RNF-E05 | **Custo de IA elástico e previsível**: roteamento por custo, cache e cotas mantêm a margem sob controle conforme a base cresce. |
| RNF-E06 | Arquitetura modular permite extrair módulos para serviços dedicados se a escala exigir. |
| RNF-E07 | CDN para assets estáticos e exports. |

## 6.4 Disponibilidade e confiabilidade

| ID | Requisito | Meta |
|----|-----------|------|
| RNF-D01 | Disponibilidade do serviço | ≥ 99,5% (V1) → 99,9% (V2+) |
| RNF-D02 | **Fallback de IA**: falha de um provedor não derruba a feature (troca automática) | — |
| RNF-D03 | Degradação graciosa: se a IA estiver indisponível, o app segue utilizável (biblioteca, edição, entregas) | — |
| RNF-D04 | Idempotência em operações de geração/cobrança (evitar duplicidade e cobrança dupla de cota) | — |
| RNF-D05 | Monitoramento + alertas (uptime, erros, custo de IA, filas) | — |

## 6.5 Privacidade e conformidade (LGPD)

| ID | Requisito |
|----|-----------|
| RNF-C01 | **LGPD by design**: base legal clara para tratamento; consentimento; finalidade explícita. |
| RNF-C02 | **Dados de menores de idade** (alunos): proteção reforçada e consentimento de responsável/escola quando aplicável. |
| RNF-C03 | Direitos do titular: exportar e excluir dados pessoais (portabilidade e "direito ao esquecimento"). |
| RNF-C04 | Política de retenção e anonimização de dados. |
| RNF-C05 | Transparência no uso de IA: deixar claro quando o conteúdo é gerado por IA. |
| RNF-C06 | Acordos de tratamento com provedores de IA; preferir provedores/configurações que **não treinem** com os dados enviados. |
| RNF-C07 | Termos de Uso e Política de Privacidade acessíveis e versionados. |

## 6.6 Qualidade de IA

| ID | Requisito |
|----|-----------|
| RNF-IA01 | Prompts versionados e testados; mudanças passam por avaliação de qualidade. |
| RNF-IA02 | Mecanismo de feedback do usuário sobre conteúdo gerado (👍/👎) para melhoria contínua. |
| RNF-IA03 | Redução de alucinação em correção/tutor via RAG (ancorar em material real) e revisão humana onde a nota importa. |
| RNF-IA04 | Observabilidade de qualidade por feature/provedor (taxa de aceite/edição do professor). |

## 6.7 Manutenibilidade e operação

| ID | Requisito |
|----|-----------|
| RNF-M01 | Código versionado, tipado e testado (a lógica crítica **sai do n8n** para código testável). |
| RNF-M02 | CI/CD com testes automatizados e deploys reproduzíveis. |
| RNF-M03 | Ambientes separados (dev/staging/prod) com dados isolados. |
| RNF-M04 | Migrations versionadas do banco. |
| RNF-M05 | Documentação viva (esta pasta `docs/`) mantida a cada release. |
| RNF-M06 | Observabilidade: logs estruturados, métricas e tracing distribuído. |

## 6.8 Acessibilidade e UX

| ID | Requisito |
|----|-----------|
| RNF-UX01 | Conformidade **WCAG 2.1 AA** (o front atual já tem boa base: roles ARIA, navegação por teclado — manter e ampliar). |
| RNF-UX02 | Responsivo (desktop e mobile); PWA na V2. |
| RNF-UX03 | Internacionalização preparada (PT-BR primeiro). |
| RNF-UX04 | Tempo de tarefa: criar uma prova continua em **< 60 s** (promessa central do produto). |

---

➡️ Próximo: [07 — UX/UI](./07-ux-ui.md)
