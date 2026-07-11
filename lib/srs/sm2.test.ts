import { describe, expect, it } from "vitest";
import { DEFAULT_SRS_STATE, isDue, reviewCard, type SrsState } from "./sm2";

describe("reviewCard", () => {
  it("resets repetitions and schedules a 1-day interval on a failed recall (quality < 3)", () => {
    const state: SrsState = { repetitions: 4, interval_days: 30, ease_factor: 2.6, next_review_at: null };
    const now = new Date("2026-01-01T00:00:00.000Z");

    const next = reviewCard(state, 2, now);

    expect(next.repetitions).toBe(0);
    expect(next.interval_days).toBe(1);
    expect(next.next_review_at).toBe("2026-01-02T00:00:00.000Z");
  });

  it("follows the fixed 1 / 6 / interval*ease progression on successful recalls", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");

    const first = reviewCard(DEFAULT_SRS_STATE, 5, now);
    expect(first.repetitions).toBe(1);
    expect(first.interval_days).toBe(1);

    const second = reviewCard(first, 5, now);
    expect(second.repetitions).toBe(2);
    expect(second.interval_days).toBe(6);

    const third = reviewCard(second, 5, now);
    expect(third.repetitions).toBe(3);
    expect(third.interval_days).toBe(Math.round(6 * second.ease_factor));
  });

  it("never lets the ease factor drop below the SM-2 floor of 1.3", () => {
    let state: SrsState = DEFAULT_SRS_STATE;
    const now = new Date("2026-01-01T00:00:00.000Z");
    for (let i = 0; i < 20; i++) {
      state = reviewCard(state, 0, now);
    }
    expect(state.ease_factor).toBeGreaterThanOrEqual(1.3);
  });

  it("increases the ease factor on a perfect recall (quality 5)", () => {
    const next = reviewCard(DEFAULT_SRS_STATE, 5, new Date());
    expect(next.ease_factor).toBeGreaterThan(DEFAULT_SRS_STATE.ease_factor);
  });
});

describe("isDue", () => {
  it("is due when never reviewed", () => {
    expect(isDue(DEFAULT_SRS_STATE)).toBe(true);
  });

  it("is due once the scheduled date has passed", () => {
    const state: SrsState = { ...DEFAULT_SRS_STATE, next_review_at: "2026-01-01T00:00:00.000Z" };
    expect(isDue(state, new Date("2026-01-02T00:00:00.000Z"))).toBe(true);
  });

  it("is not due before the scheduled date", () => {
    const state: SrsState = { ...DEFAULT_SRS_STATE, next_review_at: "2026-01-10T00:00:00.000Z" };
    expect(isDue(state, new Date("2026-01-02T00:00:00.000Z"))).toBe(false);
  });
});
