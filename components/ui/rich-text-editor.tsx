"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  TextQuote,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Editor padrão de conteúdo rico do DS (decisão nº 10 do ADR 13) — Tiptap
 * com StarterKit. Valor entra/sai como JSON do Tiptap (nunca HTML cru).
 * A adoção nos conteúdos gerados por IA (plano de aula, questões) acontece
 * junto com a mudança do formato de armazenamento na Fase 3 — hoje esses
 * fluxos persistem texto puro consumido pelo export PDF/DOCX.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value?: JSONContent | null;
  onChange?: (doc: JSONContent) => void;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-sm min-h-32 px-3 py-2.5 text-md text-foreground outline-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_p]:my-1.5",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  });

  if (!editor) return null;

  const tools: {
    icon: React.ReactNode;
    label: string;
    isActive?: () => boolean;
    run: () => void;
  }[] = [
    { icon: <Bold />, label: "Negrito", isActive: () => editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { icon: <Italic />, label: "Itálico", isActive: () => editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { icon: <Strikethrough />, label: "Tachado", isActive: () => editor.isActive("strike"), run: () => editor.chain().focus().toggleStrike().run() },
    { icon: <Heading2 />, label: "Título", isActive: () => editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: <Heading3 />, label: "Subtítulo", isActive: () => editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: <List />, label: "Lista", isActive: () => editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { icon: <ListOrdered />, label: "Lista numerada", isActive: () => editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: <TextQuote />, label: "Citação", isActive: () => editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
    { icon: <Undo2 />, label: "Desfazer", run: () => editor.chain().focus().undo().run() },
    { icon: <Redo2 />, label: "Refazer", run: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] transition-colors focus-within:border-brand-border focus-within:ring-[3px] focus-within:ring-brand-glow",
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label="Formatação"
        className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1"
      >
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            aria-label={t.label}
            aria-pressed={t.isActive?.() ?? undefined}
            onClick={t.run}
            className={cn(
              "grid size-7 place-items-center rounded-sm text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-glow [&_svg]:size-4",
              t.isActive?.() && "bg-brand-dim text-brand-text",
            )}
          >
            {t.icon}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
