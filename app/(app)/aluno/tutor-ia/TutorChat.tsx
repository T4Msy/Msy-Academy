"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AiThinking } from "@/components/AiThinking";

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
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/tutor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convIdRef.current, message: text }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? `Erro ${res.status}`);
        }

        const newConvId = res.headers.get("X-Conversation-Id");
        if (newConvId && newConvId !== convIdRef.current) {
          convIdRef.current = newConvId;
          router.replace(`/aluno/tutor-ia?c=${newConvId}`, { scroll: false });
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: accumulated };
            return next;
          });
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo deu errado.");
        setMessages((prev) => prev.slice(0, -1));
      }
    });
  }

  return (
    <div className="tutor-chat">
      <div className="tutor-messages" role="log" aria-live="polite" aria-label="Conversa com o tutor">
        {messages.length === 0 && (
          <p className="mt-0 text-xs leading-snug text-muted-foreground">
            Pergunte algo sobre o material das suas turmas. As respostas são geradas por IA e podem
            conter erros — confirme informações importantes com seu professor.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`tutor-bubble tutor-bubble--${m.role}`}>
            {m.content || (pending && i === messages.length - 1 ? <AiThinking /> : "")}
          </div>
        ))}
      </div>

      {error && <div className="mt-3.5 rounded-md border border-danger-border bg-danger-dim px-4.5 py-3.5 text-[13.5px] leading-normal text-danger-text">{error}</div>}

      <form onSubmit={onSubmit} className="tutor-input-row">
        <label htmlFor="tutor-chat-input" className="visually-hidden">Sua pergunta para o tutor</label>
        <input
          id="tutor-chat-input"
          className="w-full appearance-none rounded-sm border border-border bg-[rgba(var(--overlay-rgb),0.04)] px-3 py-2.5 text-md text-foreground outline-none transition-colors focus:border-brand-border focus:ring-[3px] focus:ring-brand-glow"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta…"
          disabled={pending}
        />
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5" disabled={pending || !input.trim()}>
          {pending ? <AiThinking label="Enviando" /> : "Enviar"}
        </button>
      </form>
    </div>
  );
}
