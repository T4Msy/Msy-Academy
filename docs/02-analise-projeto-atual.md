# 02 — Análise do Projeto Atual

> Esta seção é o resultado da **análise completa do código existente** no repositório. Ela mapeia o que está implementado, com quais tecnologias, e classifica cada peça em **reaproveitar / refatorar / construir do zero**.

> ✅ **Atualização (MVP Fatia 1):** o protótipo vanilla descrito abaixo foi **arquivado em `legacy/`** e uma aplicação **Next.js + TypeScript + Supabase** foi criada na raiz, com autenticação, persistência (Postgres + RLS) e o gerador migrado para uma API autenticada. A classificação "reaproveitar/refatorar" abaixo permanece válida como registro do ponto de partida. Decisões de stack em [12 — ADR: Stack](./12-adr-stack.md).

## 2.1 O que existe hoje (ProvaGen)

O repositório contém um **front-end estático** ("ProvaGen — Gerador de Provas com IA") composto por três arquivos versionados, mais um workflow n8n descrito no README.

```
Gerador-de-Provas/
├── index.html    (426 linhas)  — formulário guiado em 5 etapas + área de resultado
├── styles.css    (904 linhas)  — design system próprio, tema escuro
├── script.js     (487 linhas)  — lógica de UI + integração com webhook n8n
└── README.md     (172 linhas)  — descrição do produto e do workflow n8n
```

> ⚠️ O workflow n8n (`Gerador_de_Provas_com_IA_e_Gabarito_Automático.json`) é citado no README mas **não está versionado** neste repositório. O backend vive fora do repo, numa instância n8n acessada por um **Cloudflare Tunnel**.

### Funcionalidades implementadas (front-end)

| Funcionalidade | Onde | Status |
|----------------|------|--------|
| Formulário em 5 etapas (IA & Geral → Conteúdo → Formato → Apoio → Gerar) | `index.html` | ✅ Funcional |
| Seleção de modelo de IA (Perplexity, LLaMA, DeepSeek, ChatGPT, Gemini) via "tiles" acessíveis | `index.html` + `initIaTiles()` | ✅ Funcional |
| Campos: curso, título, matéria, assunto, público-alvo, estilo, observações do professor | `index.html` + `buildPayload()` | ✅ Funcional |
| Configuração de formato: tipo de questão, quantidade, pontos, nível, distribuição de dificuldade | `index.html` | ✅ Funcional |
| Upload de apostila em PDF (dropzone com drag-and-drop + toggle) | `initDropzone()` | ✅ Funcional |
| Indicador de progresso por etapa (IntersectionObserver) | `initProgressTracker()` | ✅ Funcional |
| Envio via `FormData` (POST multipart) para webhook n8n | `gerarProva()` | ✅ Funcional |
| Parser robusto da resposta (vários formatos n8n/OpenAI/Groq) | `extractHtmlProva()` | ✅ Funcional |
| Preview da prova em `<iframe srcdoc>` com tema claro | `renderProva()` | ✅ Funcional |
| Exportação para PDF (html2pdf.js) | `baixarPDF()` | ✅ Funcional |
| Exportação para Word .docx (html-docx-js) | `baixarWord()` | ✅ Funcional |
| Impressão direta (`window.print()`) | `index.html` | ✅ Funcional |
| Estados de loading e tratamento de erro na UI | `setLoadingState()`, `showErro()` | ✅ Funcional |
| Acessibilidade básica (roles ARIA, navegação por teclado nos tiles/switch/dropzone) | `index.html` + `script.js` | ✅ Parcial/boa |
| Design responsivo (tema escuro, design tokens em CSS custom properties) | `styles.css` | ✅ Funcional |

### Arquitetura atual (resumida)

```
Navegador (HTML/CSS/JS vanilla)
        │  FormData POST (multipart: JSON "dados" + PDF "apostila")
        ▼
Webhook n8n (via Cloudflare Tunnel)
        ├─ Code: validar/sanitizar entrada (+ binário PDF)
        ├─ Switch: roteia para o provedor de IA selecionado
        ├─ HTTP Request: Groq | Perplexity | DeepSeek | OpenAI | Gemini
        ├─ Code: parse do JSON retornado pela IA
        ├─ Code: montar HTML da prova (com gabarito)
        └─ Webhook Response: devolve HTML
        ▼
Navegador renderiza no iframe + permite export PDF/Word/Imprimir
```

## 2.2 Tecnologias identificadas

