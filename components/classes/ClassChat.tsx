"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, SendHorizontal, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchClassChatPage,
  CLASS_CHAT_PAGE_SIZE,
  type ClassChatMessage,
  type ClassParticipant,
} from "@/lib/classes/chat";
import { classChatMessagesQueryKey } from "@/lib/classes/queryKeys";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type LocalMessage = ClassChatMessage & { status: "sent" | "sending" | "error" };

function initialsOf(name: string | null) {
  return (name ?? "?").trim().slice(0, 1).toUpperCase();
}

/**
 * Chat em tempo real da turma (Supabase Realtime, postgres_changes).
 * Hidratado pelo prefetch do Server Component em chat/page.tsx (sem flash de
 * loading); depois disso mantém uma lista local (mesmo padrão do TutorChat)
 * para poder aplicar mensagens otimistas e eventos Realtime sem lutar contra
 * o cache do TanStack Query. Envio vai direto pelo client do browser — não
 * por Server Action — porque o ganho de latência sem um round-trip de
 * servidor é o ponto principal de um chat; RLS já protege o insert.
 */
export function ClassChat({
  classId,
  currentUserId,
  participants,
}: {
  classId: string;
  currentUserId: string;
  participants: ClassParticipant[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const participantById = useMemo(() => new Map(participants.map((p) => [p.userId, p])), [participants]);

  const initialQuery = useQuery({
    queryKey: classChatMessagesQueryKey(classId),
    queryFn: () => fetchClassChatPage(supabase, classId),
  });

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const seededRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    if (!seededRef.current && initialQuery.data) {
      setMessages(initialQuery.data.map((m) => ({ ...m, status: "sent" as const })));
      setHasMore(initialQuery.data.length >= CLASS_CHAT_PAGE_SIZE);
      seededRef.current = true;
    }
  }, [initialQuery.data]);

  useEffect(() => {
    const channel = supabase
      .channel(`class-chat-${classId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "class_chat_messages", filter: `class_id=eq.${classId}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            class_id: string;
            author_id: string;
            content: string;
            created_at: string;
            edited_at: string | null;
            deleted_at: string | null;
          };
          const incoming: LocalMessage = {
            id: row.id,
            classId: row.class_id,
            authorId: row.author_id,
            content: row.content,
            createdAt: row.created_at,
            editedAt: row.edited_at,
            deletedAt: row.deleted_at,
            status: "sent",
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) {
              return prev.map((m) => (m.id === incoming.id ? incoming : m));
            }
            return [...prev, incoming];
          });
        },
      )
      .subscribe((status) => {
        setConnectionStatus(status === "SUBSCRIBED" ? "connected" : status === "CLOSED" ? "disconnected" : "connecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [messages.length]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
  }

  async function loadOlder() {
    const oldest = messages[0];
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const older = await fetchClassChatPage(supabase, classId, { beforeCreatedAt: oldest.createdAt });
      setHasMore(older.length >= CLASS_CHAT_PAGE_SIZE);
      setMessages((prev) => [...older.map((m) => ({ ...m, status: "sent" as const })), ...prev]);
    } catch {
      // Falha silenciosa é aceitável aqui — o botão continua disponível para tentar de novo.
    } finally {
      setLoadingOlder(false);
    }
  }

  function send(messageId?: string) {
    const text = messageId ? messages.find((m) => m.id === messageId)?.content.trim() : input.trim();
    if (!text || pending) return;

    const id = messageId ?? crypto.randomUUID();
    const nowIso = new Date().toISOString();

    if (!messageId) {
      setMessages((prev) => [
        ...prev,
        { id, classId, authorId: currentUserId, content: text, createdAt: nowIso, editedAt: null, deletedAt: null, status: "sending" },
      ]);
      setInput("");
    } else {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "sending" } : m)));
    }

    startTransition(async () => {
      const { error } = await supabase
        .from("class_chat_messages")
        .insert({ id, class_id: classId, author_id: currentUserId, content: text });
      // 23505 na retentativa significa que o primeiro envio já tinha ido —
      // trata como sucesso em vez de duplicar/errar.
      if (error && error.code !== "23505") {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "error" } : m)));
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "sent" } : m)));
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        <Users className="size-4 text-muted-foreground" aria-hidden />
        {participants.length} participante{participants.length === 1 ? "" : "s"}
        {connectionStatus !== "connected" && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-card-2 px-2.5 py-1 text-xs font-normal text-muted-foreground">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            {connectionStatus === "connecting" ? "Conectando…" : "Reconectando…"}
          </span>
        )}
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Mensagens da turma"
      >
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center pb-1">
            <Button type="button" variant="ghost" size="sm" disabled={loadingOlder} onClick={loadOlder}>
              {loadingOlder ? "Carregando…" : "Carregar mensagens anteriores"}
            </Button>
          </div>
        )}

        {initialQuery.isLoading && messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando conversa…</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Comece a conversa da turma.
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.authorId === currentUserId;
            const author = participantById.get(message.authorId);
            return (
              <div key={message.id} className={`flex max-w-[85%] gap-2.5 ${isMine ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isMine ? "bg-brand text-primary-foreground" : "bg-brand-dim text-brand-text"}`}
                  aria-hidden
                >
                  {initialsOf(author?.fullName ?? null)}
                </span>
                <div className="min-w-0">
                  {!isMine && (
                    <p className="mb-0.5 px-1 text-2xs font-semibold text-muted-foreground">
                      {author?.fullName ?? "Aluno"}
                      {author?.role === "professor" && " · Professor"}
                    </p>
                  )}
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${isMine ? "rounded-tr-sm bg-brand text-primary-foreground" : "rounded-tl-sm border border-border bg-card-2 text-foreground"}`}
                  >
                    {message.content}
                  </div>
                  {message.status === "error" && (
                    <button
                      type="button"
                      onClick={() => send(message.id)}
                      className="mt-1 px-1 text-xs font-semibold text-danger-text underline"
                    >
                      Falha ao enviar · Tentar novamente
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="border-t border-border bg-card-2/40 px-4 py-3"
      >
        <label htmlFor="class-chat-input" className="sr-only">Sua mensagem</label>
        <div className="flex items-end gap-2">
          <Textarea
            id="class-chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Escreva uma mensagem para a turma…"
            rows={1}
            className="max-h-32 min-h-11 resize-y bg-card px-3 py-2.5 text-sm"
          />
          <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Enviar mensagem">
            <SendHorizontal aria-hidden />
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">Enter envia · Shift + Enter quebra linha</p>
      </form>
    </div>
  );
}
