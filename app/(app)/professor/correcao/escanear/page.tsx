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
      <div className="page-head">
        <div>
          <h1 className="page-title">Escanear Gabarito</h1>
          <p className="page-subtitle">Escolha a prova para fotografar os cartões-resposta preenchidos.</p>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          variant="notificacao"
          title="Nenhuma prova atribuída ainda"
          text="Atribua uma prova a uma turma e gere o gabarito antes de escanear."
        />
      ) : (
        <ul className="question-options-list">
          {list.map((a) => (
            <li key={a.id} className="question-option list-row">
              <span>
                <span className="chip mr-sm">{classNameById.get(a.class_id) ?? "Turma"}</span>
                {examTitleById.get(a.content_id) ?? "(prova removida)"}
              </span>
              <Link href={`/professor/correcao/escanear/${a.id}`} className="btn btn-primary btn-sm">
                Escanear
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
