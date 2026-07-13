import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RenameDeleteMenu } from "@/components/shell/RenameDeleteMenu";
import { DeckTabs } from "./DeckTabs";
import { isDue, DEFAULT_SRS_STATE, type SrsState } from "@/lib/srs/sm2";
import { renameDeck, deleteDeck } from "../actions";

export const dynamic = "force-dynamic";

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const supabase = await createClient();

  const { data: deck } = await supabase.from("flashcard_decks").select("id, title").eq("id", deckId).single();
  if (!deck) notFound();

  const { data: cards } = await supabase.from("flashcards").select("id, front, back, srs_state").eq("deck_id", deckId);

  const now = new Date();
  const allCards = cards ?? [];
  const dueCards = allCards
    .map((c) => ({ ...c, srs_state: (c.srs_state as SrsState) ?? DEFAULT_SRS_STATE }))
    .filter((c) => isDue(c.srs_state, now));

  const renameAction = renameDeck.bind(null, deckId);
  const deleteAction = deleteDeck.bind(null, deckId);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/aluno/flashcards" className="inline-flex items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Flashcards
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">{deck.title}</h1>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{allCards.length} cartões</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-[rgba(var(--overlay-rgb),0.03)] px-2.5 py-1 text-xs text-muted-foreground">{dueCards.length} pendentes</span>
          </div>
        </div>
        <RenameDeleteMenu currentTitle={deck.title} onRename={renameAction} onDelete={deleteAction} redirectAfterDelete="/aluno/flashcards" />
      </div>

      <DeckTabs deckId={deckId} dueCards={dueCards} allCards={allCards} />
    </>
  );
}
