import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TutorChat, type ChatMessage } from "./TutorChat";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tutor IA" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export default async function TutorIaPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c: conversationId } = await searchParams;
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("tutor_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  let initialMessages: ChatMessage[] = [];
  if (conversationId) {
    const { data: messages } = await supabase
      .from("tutor_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at");
    initialMessages = (messages ?? []) as ChatMessage[];
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Tutor IA</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Tire dúvidas sobre o material das suas turmas.</p>
        </div>
        <Link href="/aluno/tutor-ia" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 border border-border bg-[rgba(var(--overlay-rgb),0.06)] text-foreground hover:border-border-hover hover:bg-[rgba(var(--overlay-rgb),0.10)] px-3 py-[7px] text-sm">Nova conversa</Link>
      </div>

      <div className="tutor-layout">
        <aside className="tutor-sidebar">
          {(conversations ?? []).length === 0 ? (
            <p className="mt-0 text-xs leading-snug text-muted-foreground">Nenhuma conversa ainda.</p>
          ) : (
            (conversations ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/aluno/tutor-ia?c=${c.id}`}
                className={`sidebar-link sidebar-link--block${c.id === conversationId ? " active" : ""}`}
              >
                <div>{c.title}</div>
                <div className="mt-0 text-xs leading-snug text-muted-foreground">{formatDate(c.updated_at)}</div>
              </Link>
            ))
          )}
        </aside>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors flex-1">
          <div className="flex flex-col gap-4.5 p-5.5">
            <TutorChat conversationId={conversationId ?? null} initialMessages={initialMessages} />
          </div>
        </div>
      </div>
    </>
  );
}
