import { describe, expect, it } from "vitest";
import { getAssessmentAvailability, isAssessmentExpired } from "./deadline";

describe("assessment deadline", () => {
  const deadline = "2026-07-25T15:00:00.000Z";

  it("keeps an assessment active before its deadline", () => {
    expect(getAssessmentAvailability(deadline, Date.parse("2026-07-25T14:59:59.999Z"))).toBe("active");
    expect(isAssessmentExpired(deadline, Date.parse("2026-07-25T14:59:59.999Z"))).toBe(false);
  });

  it("expires an assessment exactly at and after its deadline", () => {
    const atDeadline = Date.parse(deadline);
    expect(getAssessmentAvailability(deadline, atDeadline)).toBe("expired");
    expect(getAssessmentAvailability(deadline, atDeadline + 1)).toBe("expired");
  });

  it("keeps assessments without a deadline active", () => {
    expect(getAssessmentAvailability(null, Date.now())).toBe("active");
  });
});
