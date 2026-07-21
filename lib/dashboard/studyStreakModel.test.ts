import { describe, expect, it } from "vitest";
import { calculateStudyStreak } from "./studyStreakModel";

describe("calculateStudyStreak", () => {
  it("returns zero without history", () => {
    expect(calculateStudyStreak([], "2026-07-20")).toMatchObject({ currentStreak: 0, completedToday: 0, goalCompleted: false, hasHistory: false });
  });
  it("counts consecutive days and today's goal", () => {
    expect(calculateStudyStreak(["2026-07-18T12:00:00Z", "2026-07-19T12:00:00Z", "2026-07-20T12:00:00Z"], "2026-07-20")).toMatchObject({ currentStreak: 3, completedToday: 1, goalCompleted: true });
  });
  it("marks a broken streak when today has no event", () => {
    expect(calculateStudyStreak(["2026-07-18", "2026-07-19"], "2026-07-20").currentStreak).toBe(0);
  });
});
