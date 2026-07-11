import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeckReview, type ReviewCard } from "./DeckReview";
import { isDue, DEFAULT_SRS_STATE, type SrsState } from "@/lib/srs/sm2";

export const dynamic = "force-dynamic";

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const supabase = await createClient();

  const { data: deck } = await supabase.from("flashcard_decks").select("id, title").eq("id", deckId).single();
  if (!deck) notFound();

  const { data: cards } = await supabase.from("flashcards").select("id, front, back, srs_state").eq("deck_id", deckId);

  const now = new Date();
  const dueCards: ReviewCard[] = (cards ?? [])
    .map((c) => ({ ...c, srs_state: (c.srs_state as SrsState) ?? DEFAULT_SRS_STATE }))
    .filter((c) => isDue(c.srs_state, now));

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/aluno/flashcards" className="sidebar-link" style={{ padding: "0 0 8px", display: "inline-block" }}>
            ← Flashcards
          </Link>
          <h1 className="page-title">{deck.title}</h1>
          <div className="exam-meta">
            <span className="chip">{cards?.length ?? 0} cartões</span>
            <span className="chip">{dueCards.length} pendentes</span>
          </div>
        </div>
      </div>

      <DeckReview deckId={deckId} dueCards={dueCards} />
    </>
  );
}
