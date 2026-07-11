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
          <p className="field-hint" style={{ marginTop: 0 }}>
            Pergunte algo sobre o material das suas turmas.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`tutor-bubble tutor-bubble--${m.role}`}>
            {m.content || (pending && i === messages.length - 1 ? <AiThinking /> : "")}
          </div>
        ))}
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      <form onSubmit={onSubmit} className="tutor-input-row">
        <label htmlFor="tutor-chat-input" className="visually-hidden">Sua pergunta para o tutor</label>
        <input
          id="tutor-chat-input"
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta…"
          disabled={pending}
        />
        <button type="submit" className="btn btn-primary" disabled={pending || !input.trim()}>
          {pending ? <AiThinking label="Enviando" /> : "Enviar"}
        </button>
      </form>
    </div>
  );
}
