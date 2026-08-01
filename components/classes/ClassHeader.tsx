import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Cabeçalho de turma compartilhado entre aluno e professor — substitui o
 * markup manual repetido em cada page.tsx. `actions` é um slot livre (botão
 * excluir turma / atalho de Configurações), decidido por quem chama.
 */
export function ClassHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  roleBadge,
  actions,
  moduleSwitcher,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: React.ReactNode;
  roleBadge?: React.ReactNode;
  actions?: React.ReactNode;
  moduleSwitcher?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <Link
        href={backHref}
        className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">
              {title}
            </h1>
            {roleBadge}
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {moduleSwitcher}
          {actions}
        </div>
      </div>
    </div>
  );
}

export function ClassRoleBadge({ role }: { role: "Aluno" | "Professor" }) {
  return <Badge variant="outline">{role}</Badge>;
}
