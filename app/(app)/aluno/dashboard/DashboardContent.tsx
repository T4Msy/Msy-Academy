"use client";

import { StatRing } from "@/components/charts/StatRing";
import { useStudentDashboardStats } from "@/hooks/useStudentDashboardStats";

export function DashboardContent() {
  const { data, isError } = useStudentDashboardStats();

  if (isError) return <p className="mt-1 text-xs leading-snug text-muted-foreground">N\u00e3o foi poss\u00edvel carregar seu progresso.</p>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
      <MetricCard label="Tarefas conclu\u00eddas" value={data.completedAssignments} />
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
        <div className="flex flex-col gap-4.5 p-5.5"><StatRing value={data.accuracyPct} label="Acerto em objetivas" size={72} strokeWidth={7} /></div>
      </div>
      <MetricCard label="Itens de estudo conclu\u00eddos" value={`${data.completedStudyItems}/${data.totalStudyItems}`} />
      <MetricCard label="Decks de flashcards" value={data.flashcardDecks} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-col gap-4.5 p-5.5">
        <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">{label}</div>
        <p className="mt-2 font-display text-[28px] font-extrabold">{value}</p>
      </div>
    </div>
  );
}
