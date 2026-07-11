/**
 * SM-2 spaced-repetition scheduling (SuperMemo 2) — pure, deterministic, no
 * AI involved. Only the initial flashcard *content* comes from the AI
 * (AITask=FLASHCARDS); the review schedule itself is plain arithmetic, same
 * algorithm Anki's early versions were based on.
 */

export interface SrsState {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string | null;
}

export const DEFAULT_SRS_STATE: SrsState = {
  repetitions: 0,
  interval_days: 0,
  ease_factor: 2.5,
  next_review_at: null,
};

/** Quality of recall, 0-5 (SM-2 scale) — the UI exposes a simplified 4-button subset. */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export function reviewCard(state: SrsState, quality: ReviewQuality, now: Date = new Date()): SrsState {
  let { repetitions, ease_factor: easeFactor } = state;
  let intervalDays: number;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(state.interval_days * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReviewAt = new Date(now.getTime() + intervalDays * 86400000);

  return {
    repetitions,
    interval_days: intervalDays,
    ease_factor: Math.round(easeFactor * 100) / 100,
    next_review_at: nextReviewAt.toISOString(),
  };
}

/** A card is due if it has never been reviewed, or its scheduled date has passed. */
export function isDue(state: SrsState, now: Date = new Date()): boolean {
  if (!state.next_review_at) return true;
  return new Date(state.next_review_at).getTime() <= now.getTime();
}
