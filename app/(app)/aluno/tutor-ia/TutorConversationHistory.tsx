"use client";

import Link from "next/link";
import { ChevronLeft, History, MessageCirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TutorConversationActions } from "./TutorConversationActions";

export type TutorConversation = { id: string; title: string; updatedAt: string };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(iso));
}

function ConversationList({
  conversations,
  activeConversationId,
  onNavigate,
}: {
  conversations: TutorConversation[];
  activeConversationId: string | null;
  onNavigate?: () => void;
}) {
  if (conversations.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm leading-snug text-muted-foreground">
        Suas conversas aparecerão aqui quando você enviar a primeira pergunta.
      </p>
    );
  }

  return (
    <nav className="space-y-1" aria-label="Histórico de conversas">
      {conversations.map((conversation) => {
        const isActive = conversation.id === activeConversationId;
        return (
          <div
            key={conversation.id}
            className={`group flex items-center gap-1 rounded-md pr-1 transition-colors ${isActive ? "bg-brand-dim" : "hover:bg-card-2"}`}
          >
            <Link
              href={`/aluno/tutor-ia?c=${conversation.id}`}
              onClick={onNavigate}
              className="min-w-0 flex-1 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={`block truncate text-sm font-semibold ${isActive ? "text-brand-text" : "text-foreground"}`}
              >
                {conversation.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {formatDate(conversation.updatedAt)}
              </span>
            </Link>
            <TutorConversationActions
              conversationId={conversation.id}
              currentTitle={conversation.title}
              isActive={isActive}
            />
          </div>
        );
      })}
    </nav>
  );
}

export function TutorConversationHistory({
  conversations,
  activeConversationId,
  variant,
  onHide,
}: {
  conversations: TutorConversation[];
  activeConversationId: string | null;
  variant: "desktop" | "mobile";
  onHide?: () => void;
}) {
  if (variant === "desktop")
    return (
      <aside className="hidden w-72 shrink-0 border-r border-border bg-card-2/30 p-3 lg:flex lg:flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border px-2 pb-3">
          <div>
            <p className="font-display text-base font-bold text-foreground">Conversas</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Seu histórico de estudos</p>
          </div>
          <div className="flex items-center gap-1">
            <History className="size-4 text-brand-text" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="hover:text-brand-hover border-0! bg-transparent! text-brand-text shadow-none! hover:bg-brand-dim!"
              onClick={onHide}
              aria-label="Ocultar conversas"
              title="Ocultar conversas"
            >
              <ChevronLeft aria-hidden />
            </Button>
          </div>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
          />
        </div>
      </aside>
    );

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <History aria-hidden /> Conversas
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(22rem,88vw)] p-0">
          <SheetHeader className="border-b border-border pr-12">
            <SheetTitle>Conversas</SheetTitle>
            <SheetDescription>Retome seus assuntos de estudo.</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto p-3">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
            />
          </div>
          <div className="border-t border-border p-3">
            <Button asChild className="w-full">
              <Link href="/aluno/tutor-ia">
                <MessageCirclePlus aria-hidden /> Nova conversa
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
