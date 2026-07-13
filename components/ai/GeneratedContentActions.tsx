"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiThinking } from "@/components/AiThinking";

/**
 * Barra de ações padrão sobre conteúdo gerado por IA (decisão nº 15 do
 * ADR 13): regenerar + ações contextuais (aceitar/editar chegam como
 * children para compor com o fluxo de cada tela).
 */
export function GeneratedContentActions({
  onRegenerate,
  regenerating = false,
  regenerateLabel = "Gerar novamente",
  children,
}: {
  onRegenerate?: () => void;
  regenerating?: boolean;
  regenerateLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onRegenerate && (
        <Button type="button" variant="outline" size="sm" disabled={regenerating} onClick={onRegenerate}>
          {regenerating ? (
            <AiThinking label="Gerando" />
          ) : (
            <>
              <RefreshCw aria-hidden /> {regenerateLabel}
            </>
          )}
        </Button>
      )}
      {children}
    </div>
  );
}
