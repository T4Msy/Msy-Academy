"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bot, SendHorizontal, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { AiThinking } from "@/components/AiThinking";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUICK_PROMPTS = [
  "Explique um conteúdo",
  "Faça um resumo",
  "Crie exercícios",
  "Monte uma revisão",
  "Tire uma dúvida",
  "Prepare perguntas para uma prova",
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function TutorChat({
  conversationId,
  initialMessages,
}: {
  conversationId: string | null;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const convIdRef = useRef(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: pending ? "auto" : "smooth" });
  }, [messages, pending]);

  function onSubmit() {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    setInput("");
    setMessages((previous) => [
      ...previous,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/tutor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convIdRef.current, message: text }),
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error ?? "O tutor não conseguiu responder agora. Tente novamente.");
        }

        const newConversationId = response.headers.get("X-Conversation-Id");
        const createdConversation = Boolean(
          newConversationId && newConversationId !== convIdRef.current,
        );
        if (newConversationId) {
          convIdRef.current = newConversationId;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((previous) => {
            const next = [...previous];
            next[next.length - 1] = { role: "assistant", content: accumulated };
            return next;
          });
        }
        if (createdConversation && newConversationId) {
          router.replace(`/aluno/tutor-ia?c=${newConversationId}`, { scroll: false });
        } else router.refresh();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "O tutor não conseguiu responder agora. Tente novamente.",
        );
        setMessages((previous) => previous.slice(0, -1));
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7"
        role="log"
        aria-live="polite"
        aria-label="Conversa com o tutor"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center px-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-dim text-brand-text">
              <Bot className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              Em que posso ajudar?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pergunte sobre o material das suas turmas. Confirme informações importantes com seu
              professor.
            </p>
            <p className="mt-3 rounded-full border border-border bg-card-2 px-3 py-1.5 text-xs text-muted-foreground">
              O tutor usa materiais das suas turmas quando encontra contexto relevante.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Sugestões rápidas">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-brand-border hover:bg-brand-dim hover:text-brand-text focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={`${message.role}-${index}`}
              message={message}
              isThinking={pending && index === messages.length - 1 && !message.content}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-5 mb-3 rounded-md border border-danger-border bg-danger-dim px-4 py-3 text-sm leading-snug text-danger-text sm:mx-7">
          {error}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="border-t border-border bg-card-2/40 px-5 py-4 sm:px-7"
      >
        <label htmlFor="tutor-chat-input" className="sr-only">
          Sua pergunta para o tutor
        </label>
        <div className="flex items-end gap-2">
          <Textarea
            id="tutor-chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Escreva sua dúvida sobre a matéria…"
            disabled={pending}
            rows={1}
            className="max-h-32 min-h-11 resize-y bg-card px-3 py-2.5 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={pending || !input.trim()}
            aria-label="Enviar mensagem"
          >
            {pending ? <AiThinking /> : <SendHorizontal aria-hidden />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Enter envia · Shift + Enter quebra linha
        </p>
      </form>
    </div>
  );
}

function MessageBubble({ message, isThinking }: { message: ChatMessage; isThinking: boolean }) {
  const isStudent = message.role === "user";
  return (
    <div
      className={`flex max-w-[85%] gap-2.5 ${isStudent ? "ml-auto flex-row-reverse" : "mr-auto"}`}
    >
      <span
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${isStudent ? "bg-brand text-primary-foreground" : "bg-brand-dim text-brand-text"}`}
      >
        {isStudent ? (
          <UserRound className="size-3.5" aria-hidden />
        ) : (
          <Bot className="size-3.5" aria-hidden />
        )}
      </span>
      <div
        className={`min-w-0 rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isStudent ? "rounded-tr-sm bg-brand text-primary-foreground" : "rounded-tl-sm border border-border bg-card-2 text-foreground"}`}
      >
        {message.content || (isThinking ? <AiThinking label="Pensando" /> : null)}
      </div>
    </div>
  );
}
