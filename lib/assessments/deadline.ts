export type AssessmentAvailability = "active" | "expired";

/** A missing deadline means the assessment remains available indefinitely. */
export function getAssessmentAvailability(dueAt: string | null | undefined, now = Date.now()): AssessmentAvailability {
  if (!dueAt) return "active";
  const deadline = new Date(dueAt).getTime();
  return Number.isFinite(deadline) && deadline <= now ? "expired" : "active";
}

export function isAssessmentExpired(dueAt: string | null | undefined, now = Date.now()): boolean {
  return getAssessmentAvailability(dueAt, now) === "expired";
}
