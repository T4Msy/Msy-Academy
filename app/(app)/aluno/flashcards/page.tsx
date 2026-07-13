import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CreateModeTabs } from "@/components/CreateModeTabs";
import { GenerateDeckForm } from "./GenerateDeckForm";
import { NewDeckForm } from "./NewDeckForm";

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Flashcards</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            {list.length > 0 ? `${list.length} deck${list.length > 1 ? "s" : ""}` : "Gere flashcards a partir dos materiais das suas turmas."}
          </p>
        </div>
      </div>

      <CreateModeTabs
        aiLabel="Gerar com IA"
        aiDesc="A IA monta os cartões a partir de um material já processado."
        blankLabel="Criar do zero"
        blankDesc="Comece com um deck em branco e adicione os cartões manualmente."
        aiForm={<GenerateDeckForm materials={materials ?? []} />}
        blankForm={<NewDeckForm />}
      />

      {list.length > 0 && (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {list.map((d) => (
            <Link key={d.id} href={`/aluno/flashcards/${d.id}`} className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-card-2">
              <div className="font-display text-base font-bold tracking-[-0.2px] text-foreground">{d.title}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
