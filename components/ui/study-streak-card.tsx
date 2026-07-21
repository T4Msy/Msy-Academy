import { cn } from "@/lib/utils";

export type StudyStreakCardProps = {
  currentStreak: number;
  dailyGoal: number;
  completedToday: number;
  goalCompleted: boolean;
  hasHistory?: boolean;
  className?: string;
};

export function StudyStreakCard({ currentStreak, dailyGoal, completedToday, goalCompleted, hasHistory = true, className }: StudyStreakCardProps) {
  const percentage = dailyGoal > 0 ? Math.min(100, Math.round((completedToday / dailyGoal) * 100)) : 0;
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-card shadow-elevated", className)} aria-labelledby="study-streak-title">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5.5">
        <div>
          <h2 id="study-streak-title" className="font-display text-lg font-bold text-foreground">Sequência de estudos</h2>
          <p className="mt-1 text-xs text-muted-foreground">{hasHistory ? "Estude um pouco todos os dias para manter o ritmo." : "Ainda não há registros de estudo."}</p>
        </div>
        <div className={cn("rounded-full border px-3 py-1 text-sm font-bold", currentStreak > 0 ? "border-brand-border bg-brand-dim text-brand-text" : "border-border text-muted-foreground")} aria-label={`${currentStreak} dias consecutivos`}>🔥 {currentStreak} {currentStreak === 1 ? "dia" : "dias"}</div>
      </div>
      <div className="border-t border-border px-5.5 py-4">
        <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-foreground">Meta de hoje</span><span className={goalCompleted ? "font-bold text-brand-text" : "text-muted-foreground"}>{completedToday}/{dailyGoal}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.08)]" role="progressbar" aria-label="Progresso da meta diária" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(completedToday, dailyGoal)}><div className={cn("h-full rounded-full transition-[width]", goalCompleted ? "bg-brand" : "bg-muted-foreground")} style={{ width: `${percentage}%` }} /></div>
        <p className={cn("mt-2 text-xs", goalCompleted ? "font-semibold text-brand-text" : "text-muted-foreground")}>{goalCompleted ? "Meta diária atingida." : currentStreak === 0 && hasHistory ? "O streak foi interrompido hoje." : "Continue estudando para atingir a meta."}</p>
      </div>
    </section>
  );
}
