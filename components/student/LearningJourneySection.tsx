import Link from "next/link";
import { ArrowRight, BookOpenCheck, Check, Circle, Clock3, Flame, ListChecks, Sparkles, Trophy } from "lucide-react";
import type { StudentDashboardStats } from "@/lib/dashboard/studentStats";

type JourneyProps = { data: StudentDashboardStats };

function formatTime(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes}min`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
}

export function LearningJourneySection({ data }: JourneyProps) {
  const { routine } = data;
  const total = routine.assignmentProgress.total;
  const completed = routine.assignmentProgress.completed;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const nextHref = routine.continueItem?.href ?? "/aluno/estudo-animado";
  const nextTitle = routine.continueItem?.title ?? (total > completed ? "Resolver sua próxima atividade" : "Começar uma sessão de estudo");
  const timeline = routine.recentGrades.slice(0, 3).map((grade) => ({ label: `Resultado: ${grade.title}`, date: grade.gradedAt }));
  const achievements = [
    { label: "Primeiro compromisso concluído", done: data.completedAssignments >= 1, icon: Check },
    { label: "5 dias estudando", done: data.studyStreak.currentStreak >= 5, icon: Flame },
    { label: "Primeiro item do plano", done: data.completedStudyItems >= 1, icon: ListChecks },
    { label: "Primeira revisão criada", done: data.flashcardDecks >= 1, icon: BookOpenCheck },
    { label: "10 compromissos concluídos", done: data.completedAssignments >= 10, icon: Trophy },
  ];

  return <section className="space-y-5" aria-labelledby="learning-journey-title">
    <div className="rounded-lg border border-brand-border bg-brand-dim p-5.5 shadow-elevated sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-brand-text">Sua jornada</p><h2 id="learning-journey-title" className="mt-1 font-display text-2xl font-extrabold text-foreground">Você já avançou {percentage}%</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">{routine.continueItem ? "Continue de onde parou para transformar esse avanço em ritmo." : "Cada sessão concluída torna seu próximo passo mais claro."}</p></div><Sparkles className="size-6 text-brand-text" aria-hidden /></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-card/70" role="progressbar" aria-label="Progresso da jornada de atividades" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${percentage}%` }} /></div><div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{completed} de {total} atividades concluídas</span><span>Próximo objetivo: {nextTitle}</span></div><Link href={nextHref} className="mt-5 inline-flex items-center gap-2 rounded-sm bg-brand px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring">Continuar <ArrowRight className="size-4" aria-hidden /></Link></div>

    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-lg border border-border bg-card p-5.5" aria-labelledby="weekly-summary-title"><div className="flex items-center justify-between gap-3"><div><h3 id="weekly-summary-title" className="font-display text-lg font-bold text-foreground">Resumo da semana</h3><p className="mt-1 text-xs text-muted-foreground">Ritmo recente e evolução acumulada.</p></div><Clock3 className="size-5 text-brand-text" aria-hidden /></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><SummaryItem label="Tempo · 7 dias" value={formatTime(routine.studyTime.weekSeconds)} /><SummaryItem label="Sequência atual" value={`${data.studyStreak.currentStreak} dias`} /><SummaryItem label="Concluídas no total" value={`${completed}`} /><SummaryItem label="Acerto geral" value={data.accuracyPct === null ? "—" : `${data.accuracyPct}%`} /></div></section>
      <section className="rounded-lg border border-border bg-card p-5.5" aria-labelledby="timeline-title"><div className="flex items-center justify-between gap-3"><div><h3 id="timeline-title" className="font-display text-lg font-bold text-foreground">Sua evolução recente</h3><p className="mt-1 text-xs text-muted-foreground">Últimos resultados registrados.</p></div><Link href="/aluno/dashboard" className="text-xs font-bold text-brand-text">Ver progresso</Link></div>{timeline.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">Conclua uma atividade para começar sua linha do tempo.</p> : <ol className="mt-5 space-y-3">{timeline.map((event) => <li key={`${event.label}-${event.date}`} className="flex items-start gap-3"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-dim text-brand-text"><Check className="size-3.5" aria-hidden /></span><span className="min-w-0"><b className="block truncate text-sm font-semibold text-foreground">{event.label}</b><span className="text-xs capitalize text-muted-foreground">{formatDate(event.date)}</span></span></li>)}</ol>}</section>
    </div>

    <section className="rounded-lg border border-border bg-card p-5.5" aria-labelledby="achievements-title"><div className="flex items-center justify-between gap-3"><div><h3 id="achievements-title" className="font-display text-lg font-bold text-foreground">Conquistas de aprendizagem</h3><p className="mt-1 text-xs text-muted-foreground">Marcos baseados no que você realmente estudou.</p></div><Trophy className="size-5 text-brand-text" aria-hidden /></div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{achievements.map(({ label, done, icon: Icon }) => <div key={label} className={`flex items-center gap-3 rounded-md border p-3 ${done ? "border-brand-border bg-brand-dim" : "border-border bg-card-2"}`}><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${done ? "bg-brand text-primary-foreground" : "border border-border text-muted-foreground"}`}>{done ? <Icon className="size-4" aria-hidden /> : <Circle className="size-4" aria-hidden />}</span><span className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span></div>)}</div></section>
  </section>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-border bg-card-2 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg font-extrabold text-foreground">{value}</p></div>;
}
