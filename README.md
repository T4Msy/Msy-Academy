<div align="center">

# 📄 ProvaGen
### Gerador de Provas com IA e Gabarito Automático

[![Demo ao Vivo](https://img.shields.io/badge/Demo%20ao%20Vivo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://t4msy.github.io/Gerador-de-Provas/)
[![Feito com n8n](https://img.shields.io/badge/Automação-n8n-orange?style=for-the-badge&logo=n8n)](https://n8n.io/)
[![IA Integrada](https://img.shields.io/badge/IA-Multi--Modelo-blueviolet?style=for-the-badge&logo=openai)](https://groq.com/)
[![Licença](https://img.shields.io/badge/Licença-MIT-blue?style=for-the-badge)](LICENSE)

**ProvaGen** é uma aplicação web que utiliza Inteligência Artificial e automação de workflows para gerar provas completas com gabarito automático em segundos. Criado por um professor de informática, para professores.

[🚀 Acessar o projeto](https://t4msy.github.io/Gerador-de-Provas/) · [🐛 Reportar Bug](https://github.com/t4msy/Gerador-de-Provas/issues) · [💡 Sugerir Melhoria](https://github.com/t4msy/Gerador-de-Provas/issues)

</div>

---

## ✨ Funcionalidades

- 🤖 **Múltiplos modelos de IA** — Escolha entre Perplexity Sonar, LLaMA 3.3, DeepSeek, ChatGPT e Gemini
- 📋 **Tipos de questão variados** — Múltipla escolha, Verdadeiro/Falso, Dissertativa ou Mista
- 📊 **Distribuição de dificuldade** — Defina percentuais personalizados para fácil/médio/difícil (ex: `40/40/20`)
- 📎 **Upload de apostila em PDF** — Use seu próprio material didático como base para as questões
- 🗂️ **Gabarito automático** — Gerado e anexado ao final da prova automaticamente
- 📤 **Exportação** — Baixe a prova em PDF ou Word (.docx), ou imprima diretamente
- 🎓 **Estilos de prova** — Escolar, ENEM, Concurso Público, Vestibular
- 💬 **Observações do professor** — Instrua a IA com orientações específicas para a geração das questões
- 📱 **Design responsivo** — Funciona em desktop e mobile

---

## 🖼️ Visão Geral

> _Um formulário guiado em 5 etapas leva da configuração até uma prova pronta para imprimir em menos de um minuto._

| Etapa | Descrição |
|-------|-----------|
| 1 — IA & Geral | Selecione o modelo de IA, o curso e o título da prova |
| 2 — Conteúdo | Defina a matéria, o assunto, a quantidade de questões e o nível |
| 3 — Formato | Escolha o tipo de questão, estilo de prova e público-alvo |
| 4 — Apoio | Faça upload opcional de uma apostila em PDF para guiar a IA |
| 5 — Gerar | Ative o gabarito e gere a prova |

---

## 🏗️ Arquitetura

```
Navegador (HTML/CSS/JS)
        │
        │  FormData POST (multipart)
        ▼
  Webhook n8n  ──►  Code Node (Validar e tratar entrada)
        │
        ▼
  Switch Node  ──►  Roteia para o provedor de IA selecionado
        │
        ├──► Groq API (LLaMA 3.3 70B)
        ├──► Perplexity API (Sonar)
        ├──► DeepSeek API
        ├──► OpenAI API (ChatGPT)
        └──► Google Gemini API
                 │
                 ▼
        Code Node (Parse da resposta JSON)
                 │
                 ▼
        Code Node (Montar HTML da prova)
                 │
                 ▼
        Webhook Response  ──►  Navegador renderiza a prova no iframe
```

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript Vanilla |
| Fontes | Syne, DM Sans (Google Fonts) |
| Automação | [n8n](https://n8n.io/) (self-hosted) |
| Túnel | Cloudflare Tunnel |
| APIs de IA | Groq (LLaMA), Perplexity, DeepSeek, OpenAI, Gemini |
| Export PDF | [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) |
| Export Word | [html-docx-js](https://github.com/evidenceprime/html-docx-js) |
| Hospedagem | GitHub Pages |

---

## 📁 Estrutura do Projeto

```
Gerador-de-Provas/
├── index.html                                            # Interface principal — formulário 5 etapas
├── styles.css                                            # Tema escuro, sistema de design próprio
├── script.js                                             # Lógica do frontend e integração com webhook
└── Gerador_de_Provas_com_IA_e_Gabarito_Automático.json  # Workflow n8n (importável)
```

---

## ⚙️ Workflow n8n

O arquivo `Gerador_de_Provas_com_IA_e_Gabarito_Automático.json` é um workflow n8n totalmente exportável. Importe-o diretamente na sua instância para executar o backend.

**Nós do workflow:**

1. **Webhook** — Recebe o POST do frontend com as configurações da prova
2. **Code - Validar** — Faz o parse e sanitiza todos os campos, incluindo o binário do PDF
3. **Switch** — Roteia para o provedor de IA correto conforme a seleção do usuário
4. **HTTP Request** — Um nó por provedor de IA (Groq, Perplexity, DeepSeek, OpenAI, Gemini)
5. **Code - Parse** — Extrai e normaliza o JSON da prova retornado pela IA
6. **Code - Build HTML** — Converte o JSON da prova em um documento HTML estilizado com gabarito
7. **Webhook Response** — Retorna o HTML final para o navegador

---

## 🚀 Como Executar

### Frontend (sem configuração necessária)
O frontend é um site estático — basta abrir o `index.html` no navegador ou hospedar no GitHub Pages.

### Backend (workflow n8n)

1. Instale o [n8n](https://docs.n8n.io/hosting/) (self-hosted ou cloud)
2. Importe o arquivo `Gerador_de_Provas_com_IA_e_Gabarito_Automático.json` na sua instância
3. Adicione suas credenciais de API para os provedores que deseja utilizar:
   - Chave de API Groq
   - Chave de API Perplexity
   - Chave de API OpenAI
   - Chave de API Google Gemini
   - Chave de API DeepSeek
4. Ative o workflow e copie a URL do webhook
5. Substitua o `WEBHOOK_URL` no `script.js` pela URL gerada

```javascript
// script.js — linha 10
const WEBHOOK_URL = 'https://sua-instancia-n8n.com/webhook/gerar-prova';
```

---

## 💡 Contexto do Projeto

> Este projeto nasceu de uma necessidade real em sala de aula. Como professor de informática, criar provas personalizadas para cada turma consumia muito tempo. O ProvaGen reduz esse processo para menos de 60 segundos — com controle total sobre tema, dificuldade, estilo e estrutura das questões.

---

## 🔮 Melhorias Futuras

- [ ] Exportação para Google Forms
- [ ] Banco de questões (salvar e reutilizar questões geradas)
- [ ] Múltiplas versões de prova (v1, v2, v3) com questões embaralhadas
- [ ] Integração com Supabase para contas de professores e histórico
- [ ] Suporte a tags da BNCC para escolas públicas brasileiras

---

## 👤 Autor

**Tales — T4 MASAYOSHI**
Professor de informática · Estudante de Sistemas de Informação · Entusiasta de IA e automação

[![GitHub](https://img.shields.io/badge/GitHub-t4msy-181717?style=flat-square&logo=github)](https://github.com/t4msy)

---

<div align="center">
  <sub>Feito com ☕ e muitos nós de <code>n8n</code> · Parte do portfólio de projetos <strong>Masayoshi</strong></sub>
</div>
