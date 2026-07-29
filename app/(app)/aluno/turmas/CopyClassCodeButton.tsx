"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyClassCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function copyCode() {
    setError(false);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={copyCode} aria-label="Copiar código da turma">
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copiado" : "Copiar código"}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Código da turma copiado." : error ? "Não foi possível copiar o código." : ""}
      </span>
    </span>
  );
}
