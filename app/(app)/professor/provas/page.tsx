import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { ExamCardActions } from "./ExamCardActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minhas Provas" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function ProvasPage() {
  const supabase = await createClient();

  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, course, style, version, ai_provider, include_answer_key, created_at")
    .order("created_at", { ascending: false });

  const list = exams ?? [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Minhas Provas</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {list.length > 0
              ? `${list.length} prova${list.length > 1 ? "s" : ""} salva${list.length > 1 ? "s" : ""}`
              : "Suas provas geradas ficam salvas aqui."}
          </p>
        </div>
        <Link href="/professor/provas/nova" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5">
          <svg fill="none" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nova Prova
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          variant="biblioteca"
          title="Nenhuma prova ainda"
          text="Gere sua primeira prova com IA. As questões ficam salvas e editáveis, prontas para exportar e reutilizar."
          action={
            <Link href="/professor/provas/nova" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-4 py-2.5">
              Gerar primeira prova
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {list.map((exam) => (
            <div key={exam.id} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2">
              <Link href={`/professor/provas/${exam.id}`} className="flex flex-1 flex-col gap-2.5">
              <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{exam.title || "Prova sem título"}</div>
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                {exam.course && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{exam.course}</span>}
                {exam.style && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{exam.style}</span>}
                {exam.version > 1 && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Versão {exam.version}</span>}
                {exam.include_answer_key && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">Com gabarito</span>}
              </div>
              </Link>
              <div className="mt-auto flex items-center justify-between gap-2.5 pt-2 text-xs text-subtle">
                <span>{exam.ai_provider ?? "IA"}</span>
                <div className="flex items-center gap-2">
                  <span>{formatDate(exam.created_at)}</span>
                  <ExamCardActions examId={exam.id} examTitle={exam.title || "Prova sem título"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
