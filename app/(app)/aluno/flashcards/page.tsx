import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GenerateDeckForm } from "./GenerateDeckForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Flashcards" };

export default async function FlashcardsPage() {
  const supabase = await createClient();

  const [{ data: decks }, { data: materials }] = await Promise.all([
    supabase.from("flashcard_decks").select("id, title, created_at").order("created_at", { ascending: false }),
    supabase.from("materials").select("id, title").eq("kind", "FILE").order("title"),
  ]);

  const list = decks ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="page-subtitle">
            {list.length > 0 ? `${list.length} deck${list.length > 1 ? "s" : ""}` : "Gere flashcards a partir dos materiais das suas turmas."}
          </p>
        </div>
      </div>

      <GenerateDeckForm materials={materials ?? []} />

      {list.length > 0 && (
        <div className="exam-grid" style={{ marginTop: 16 }}>
          {list.map((d) => (
            <Link key={d.id} href={`/aluno/flashcards/${d.id}`} className="exam-card">
              <div className="exam-card-title">{d.title}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
