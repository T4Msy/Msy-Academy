import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { JoinClassDialog } from "./JoinClassDialog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minhas Turmas" };

type EnrollmentRow = {
  class_id: string;
  created_at: string;
  classes: {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
  } | null;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function AlunoTurmasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("class_id, created_at, classes(id, name, invite_code, created_at)")
    .eq("student_id", user!.id)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  const classes = ((enrollments ?? []) as unknown as EnrollmentRow[])
    .map((enrollment) =>
      enrollment.classes
        ? {
            ...enrollment.classes,
            enrollmentCreatedAt: enrollment.created_at,
          }
        : null,
    )
    .filter((klass): klass is NonNullable<typeof klass> => Boolean(klass));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">
            Minhas Turmas
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {classes.length > 0
              ? `${classes.length} turma${classes.length > 1 ? "s" : ""} em que você está matriculado.`
              : "Entre em uma turma com o código compartilhado pelo professor."}
          </p>
        </div>
        <JoinClassDialog />
      </div>

      {classes.length === 0 ? (
        <EmptyState
          variant="turma"
          title="Nenhuma turma ainda"
          text="Use o código de convite do professor para entrar na sua primeira turma."
          action={<JoinClassDialog />}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5">
          {classes.map((klass) => (
            <div
              key={klass.id}
              className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2"
            >
              <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">
                {klass.name}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs whitespace-nowrap text-muted-foreground">
                  Código: {klass.invite_code}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2.5 pt-2 text-xs text-subtle">
                <span>Entrada</span>
                <span>{formatDate(klass.enrollmentCreatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
