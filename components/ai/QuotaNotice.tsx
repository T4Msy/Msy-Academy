import Link from "next/link";
import { Gauge } from "lucide-react";

/**
 * Erro 402 (quota de IA excedida) padronizado — primitiva de IA do DS
 * (decisão nº 15 do ADR 13). Toda tela de geração renderiza ESTE aviso
 * quando a rota devolve 402, nunca uma mensagem própria.
 */
export function QuotaNotice({
  message = "Você atingiu o limite de gerações de IA do seu plano neste mês.",
  upgradeHref,
}: {
  message?: string;
  upgradeHref?: string;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-brand-border bg-brand-dim p-4"
    >
      <Gauge size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-brand-text" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-md font-semibold text-foreground">Limite de IA atingido</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        {upgradeHref && (
          <Link href={upgradeHref} className="text-sm font-semibold text-brand-text hover:underline">
            Ver planos e limites →
          </Link>
        )}
      </div>
    </div>
  );
}
