"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { approveJoinRequest, rejectJoinRequest } from "./actions";

export type PendingJoinRequest = {
  id: string;
  studentName: string | null;
  createdAt: string;
};

export function PendingJoinRequests({ classId, requests }: { classId: string; requests: PendingJoinRequest[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function resolve(requestId: string, action: "approve" | "reject") {
    startTransition(async () => {
      try {
        if (action === "approve") await approveJoinRequest(classId, requestId);
        else await rejectJoinRequest(classId, requestId);
        toast.success(action === "approve" ? "Aluno matriculado." : "Solicitação rejeitada.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível concluir esta ação.");
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated">
      <div className="border-b border-border px-5.5 pt-5 pb-4">
        <h2 className="font-display text-lg font-bold text-foreground">Solicitações pendentes ({requests.length})</h2>
      </div>
      <div className="p-5.5">
        {requests.length === 0 ? (
          <EmptyState variant="notificacao" title="Nenhuma solicitação pendente" text="Pedidos de entrada aparecerão aqui enquanto o modo de aprovação estiver ativo." />
        ) : (
          <ul className="flex list-none flex-col gap-2">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-col gap-2 rounded-sm border border-border px-3 py-2.5 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>{request.studentName ?? "Aluno"}</span>
                <span className="flex gap-2">
                  <Button type="button" size="sm" disabled={pending} onClick={() => resolve(request.id, "approve")}>Aprovar</Button>
                  <Button type="button" size="sm" variant="destructive-ghost" disabled={pending} onClick={() => resolve(request.id, "reject")}>Rejeitar</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
