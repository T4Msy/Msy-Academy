export interface StudentStat {
  studentId: string;
  name: string;
  overdueCount: number;
  accuracyPct: number | null;
  atRisk: boolean;
}

export interface ClassStat {
  klass: { id: string; name: string };
  students: StudentStat[];
}

interface Enrollment {
  class_id: string;
  student_id: string;
}
interface Assignment {
  id: string;
  class_id: string;
  due_at: string | null;
}
interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: string;
}
interface Answer {
  submission_id: string;
  is_correct: boolean | null;
}
interface Profile {
  id: string;
  full_name: string | null;
}

/**
 * Pure grouping/derivation step, split out of the DB fetch so a single
 * batched read (all classes at once) can feed it instead of one 4-hop
 * round trip per class — see the async fetch in page.tsx.
 */
export function deriveClassStats(
  classes: { id: string; name: string }[],
  enrollments: Enrollment[],
  assignments: Assignment[],
  submissions: Submission[],
  answers: Answer[],
  profiles: Profile[],
  now: string,
): ClassStat[] {
  const nameById = new Map(profiles.map((p) => [p.id, p.full_name || "Aluno"]));
  const submissionById = new Map(submissions.map((s) => [s.id, s]));

  const enrollmentsByClass = new Map<string, Enrollment[]>();
  for (const e of enrollments) {
    const list = enrollmentsByClass.get(e.class_id) ?? [];
    list.push(e);
    enrollmentsByClass.set(e.class_id, list);
  }

  const assignmentsByClass = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const list = assignmentsByClass.get(a.class_id) ?? [];
    list.push(a);
    assignmentsByClass.set(a.class_id, list);
  }

  const submissionsByAssignment = new Map<string, Submission[]>();
  for (const s of submissions) {
    const list = submissionsByAssignment.get(s.assignment_id) ?? [];
    list.push(s);
    submissionsByAssignment.set(s.assignment_id, list);
  }

  const answersBySubmission = new Map<string, Answer[]>();
  for (const a of answers) {
    const list = answersBySubmission.get(a.submission_id) ?? [];
    list.push(a);
    answersBySubmission.set(a.submission_id, list);
  }

  return classes.map((klass) => {
    const classEnrollments = enrollmentsByClass.get(klass.id) ?? [];
    const studentIds = classEnrollments.map((e) => e.student_id);
    if (studentIds.length === 0) return { klass, students: [] };

    const classAssignments = assignmentsByClass.get(klass.id) ?? [];
    const overdueAssignmentIds = new Set(classAssignments.filter((a) => a.due_at && a.due_at < now).map((a) => a.id));

    const classSubmissions = classAssignments.flatMap((a) => submissionsByAssignment.get(a.id) ?? []);

    const students: StudentStat[] = studentIds.map((studentId) => {
      const submitted = new Set(
        classSubmissions.filter((s) => s.student_id === studentId && s.status !== "PENDING").map((s) => s.assignment_id),
      );
      const overdueCount = [...overdueAssignmentIds].filter((aid) => !submitted.has(aid)).length;

      const studentSubmissionIds = new Set(
        classSubmissions.filter((s) => s.student_id === studentId && s.status !== "PENDING").map((s) => s.id),
      );
      const studentAnswers = [...studentSubmissionIds]
        .flatMap((sid) => answersBySubmission.get(sid) ?? [])
        .filter((a) => submissionById.get(a.submission_id)?.student_id === studentId && a.is_correct !== null);
      const correctCount = studentAnswers.filter((a) => a.is_correct).length;
      const accuracyPct = studentAnswers.length > 0 ? Math.round((correctCount / studentAnswers.length) * 100) : null;

      return {
        studentId,
        name: nameById.get(studentId) ?? "Aluno",
        overdueCount,
        accuracyPct,
        atRisk: overdueCount > 0 || (accuracyPct !== null && accuracyPct < 50),
      };
    });

    return { klass, students };
  });
}
