import { describe, expect, it } from "vitest";
import { deriveProfessorOnboardingProgress } from "./onboardingProgressModel";

describe("professor onboarding progress", () => {
  it("starts empty and advances from persisted counts", () => {
    expect(deriveProfessorOnboardingProgress(0, 0, 0).completedSteps).toBe(0);
    expect(deriveProfessorOnboardingProgress(1, 1, 1)).toMatchObject({ completedSteps: 3, hasInvitedStudent: true });
  });
});
