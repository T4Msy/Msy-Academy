"use client";

import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Users,
} from "lucide-react";
import { useStudentDashboardStats } from "@/hooks/useStudentDashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import type { StudentRoutine } from "@/lib/dashboard/studentStats";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(value),
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export function StudentRoutineDashboard() {
  const { data, isError } = useStudentDashboardStats();

  if (isError)
    return (
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar sua rotina de estudos.
      </p>
    );
  if (!data) return <DashboardSkeleton />;

  const { routine } = data;
  const progressPercentage =
    routine.assignmentProgress.total > 0
      ? Math.round((routine.assignmentProgress.completed / routine.assignmentProgress.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-3.5 xl:grid-cols-3">
        <Card className="gap-0 border-border bg-card py-0 shadow-elevated xl:col-span-2">
          <CardHeader className="px-5.5 pt-5.5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="font-display text-lg font-bold text-foreground">
                  Progresso das atividades
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Acompanhe o que já foi concluído nas suas turmas.
                </CardDescription>
              </div>
              <span className="font-display text-2xl font-extrabold text-brand-text">
                {progressPercentage}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="border-t border-border px-5.5 py-4.5">
            <div
              className="h-2 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.08)]"
              role="progressbar"
              aria-label="Progresso de atividades"
              aria-valuemin={0}
              aria-valuemax={routine.assignmentProgress.total}
              aria-valuenow={routine.assignmentProgress.completed}
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {routine.assignmentProgress.completed} de {routine.assignmentProgress.total}{" "}
              atividades concluídas
            </p>
          </CardContent>
        </Card>

        <StudyTimeCard
          hasRecords={routine.studyTime.hasRecords}
          today={routine.studyTime.todaySeconds}
          week={routine.studyTime.weekSeconds}
          month={routine.studyTime.monthSeconds}
        />
      </div>

      {routine.continueItem && (
        <Card className="gap-0 border-brand-border bg-brand-dim py-0 shadow-elevated">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5.5 py-4.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-brand-text">
                <PlayCircle className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-brand-text uppercase">
                  Continue de onde parou
                </p>
                <p className="truncate font-display text-base font-bold text-foreground">
                  {routine.continueItem.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {routine.continueItem.detail}
                </p>
              </div>
            </div>
            <Link
              href={routine.continueItem.href}
              className="hover:bg-brand-hover rounded-sm bg-brand px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Continuar
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3.5 xl:grid-cols-2">
        <RecentGradesCard grades={routine.recentGrades} />
        <AnnouncementsCard announcements={routine.announcements} />
      </div>

      <section aria-labelledby="student-classes-title">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="student-classes-title"
              className="font-display text-xl font-bold text-foreground"
            >
              Minhas turmas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse conteúdos, prazos e materiais por turma.
            </p>
          </div>
          <Link
            href="/aluno/turmas"
            className="hover:text-brand-hover text-sm font-semibold text-brand-text"
          >
            Ver todas
          </Link>
        </div>
        {routine.classes.length === 0 ? (
          <EmptyRoutine
            icon={Users}
            text="Entre em uma turma para acompanhar seus conteúdos aqui."
            actionHref="/aluno/turmas"
            actionLabel="Ver turmas"
          />
        ) : (
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {routine.classes.map((classroom) => (
              <ClassCard key={classroom.id} classroom={classroom} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StudyTimeCard({
  hasRecords,
  today,
  week,
  month,
}: {
  hasRecords: boolean;
  today: number;
  week: number;
  month: number;
}) {
  return (
    <Card className="gap-0 border-border bg-card py-0 shadow-elevated">
      <CardHeader className="px-5.5 pt-5.5 pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Clock3 className="size-4.5 text-brand-text" aria-hidden />
          Tempo estudado
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5.5 pb-5.5">
        {hasRecords ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            <TimeValue label="Hoje" value={formatDuration(today)} />
            <TimeValue label="Semana" value={formatDuration(week)} />
            <TimeValue label="Mês" value={formatDuration(month)} />
          </div>
        ) : (
          <p className="text-sm leading-snug text-muted-foreground">
            O tempo aparecerá aqui conforme suas sessões de estudo forem registradas.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TimeValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-base font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function RecentGradesCard({ grades }: { grades: StudentRoutine["recentGrades"] }) {
  return (
    <Card className="gap-0 border-border bg-card py-0 shadow-elevated">
      <CardHeader className="px-5.5 pt-5.5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg font-bold text-foreground">
              Notas recentes
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Últimas avaliações corrigidas.
            </CardDescription>
          </div>
          <Link
            href="/aluno/tarefas?filter=completed"
            className="hover:text-brand-hover text-xs font-semibold text-brand-text"
          >
            Ver todas
          </Link>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border px-5.5 py-0">
        {grades.length === 0 ? (
          <p className="py-5 text-sm text-muted-foreground">
            Suas notas aparecerão aqui quando uma atividade for corrigida.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {grades.map((grade) => (
              <li key={grade.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{grade.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[grade.subject, formatDate(grade.gradedAt)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 font-display text-lg font-extrabold text-brand-text">
                  {grade.score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AnnouncementsCard({ announcements }: { announcements: StudentRoutine["announcements"] }) {
  return (
    <Card className="gap-0 border-border bg-card py-0 shadow-elevated">
      <CardHeader className="px-5.5 pt-5.5 pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Bell className="size-4.5 text-brand-text" aria-hidden />
          Avisos das turmas
        </CardTitle>
        <CardDescription className="mt-1 text-xs">
          Recados publicados pelos professores.
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t border-border px-5.5 py-0">
        {announcements.length === 0 ? (
          <p className="py-5 text-sm text-muted-foreground">
            Nenhum aviso publicado nas suas turmas.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="py-3.5">
                <p className="text-sm leading-snug text-foreground">{announcement.message}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {[
                    announcement.teacherName,
                    announcement.className,
                    formatDate(announcement.publishedAt),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ClassCard({
  classroom,
}: {
  classroom: {
    id: string;
    name: string;
    subject: string | null;
    teacherName: string | null;
    nextExam: string | null;
    nextActivity: string | null;
    pendingAssignments: number;
    materialsCount: number;
  };
}) {
  return (
    <Card className="gap-0 border-border bg-card py-0 shadow-elevated">
      <CardContent className="flex h-full flex-col px-5.5 py-5">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">{classroom.name}</h3>
          {(classroom.subject || classroom.teacherName) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {[classroom.subject, classroom.teacherName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <ClassDetail label="Próxima prova" value={classroom.nextExam} icon={CalendarClock} />
          <ClassDetail
            label="Próxima atividade"
            value={classroom.nextActivity}
            icon={CheckCircle2}
          />
          <ClassDetail
            label="Pendentes"
            value={`${classroom.pendingAssignments} atividade${classroom.pendingAssignments === 1 ? "" : "s"}`}
            icon={Clock3}
          />
          <ClassDetail
            label="Materiais"
            value={`${classroom.materialsCount} disponível${classroom.materialsCount === 1 ? "" : "is"}`}
            icon={BookOpen}
          />
        </div>
        <Link
          href={`/aluno/turmas/${classroom.id}`}
          className="mt-5 inline-flex justify-center rounded-sm border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Acessar turma
        </Link>
      </CardContent>
    </Card>
  );
}

function ClassDetail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon: LucideIcon;
}) {
  return value ? (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-brand-text" aria-hidden />
      <p className="min-w-0 text-muted-foreground">
        <span className="font-semibold text-foreground">{label}: </span>
        {value}
      </p>
    </div>
  ) : null;
}

function EmptyRoutine({
  icon: Icon,
  text,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  text: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <Card className="items-center gap-2 border-dashed py-8 text-center">
      <Icon className="size-6 text-brand-text" aria-hidden />
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link
        href={actionHref}
        className="hover:text-brand-hover mt-1 text-sm font-semibold text-brand-text"
      >
        {actionLabel}
      </Link>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-3.5 xl:grid-cols-2">
      <Skeleton className="h-42" />
      <Skeleton className="h-42" />
      <Skeleton className="h-64 xl:col-span-2" />
    </div>
  );
}
