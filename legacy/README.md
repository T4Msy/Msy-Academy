# Legacy — ProvaGen (protótipo original)

Este diretório guarda o **protótipo original** do Gerador de Provas (ProvaGen):
HTML/CSS/JS vanilla que enviava os dados a um webhook n8n hardcoded.

Ele foi **arquivado** quando a MSY Academy migrou para a plataforma Next.js +
Supabase (ver [`../docs/12-adr-stack.md`](../docs/12-adr-stack.md)). Continua aqui
apenas como **referência histórica e de design** — não faz parte do build.

| Arquivo | O que é |
|---------|---------|
| `index.html` | Formulário guiado de 5 etapas + área de resultado |
| `styles.css` | Design system (tema escuro) — portado para `app/globals.css` |
| `script.js` | Lógica de UI + integração com o webhook n8n |

O que foi reaproveitado na plataforma:
- **Tokens e classes de design** → `app/globals.css`
- **UX do formulário de 5 etapas** → `app/(app)/provas/nova/ExamForm.tsx`
- **`buildPayload()` / `extractHtmlProva()`** → `lib/exam/buildPayload.ts` e `lib/exam/extractHtml.ts`
- **Export PDF/Word/print** → `app/(app)/provas/[id]/ExamActions.tsx`

⚠️ O `WEBHOOK_URL` em `script.js` era uma URL de túnel temporária e não deve
ser reutilizada — na plataforma, o endpoint fica em `N8N_WEBHOOK_URL` (server-side).
