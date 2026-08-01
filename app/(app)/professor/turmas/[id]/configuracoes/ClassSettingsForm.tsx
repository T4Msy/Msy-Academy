"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { regenerateInviteCode, setJoinMode } from "./actions";

export function ClassSettingsForm({
  classId,
  inviteCode,
  inviteUrl,
  joinMode,
}: {
  classId: string;
  inviteCode: string;
  inviteUrl: string | null;
  joinMode: "auto" | "approval";
}) {
  const [copied, setCopied] = useState(false);
  const [pendingMode, startModeTransition] = useTransition();
  const router = useRouter();

  function copyLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function onJoinModeChange(next: string) {
    if (next !== "auto" && next !== "approval") return;
    startModeTransition(async () => {
      try {
        await setJoinMode(classId, next);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o modo de entrada.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated">
        <div className="border-b border-border px-5.5 pt-5 pb-4">
          <h2 className="font-display text-lg font-bold text-foreground">Código de acesso</h2>
          <p className="mt-1 text-xs text-muted-foreground">Compartilhe este código com os alunos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-5.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-3 py-1.5 font-display text-base font-bold text-foreground">
            {inviteCode}
          </span>
          <ConfirmActionButton
            triggerLabel="Regenerar código"
            title="Regenerar código de acesso?"
            description="O código atual deixará de funcionar imediatamente. Alunos que ainda não entraram com ele precisarão do novo código ou link."
            confirmLabel="Regenerar código"
            pendingLabel="Gerando..."
            successMessage="Novo código gerado."
            action={async () => {
              await regenerateInviteCode(classId);
            }}
            variant="outline"
          />
        </div>
        <p className="px-5.5 pb-5 text-xs leading-snug text-muted-foreground">
          Regenerar invalida o código atual — alunos que ainda não entraram com ele precisarão do novo.
        </p>
      </section>

      {inviteUrl && (
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated">
          <div className="border-b border-border px-5.5 pt-5 pb-4">
            <h2 className="font-display text-lg font-bold text-foreground">Link de convite</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 p-5.5">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{inviteUrl}</span>
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated">
        <div className="border-b border-border px-5.5 pt-5 pb-4">
          <h2 className="font-display text-lg font-bold text-foreground">Modo de entrada</h2>
        </div>
        <div className="p-5.5">
          <RadioGroup value={joinMode} onValueChange={onJoinModeChange} aria-label="Modo de entrada" className="gap-3" disabled={pendingMode}>
            <label className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm text-foreground transition-colors hover:bg-card-2">
              <RadioGroupItem value="auto" className="mt-0.5" />
              <span>
                <strong className="block">Entrada automática</strong>
                <span className="text-muted-foreground">O código ou link matricula o aluno imediatamente.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm text-foreground transition-colors hover:bg-card-2">
              <RadioGroupItem value="approval" className="mt-0.5" />
              <span>
                <strong className="block">Com aprovação</strong>
                <span className="text-muted-foreground">O aluno solicita entrada; você aprova ou rejeita antes da matrícula.</span>
              </span>
            </label>
          </RadioGroup>
        </div>
      </section>
    </div>
  );
}
