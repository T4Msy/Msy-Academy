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
      <div className="page-head">
        <div>
          <h1 className="page-title">Tutor IA</h1>
          <p className="page-subtitle">Tire dúvidas sobre o material das suas turmas.</p>
        </div>
        <Link href="/aluno/tutor-ia" className="btn btn-ghost btn-sm">Nova conversa</Link>
      </div>

      <div className="tutor-layout">
        <aside className="tutor-sidebar">
          {(conversations ?? []).length === 0 ? (
            <p className="field-hint mt-0">Nenhuma conversa ainda.</p>
          ) : (
            (conversations ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/aluno/tutor-ia?c=${c.id}`}
                className={`sidebar-link sidebar-link--block${c.id === conversationId ? " active" : ""}`}
              >
                <div>{c.title}</div>
                <div className="field-hint mt-0">{formatDate(c.updated_at)}</div>
              </Link>
            ))
          )}
        </aside>

        <div className="card card--fill">
          <div className="card-body">
            <TutorChat conversationId={conversationId ?? null} initialMessages={initialMessages} />
          </div>
        </div>
      </div>
    </>
  );
}
