import Link from "next/link";
import { cn } from "@/lib/utils";

export type ProgressStep = {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  href?: string;
  actionLabel?: string;
};

export type DashboardProgressCardProps = {
  title: string;
  description?: string;
  steps: ProgressStep[];
  completedLabel?: string;
  className?: string;
};

export function DashboardProgressCard({ title, description, steps, completedLabel = "concluídas", className }: DashboardProgressCardProps) {
  const completed = steps.filter((step) => step.completed).length;
  const total = steps.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-card shadow-elevated", className)} aria-labelledby="dashboard-progress-title">
      <div className="border-b border-border px-5.5 pt-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="dashboard-progress-title" className="font-display text-lg font-bold tracking-[-0.2px] text-foreground">{title}</h2>
            {description && <p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p>}
          </div>
          <span className="font-display text-sm font-bold text-brand-text">{completed}/{total} {completedLabel}</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.08)]" role="progressbar" aria-label={`Progresso: ${completed} de ${total} etapas concluídas`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}>
          <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${percentage}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{percentage}% concluído</p>
      </div>
      <ol className="flex list-none flex-col divide-y divide-border">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-start gap-3 px-5.5 py-4">
            <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold", step.completed ? "border-brand-border bg-brand-dim text-brand-text" : "border-border text-muted-foreground")} aria-hidden="true">{step.completed ? "✓" : index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-semibold", step.completed ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
              {step.description && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{step.description}</p>}
            </div>
            {!step.completed && step.href && step.actionLabel && <Link href={step.href} className="shrink-0 rounded-sm border border-border px-3 py-2 text-xs font-semibold text-foreground outline-none hover:border-border-hover focus-visible:ring-[3px] focus-visible:ring-brand-glow">{step.actionLabel}</Link>}
          </li>
        ))}
      </ol>
      {completed === total && total > 0 && <p className="border-t border-border bg-brand-dim px-5.5 py-3 text-sm font-semibold text-brand-text">Tudo pronto para acompanhar suas turmas.</p>}
    </section>
  );
}
