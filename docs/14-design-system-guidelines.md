# 14 — Design System: Guidelines

> Doc viva (componentes renderizados): rota **`/design-system`** no app.
> Decisões e racional: [ADR 13](./13-adr-revisao-arquitetural-2026-07.md).

## Princípios

1. **Uma fonte de verdade.** Toda tela nova compõe primitivas de `components/ui/` + utilities do Tailwind sobre os tokens. Strings de classe legadas (`btn`, `card`, `chip`…) são proibidas em código novo.
2. **Identidade sobre convenção.** shadcn entra tematizado — terracota `#D97757` como ação primária com ink escuro (`--accent-ink`), superfícies quase-pretas, Inter Tight para display. Se um componente novo "parece shadcn default", está errado.
3. **Calmo por padrão, expressivo com intenção.** Accent é reservado para ação primária e estados ativos — nunca decoração. Hierarquia vem de tipografia e espaçamento, não de cor.
4. **Acessível por construção.** Overlays só via Radix (foco, Esc, teclado). Contraste AA nos dois temas (usar `text-brand-text`, nunca `text-brand`, para texto terracota). `prefers-reduced-motion` sempre respeitado.
5. **IA é matéria do DS.** Estados de geração, streaming, quota e atribuição usam as primitivas de IA (Fase 2) — nunca spinners inventados por tela.

## Tokens (fonte: `:root` em `app/globals.css`, projetados em `app/tailwind.css`)

| Domínio | Utilities | Notas |
|---|---|---|
| Superfícies | `bg-background` `bg-shell` `bg-card` `bg-card-2` | card-2 para aninhados/popovers |
| Texto | `text-foreground` `text-muted-foreground` `text-subtle` | |
| Marca | `bg-brand` `text-brand-text` `bg-brand-dim` `border-brand-border` | `primary` = ação (botões); `brand-*` = tints/chips |
| Feedback | `text-danger-text` `bg-danger-dim` `border-danger-border` | |
| Charts | `bg-cat-1`…`bg-cat-8` | ordem fixa, nunca reatribuir por série |
| Radius | `rounded-sm` 8px · `rounded-md` 14px · `rounded-lg` 20px | controles usam sm; cards md/lg |
| Tipo | `text-2xs`(11) `xs`(12) `sm`(13) `md`(14) `base`(15) `lg`(16) `xl`(18) `2xl`(22) `3xl`(26) `4xl`(32) | display = `font-display` (Inter Tight) |
| Sombra | `shadow-elevated` `shadow-accent-glow` | seguem o tema |
| Motion | `ease-standard` `ease-emphasis` `ease-out-soft`; durações 100/160/200/320/480ms | CSS para trivial; Motion para presença/layout |
| Espaço | escala padrão Tailwind (4px) | não inventar valores fora da escala |

## Regras de composição

- **Tema**: dark é default; light via `[data-theme="light"]`. Nunca usar `dark:` para cor que um token já resolve — o token flipa sozinho. `dark:` existe (`@custom-variant` por atributo) só para exceções estruturais.
- **Botões**: `<Button>` sempre. Primário = 1 por vista. `variant="destructive-ghost"` para exclusões contextuais; `destructive` sólido só em confirmação final.
- **Forms**: RHF + Zod (decisão 9). `<Label htmlFor>` obrigatório; erro via `aria-invalid` + mensagem `text-danger-text text-sm`.
- **Overlays**: Dialog para decisões, Sheet para fluxos secundários, Popover para contexto leve, DropdownMenu para ações. Nunca backdrop hand-rolled.
- **Feedback assíncrono**: `toast.*` do sonner (montado no root). Nunca `alert()`/mensagens inline flutuantes.
- **Dados no client**: hooks em `hooks/` com query key exportada; prefetch no Server Component (ver `app/(app)/professor/dashboard/page.tsx`, piloto canônico).
- **Ícones**: lucide-react direto (`size={18}` `strokeWidth={1.6}` em navegação; `size-4` dentro de botões via slot).

## Convivência com o legado (Fases 1→2)

O CSS antigo vive na cascade layer `legacy` (abaixo de `utilities`): páginas não migradas continuam idênticas e utilities novas sempre vencem. Ao migrar uma página: reescrever no DS, apagar as classes órfãs do `globals.css` da seção correspondente. Quando o último uso legado cair, ligar o preflight do Tailwind e apagar o arquivo.
