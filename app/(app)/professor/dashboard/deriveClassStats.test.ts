import { describe, expect, it } from "vitest";
import { deriveClassStats } from "./deriveClassStats";

const NOW = "2026-07-11T00:00:00.000Z";
const PAST = "2026-07-01T00:00:00.000Z";
const FUTURE = "2026-08-01T00:00:00.000Z";

describe("deriveClassStats", () => {
  it("returns an empty student list for a class with no active enrollments", () => {
    const result = deriveClassStats(
      [{ id: "c1", name: "Turma A" }],
      [],
      [{ id: "a1", class_id: "c1", due_at: PAST }],
      [],
      [],
      [],
      NOW,
    );
    expect(result).toEqual([{ klass: { id: "c1", name: "Turma A" }, students: [] }]);
  });

  it("marks a student at risk when they have an overdue assignment with no submission", () => {
    const result = deriveClassStats(
      [{ id: "c1", name: "Turma A" }],
      [{ class_id: "c1", student_id: "s1" }],
      [{ id: "a1", class_id: "c1", due_at: PAST }],
      [],
      [],
      [{ id: "s1", full_name: "Ana" }],
      NOW,
    );
    expect(result[0].students).toEqual([
      { studentId: "s1", name: "Ana", overdueCount: 1, accuracyPct: null, atRisk: true },
    ]);
  });

  it("does not count a future-due assignment as overdue", () => {
    const result = deriveClassStats(
      [{ id: "c1", name: "Turma A" }],
      [{ class_id: "c1", student_id: "s1" }],
      [{ id: "a1", class_id: "c1", due_at: FUTURE }],
      [],
      [],
      [{ id: "s1", full_name: "Ana" }],
      NOW,
    );
    expect(result[0].students[0].overdueCount).toBe(0);
  });

  it("computes accuracy from the student's own submissions/answers only, isolated across classes", () => {
    const result = deriveClassStats(
      [{ id: "c1", name: "Turma A" }, { id: "c2", name: "Turma B" }],
      [{ class_id: "c1", student_id: "s1" }, { class_id: "c2", student_id: "s2" }],
      [{ id: "a1", class_id: "c1", due_at: PAST }, { id: "a2", class_id: "c2", due_at: PAST }],
      [
        { id: "sub1", assignment_id: "a1", student_id: "s1", status: "GRADED" },
        { id: "sub2", assignment_id: "a2", student_id: "s2", status: "GRADED" },
      ],
      [
        { submission_id: "sub1", is_correct: true },
        { submission_id: "sub1", is_correct: false },
        { submission_id: "sub2", is_correct: true },
      ],
      [{ id: "s1", full_name: "Ana" }, { id: "s2", full_name: "Bia" }],
      NOW,
    );

    const [classA, classB] = result;
    expect(classA.students).toEqual([
      { studentId: "s1", name: "Ana", overdueCount: 0, accuracyPct: 50, atRisk: false },
    ]);
    expect(classB.students).toEqual([
      { studentId: "s2", name: "Bia", overdueCount: 0, accuracyPct: 100, atRisk: false },
    ]);
  });

  it("treats a PENDING submission as not-submitted for overdue purposes", () => {
    const result = deriveClassStats(
      [{ id: "c1", name: "Turma A" }],
      [{ class_id: "c1", student_id: "s1" }],
      [{ id: "a1", class_id: "c1", due_at: PAST }],
      [{ id: "sub1", assignment_id: "a1", student_id: "s1", status: "PENDING" }],
      [],
      [{ id: "s1", full_name: "Ana" }],
      NOW,
    );
    expect(result[0].students[0].overdueCount).toBe(1);
  });

  it("falls back to 'Aluno' when the profile has no full_name or is missing", () => {
    const result = deriveClassStats(
      [{ id: "c1", name: "Turma A" }],
      [{ class_id: "c1", student_id: "s1" }],
      [],
      [],
      [],
      [],
      NOW,
    );
    expect(result[0].students[0].name).toBe("Aluno");
  });

  it("marks at risk when accuracy is below 50%, not at exactly 50%", () => {
    const result = deriveClassStats(
      [{ id: "c1", name: "Turma A" }],
      [{ class_id: "c1", student_id: "s1" }],
      [{ id: "a1", class_id: "c1", due_at: PAST }],
      [{ id: "sub1", assignment_id: "a1", student_id: "s1", status: "GRADED" }],
      [
        { submission_id: "sub1", is_correct: true },
        { submission_id: "sub1", is_correct: false },
      ],
      [{ id: "s1", full_name: "Ana" }],
      NOW,
    );
    expect(result[0].students[0].accuracyPct).toBe(50);
    expect(result[0].students[0].atRisk).toBe(false);
  });
});
