import Link from "next/link";
import type { Metadata } from "next";
import { MessageCirclePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { type ChatMessage } from "./TutorChat";
import { TutorConversationHistory, type TutorConversation } from "./TutorConversationHistory";
import { TutorWorkspace } from "./TutorWorkspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tirar uma dúvida" };

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

  const history: TutorConversation[] = (conversations ?? []).map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updated_at,
  }));

  return (
    <>
      <PageHeader
        title="Tirar uma dúvida"
        subtitle="Converse sobre os materiais e conteúdos das suas turmas."
        actions={
          <Button asChild size="sm">
            <Link href="/aluno/tutor-ia">
              <MessageCirclePlus aria-hidden /> Perguntar
            </Link>
          </Button>
        }
      />
      <div className="mb-3 lg:hidden">
        <TutorConversationHistory
          conversations={history}
          activeConversationId={conversationId ?? null}
          variant="mobile"
        />
      </div>
      <TutorWorkspace
        conversations={history}
        conversationId={conversationId ?? null}
        initialMessages={initialMessages}
      />
    </>
  );
}
