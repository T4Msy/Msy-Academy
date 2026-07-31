"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  MessageCircleMore,
  NotebookTabs,
  UserRound,
  Users,
  Waypoints,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STUDENT_MISSIONS, type StudentMissionId } from "@/lib/dashboard/studentMissions";

const VISIBLE_PENDING_MISSIONS = 3;
const COMPACT_PROGRESS_THRESHOLD = 0.7;

const ICONS: Record<StudentMissionId, typeof Users> = {
  classes: Users,
  tasks: ClipboardList,
  materials: BookOpen,
  simulados: FileCheck2,
  "study-plan": NotebookTabs,
  flashcards: Waypoints,
  tutor: MessageCircleMore,
  progress: FileCheck2,
  profile: UserRound,
};

export function StudentMissionsCard({
  initialCompletedIds,
}: {
  initialCompletedIds: StudentMissionId[];
}) {
  const [completedIds, setCompletedIds] = useState<Set<StudentMissionId>>(
    () => new Set(initialCompletedIds),
  );
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showAllMissions, setShowAllMissions] = useState(false);
  const completedCount = completedIds.size;
  const pendingMissions = STUDENT_MISSIONS.filter((mission) => !completedIds.has(mission.id));
  const visibleMissions = showAllMissions
    ? STUDENT_MISSIONS
    : pendingMissions.slice(0, VISIBLE_PENDING_MISSIONS);
  const progress = Math.round((completedCount / STUDENT_MISSIONS.length) * 100);
  const isCompact = completedCount / STUDENT_MISSIONS.length >= COMPACT_PROGRESS_THRESHOLD;
  const isComplete = pendingMissions.length === 0;

  function markVisited(id: StudentMissionId) {
    setStarted(true);
    setCompletedIds((current) => new Set(current).add(id));
  }

  if (isComplete) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card-2 px-4 py-3 text-sm">
        <div>
          <p className="font-display font-bold text-foreground">Guia inicial concluído</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            As missões ficam disponíveis para consulta quando você precisar.
          </p>
        </div>
        <Link
          href="/aluno/missoes"
          className="rounded-sm border border-border px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-border-hover hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
        >
          Revisar missões
        </Link>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card-2 px-4 py-3 text-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display font-bold text-foreground">Guia inicial</p>
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {progress}% concluído
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Você já conhece o essencial. Restam {pendingMissions.length}{" "}
            {pendingMissions.length === 1 ? "missão" : "missões"} opcionais.
          </p>
        </div>
        <Link
          href="/aluno/missoes"
          className="rounded-sm border border-border px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-border-hover hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
        >
          Revisar missões
        </Link>
      </div>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden border-brand-border bg-card py-0 shadow-elevated">
      <CardHeader className="gap-0 border-b border-border px-5.5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <CardTitle className="font-display text-lg font-bold text-foreground">
                Comece por aqui
              </CardTitle>
              <span className="rounded-full border border-border bg-card-2 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {completedCount} de {STUDENT_MISSIONS.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete estas missões para conhecer as principais ferramentas da MSY Academy.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={expanded}
            aria-controls="student-missions-list"
            aria-label={expanded ? "Recolher missões" : "Expandir missões"}
          >
            <ChevronDown
              className={`size-5 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.08)]"
          role="progressbar"
          aria-label="Progresso das missões"
          aria-valuemin={0}
          aria-valuemax={STUDENT_MISSIONS.length}
          aria-valuenow={completedCount}
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent id="student-missions-list" className="px-5.5 py-5">
          {!started && completedCount === 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand-border bg-brand-dim px-4 py-3">
              <div>
                <p className="font-display text-sm font-bold text-foreground">
                  Bem-vindo à MSY Academy!
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Vamos conhecer rapidamente as ferramentas que vão ajudar você a organizar seus
                  estudos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="hover:bg-brand-hover rounded-sm bg-brand px-3.5 py-2 text-xs font-bold text-primary-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              >
                Começar missões
              </button>
            </div>
          )}
          {pendingMissions.length === 0 && !showAllMissions && (
            <p className="mb-4 rounded-md border border-brand-border bg-brand-dim px-4 py-3 text-sm text-brand-text">
              Você concluiu todas as missões iniciais. Veja todas quando quiser revisar alguma
              delas.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMissions.map((mission) => {
              const Icon = ICONS[mission.id];
              const done = completedIds.has(mission.id);
              return (
                <Link
                  key={mission.id}
                  href={mission.href}
                  onClick={() => markVisited(mission.id)}
                  className={`group flex min-h-32 flex-col rounded-md border p-3.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${done ? "border-brand-border bg-brand-dim/50" : "border-border bg-card hover:border-border-hover hover:bg-card-2"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-sm ${done ? "bg-brand text-primary-foreground" : "bg-brand-dim text-brand-text"}`}
                      aria-hidden
                    >
                      {done ? (
                        <Check className="size-4" strokeWidth={2.5} />
                      ) : (
                        <Icon className="size-4.5" strokeWidth={1.8} />
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${done ? "text-brand-text" : "text-muted-foreground"}`}
                    >
                      {done ? "Conhecido" : "Pendente"}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-sm font-bold text-foreground">
                    {mission.title}
                  </p>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {mission.description}
                  </p>
                  <span className="group-hover:text-brand-hover mt-3 text-xs font-bold text-brand-text">
                    {done ? "Acessar novamente" : mission.actionLabel} →
                  </span>
                </Link>
              );
            })}
          </div>
          {STUDENT_MISSIONS.length > VISIBLE_PENDING_MISSIONS && (
            <button
              type="button"
              onClick={() => setShowAllMissions((value) => !value)}
              className="mt-4 rounded-sm border border-border px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={showAllMissions}
              aria-controls="student-missions-list"
            >
              {showAllMissions ? "Mostrar apenas pendentes" : "Ver todas as missões"}
            </button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
