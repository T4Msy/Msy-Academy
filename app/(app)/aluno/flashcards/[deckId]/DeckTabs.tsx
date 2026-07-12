"use client";

import { useState } from "react";
import { DeckReview, type ReviewCard } from "./DeckReview";
import { CardsManager } from "./CardsManager";

interface CardData {
  id: string;
  front: string;
  back: string;
}

export function DeckTabs({
  deckId,
  dueCards,
  allCards,
}: {
  deckId: string;
  dueCards: ReviewCard[];
  allCards: CardData[];
}) {
  const [view, setView] = useState<"review" | "manage">("review");

  return (
    <>
      <div className="popover-row mb-md">
        <button
          type="button"
          className={`btn btn-sm ${view === "review" ? "btn-primary" : "btn-ghost"}`}
          aria-pressed={view === "review"}
          onClick={() => setView("review")}
        >
          Revisar
        </button>
        <button
          type="button"
          className={`btn btn-sm ${view === "manage" ? "btn-primary" : "btn-ghost"}`}
          aria-pressed={view === "manage"}
          onClick={() => setView("manage")}
        >
          Gerenciar cartões
        </button>
      </div>
      {view === "review" ? <DeckReview deckId={deckId} dueCards={dueCards} /> : <CardsManager deckId={deckId} cards={allCards} />}
    </>
  );
}
