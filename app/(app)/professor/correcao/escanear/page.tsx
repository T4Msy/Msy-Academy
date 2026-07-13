import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Escanear Gabarito" };

/** Picker: choose which EXAM assignment to scan answer sheets for — the actual camera flow needs to know this upfront (it's baked into the upload). */
export default async function EscanearPickerPage() {
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, class_id, content_id, due_at")
    .eq("content_type", "EXAM")
    .order("created_at", { ascending: false });

  const list = assignments ?? [];
  const classIds = [...new Set(list.map((a) => a.class_id))];
  const examIds = [...new Set(list.map((a) => a.content_id))];

  const [{ data: classes }, { data: exams }] = await Promise.all([
    classIds.length ? supabase.from("classes").select("id, name").in("id", classIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    examIds.length ? supabase.from("exams").select("id, title").in("id", examIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));
  const examTitleById = new Map((exams ?? []).map((e) => [e.id, e.title]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Escanear Gabarito</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Escolha a prova para fotografar os cartões-resposta preenchidos.</p>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          variant="notificacao"
          title="Nenhuma prova atribuída ainda"
          text="Atribua uma prova a uma turma e gere o gabarito antes de escanear."
        />
      ) : (
        <ul className="flex list-none flex-col gap-2">
          {list.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-sm border border-border px-3 py-[9px] text-[13.5px] text-muted-foreground">
              <span>
                <span className="mr-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{classNameById.get(a.class_id) ?? "Turma"}</span>
                {examTitleById.get(a.content_id) ?? "(prova removida)"}
              </span>
              <Link href={`/professor/correcao/escanear/${a.id}`} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm">
                Escanear
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
