"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TutorChat, type ChatMessage } from "./TutorChat";
import { TutorConversationHistory, type TutorConversation } from "./TutorConversationHistory";

export function TutorWorkspace({
  conversations,
  conversationId,
  initialMessages,
}: {
  conversations: TutorConversation[];
  conversationId: string | null;
  initialMessages: ChatMessage[];
}) {
  const [historyVisible, setHistoryVisible] = useState(true);
  return (
    <Card className="h-[calc(100vh-12rem)] min-h-128 gap-0 overflow-hidden border-border bg-card py-0 shadow-elevated">
      <CardContent className="flex h-full px-0 py-0">
        {historyVisible && (
          <TutorConversationHistory
            conversations={conversations}
            activeConversationId={conversationId}
            variant="desktop"
            onHide={() => setHistoryVisible(false)}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {!historyVisible && (
            <div className="flex h-12 items-center border-b border-border px-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hover:text-brand-hover border-0! bg-transparent! text-brand-text shadow-none! hover:bg-brand-dim!"
                onClick={() => setHistoryVisible(true)}
              >
                <ChevronRight aria-hidden /> Conversas
              </Button>
            </div>
          )}
          <TutorChat
            key={conversationId ?? "new"}
            conversationId={conversationId}
            initialMessages={initialMessages}
          />
        </div>
      </CardContent>
    </Card>
  );
}
