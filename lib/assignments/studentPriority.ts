import { isAssessmentExpired } from "@/lib/assessments/deadline";

export type StudentAssignmentState = "in-progress" | "upcoming" | "completed" | "expired";
export type StudentAssignmentFilter = "all" | "pending" | "upcoming" | "completed" | "expired";

export function getStudentAssignmentState(dueAt: string | null, submissionStatus: string | null | undefined, now = Date.now()): StudentAssignmentState {
  if (submissionStatus === "SUBMITTED" || submissionStatus === "GRADED") return "completed";
  if (isAssessmentExpired(dueAt, now)) return "expired";
  if (dueAt) {
    const deadline = new Date(dueAt).getTime();
    if (Number.isFinite(deadline) && deadline - now <= 3 * 24 * 60 * 60 * 1000) return "upcoming";
  }
  return "in-progress";
}

export function matchesStudentAssignmentFilter(state: StudentAssignmentState, filter: StudentAssignmentFilter) {
  if (filter === "all") return true;
  if (filter === "pending") return state === "in-progress" || state === "upcoming";
  return state === filter;
}

export function sortStudentAssignments<T extends { dueAt: string | null; state: StudentAssignmentState }>(items: T[]) {
  const priority: Record<StudentAssignmentState, number> = { upcoming: 0, "in-progress": 1, completed: 2, expired: 3 };
  return [...items].sort((a, b) => {
    const stateOrder = priority[a.state] - priority[b.state];
    if (stateOrder !== 0) return stateOrder;
    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    return aDue - bDue;
  });
}

export function studentAssignmentStatusLabel(state: StudentAssignmentState, dueAt: string | null, now = Date.now()) {
  if (state === "completed") return "Concluída";
  if (state === "expired") return "Prazo encerrado";
  if (state === "in-progress") return "Em andamento";
  const remainingDays = Math.max(0, Math.ceil((new Date(dueAt!).getTime() - now) / (24 * 60 * 60 * 1000)));
  if (remainingDays === 0) return "Vence hoje";
  if (remainingDays === 1) return "Vence amanhã";
  return `Vence em ${remainingDays} dias`;
}