| Camada | Tecnologia | Observação |
|--------|-----------|------------|
| Frontend | HTML5, CSS3, **JavaScript vanilla** | Sem framework, sem build, sem bundler |
| Fontes | Syne, DM Sans (Google Fonts) | Carregadas via CDN |
| Design | Design system próprio em CSS custom properties (`:root`) | Tema escuro, accent `#2EE59D` |
| Backend | **n8n** (self-hosted) | Lógica de negócio inteira mora aqui |
| Túnel | Cloudflare Tunnel | URL pública temporária (`trycloudflare.com`) |
| IA | Groq (LLaMA 3.3 70B), Perplexity Sonar, DeepSeek, OpenAI, Gemini | Multi-modelo, roteado por Switch |
| Export | html2pdf.js, html-docx-js | Via CDN |
| Hospedagem | GitHub Pages | Site estático |

## 2.3 Limitações críticas do estado atual

Estas limitações **definem o trabalho da V1**:

1. **❌ Sem autenticação / contas.** Não há login, usuários, sessões ou perfis. Impossível ter "professor" ou "aluno" hoje.
2. **❌ Sem persistência / banco de dados.** Nada é salvo. Cada prova gerada se perde ao recarregar a página. Não há histórico, biblioteca nem banco de questões.
3. **❌ Sem backend próprio.** A lógica vive num workflow n8n não versionado, exposto por um túnel Cloudflare **temporário e hardcoded** no front-end (`script.js:10`) — frágil e não escalável para produção.
4. **❌ Sem multi-tenant.** Nenhuma noção de turma, escola, assinatura ou isolamento de dados.
5. **❌ Sem segredos protegidos.** O fluxo depende de chaves de API de IA que vivem no n8n; não há controle de cota, rate limiting por usuário, nem proteção do webhook (qualquer um com a URL pode consumir crédito de IA).
6. **❌ Escopo de um único módulo.** Só existe geração de prova. Os outros 11 módulos da visão não existem.
7. **⚠️ Acoplamento ao HTML gerado pela IA.** A prova é HTML cru renderizado em iframe — sem estrutura de dados (questões como objetos), o que impede edição, reuso, embaralhamento de versões e análise.

## 2.4 Classificação: reaproveitar / refatorar / construir

### ♻️ Reaproveitar (alto valor já pronto)
- **Design system** (`styles.css`): tokens, tema escuro, componentes (cards, switches, tiles, dropzone) — base sólida para o design system da plataforma. Ver [07 — UX/UI](./07-ux-ui.md).
- **Padrão de formulário guiado por etapas** e o componente de seleção de IA acessível — bons padrões de UX a generalizar.
- **Roteamento multi-IA** (conceito do Switch n8n): a ideia de escolher o provedor por tarefa deve virar um **serviço de orquestração de IA** no backend novo.
- **Lógica de exportação** (PDF/Word/print) — utilitária e independente; migra com poucos ajustes.
- **Parser tolerante de respostas de IA** (`extractHtmlProva`) — a lógica defensiva é boa; vira parte do serviço de IA.

### 🔧 Refatorar
- **`script.js`** → migrar de manipulação direta de DOM para um front-end componentizado (ver [03 — Arquitetura](./03-arquitetura.md)), preservando os comportamentos.
- **Geração de prova como HTML cru** → passar a IA a retornar **estrutura de dados** (questões, alternativas, gabarito como objetos) e renderizar no front. Isso destrava edição, versões e banco de questões.
- **Webhook hardcoded** → substituir por chamadas a uma API própria autenticada; o n8n (se mantido) vira detalhe de implementação atrás do backend, nunca exposto ao navegador.

### 🏗️ Construir do zero (fundação da V1)
- **Backend/API próprio** com autenticação, autorização por perfil e multi-tenant.
- **Banco de dados** (ver [04 — Banco de Dados](./04-banco-de-dados.md)).
- **Serviço de orquestração de IA** (cota, rate limit, fallback, custo, observabilidade).
- **Sistema de contas e assinaturas** (planos Professor / Aluno / Escola).
- **Os demais módulos** (atividades, planos de aula, turmas, correção, tutor IA, simulados, plano de estudos, flashcards, dashboards).

## 2.5 Conclusão da análise

O ProvaGen entrega **uma fatia funcional e bem-acabada de UI/UX** + um **conceito de orquestração multi-IA** comprovadamente funcional. Isso é um excelente ponto de partida — mas representa **~1 dos 12 módulos** e **carece de toda a fundação de plataforma** (contas, persistência, backend, segurança, multi-tenant).

A V1 da MSY Academy **não** é "melhorar o gerador de provas"; é **construir a plataforma** e encaixar o gerador como seu primeiro módulo. O detalhamento dessa construção está nos documentos seguintes.

---

➡️ Próximo: [03 — Arquitetura](./03-arquitetura.md)
