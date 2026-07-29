import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calculateStudyStreak, type StudyStreak } from "./studyStreakModel";
import { getStudentAssignmentState } from "@/lib/assignments/studentPriority";

export interface StudentDashboardStats {
  completedAssignments: number;
  accuracyPct: number | null;
  completedStudyItems: number;
  totalStudyItems: number;
  flashcardDecks: number;
  studyStreak: StudyStreak;
  routine: StudentRoutine;
}

export interface StudentRoutine {
  assignmentProgress: { completed: number; total: number };
  recentGrades: Array<{
    id: string;
    title: string;
    subject: string | null;
    score: number;
    gradedAt: string;
  }>;
  continueItem: { title: string; href: string; detail: string } | null;
  classes: Array<{
    id: string;
    name: string;
    subject: string | null;
    teacherName: string | null;
    nextExam: string | null;
    nextActivity: string | null;
    pendingAssignments: number;
    materialsCount: number;
  }>;
  studyTime: {
    todaySeconds: number;
    weekSeconds: number;
    monthSeconds: number;
    hasRecords: boolean;
  };
  announcements: Array<{
    id: string;
    message: string;
    publishedAt: string;
    className: string;
    teacherName: string | null;
  }>;
}

type AssignmentRow = {
  id: string;
  class_id: string;
  content_id: string;
  content_type: "EXAM" | "ACTIVITY";
  due_at: string | null;
  created_at: string;
};
type SubmissionRow = {
  id: string;
  assignment_id: string | null;
  simulado_id: string | null;
  status: string;
  submitted_at: string | null;
  updated_at: string;
  created_at: string;
};

function isInRange(value: string, start: Date) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= start.getTime();
}

/** Reads every student-dashboard metric through the authenticated Supabase client.
 * RLS is therefore the source of truth for the student's own records. */
export async function getStudentDashboardStats(): Promise<StudentDashboardStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const [
    { data: submissions },
    { data: studyPlans },
    { data: decks },
    { data: assignments },
    { data: enrollments },
  ] = await Promise.all([
    supabase
      .from("submissions")
      .select("id, assignment_id, simulado_id, status, submitted_at, updated_at, created_at")
      .eq("student_id", user.id),
    supabase.from("study_plans").select("id").eq("student_id", user.id),
    supabase.from("flashcard_decks").select("id").eq("student_id", user.id),
    supabase
      .from("assignments")
      .select("id, class_id, content_id, content_type, due_at, created_at")
      .is("deleted_at", null),
    supabase
      .from("enrollments")
      .select("class_id")
      .eq("student_id", user.id)
      .eq("status", "ACTIVE"),
  ]);

  const submissionList = (submissions ?? []) as SubmissionRow[];
  const assignmentList = (assignments ?? []) as AssignmentRow[];
  const completedSubmissions = submissionList.filter(
    (submission) => submission.status !== "PENDING",
  );
  const submissionIds = completedSubmissions.map((submission) => submission.id);
  const planIds = (studyPlans ?? []).map((plan) => plan.id);
  const assignmentIds = assignmentList.map((assignment) => assignment.id);
  const classIds = [
    ...new Set([
      ...assignmentList.map((assignment) => assignment.class_id),
      ...(enrollments ?? []).map((enrollment) => enrollment.class_id),
    ]),
  ];
  const examIds = assignmentList
    .filter((assignment) => assignment.content_type === "EXAM")
    .map((assignment) => assignment.content_id);
  const activityIds = assignmentList
    .filter((assignment) => assignment.content_type === "ACTIVITY")
    .map((assignment) => assignment.content_id);
  const [
    { data: answers },
    { data: studyItems },
    { data: grades },
    { data: exams },
    { data: activities },
    { data: classRows },
    { data: subjects },
    { data: materials },
    { data: sessions },
    { data: announcements },
  ] = await Promise.all([
    submissionIds.length
      ? supabase.from("submission_answers").select("is_correct").in("submission_id", submissionIds)
      : Promise.resolve({ data: [] as { is_correct: boolean | null }[] }),
    planIds.length
      ? supabase.from("study_plan_items").select("status, item_date").in("study_plan_id", planIds)
      : Promise.resolve({ data: [] as { status: string; item_date: string }[] }),
    submissionIds.length
      ? supabase
          .from("grades")
          .select("submission_id, total_score, created_at")
          .in("submission_id", submissionIds)
      : Promise.resolve({
          data: [] as { submission_id: string; total_score: number; created_at: string }[],
        }),
    examIds.length
      ? supabase.from("exams").select("id, title").in("id", examIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    activityIds.length
      ? supabase.from("activities").select("id, title").in("id", activityIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    classIds.length
      ? supabase.from("classes").select("id, name, subject_id").in("id", classIds)
      : Promise.resolve({ data: [] as { id: string; name: string; subject_id: string | null }[] }),
    supabase.from("subjects").select("id, name"),
    classIds.length
      ? supabase
          .from("materials")
          .select("id, class_id")
          .in("class_id", classIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as { id: string; class_id: string | null }[] }),
    supabase
      .from("study_sessions")
      .select("started_at, duration_seconds")
      .eq("student_id", user.id)
      .not("ended_at", "is", null),
    supabase
      .from("class_announcements")
      .select("id, class_id, message, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const teacherNames: { data: { class_id: string; teacher_name: string | null }[] | null } =
    classIds.length
      ? await supabase.rpc("student_class_teacher_names", { p_class_ids: classIds })
      : { data: [] as { class_id: string; teacher_name: string | null }[] };
  const classList = (classRows ?? []) as { id: string; name: string; subject_id: string | null }[];
  const subjectNameById = new Map((subjects ?? []).map((subject) => [subject.id, subject.name]));
  const teacherNameByClassId = new Map(
    (teacherNames.data ?? []).map((teacher) => [teacher.class_id, teacher.teacher_name]),
  );
  const titleByContentId = new Map<string, string>([
    ...(exams ?? []).map((exam) => [exam.id, exam.title] as const),
    ...(activities ?? []).map((activity) => [activity.id, activity.title] as const),
  ]);
  const assignmentById = new Map(assignmentList.map((assignment) => [assignment.id, assignment]));
  const submissionByAssignmentId = new Map(
    submissionList
      .filter((submission) => submission.assignment_id)
      .map((submission) => [submission.assignment_id!, submission]),
  );
  const now = Date.now();
  const activeAssignments = assignmentList.filter(
    (assignment) =>
      getStudentAssignmentState(
        assignment.due_at,
        submissionByAssignmentId.get(assignment.id)?.status,
        now,
      ) !== "completed" &&
      getStudentAssignmentState(
        assignment.due_at,
        submissionByAssignmentId.get(assignment.id)?.status,
        now,
      ) !== "expired",
  );
  const classNameById = new Map(classList.map((classroom) => [classroom.id, classroom.name]));
  const gradesBySubmissionId = new Map((grades ?? []).map((grade) => [grade.submission_id, grade]));
  const recentGrades = [...gradesBySubmissionId.entries()]
    .map(([submissionId, grade]) => {
      const submission = submissionList.find((item) => item.id === submissionId);
      const assignment = submission?.assignment_id
        ? assignmentById.get(submission.assignment_id)
        : undefined;
      return assignment
        ? {
            id: submissionId,
            title:
              titleByContentId.get(assignment.content_id) ??
              (assignment.content_type === "EXAM" ? "Prova" : "Atividade"),
            subject:
              subjectNameById.get(
                classList.find((item) => item.id === assignment.class_id)?.subject_id ?? "",
              ) ?? null,
            score: grade.total_score,
            gradedAt: grade.created_at,
          }
        : null;
    })
    .filter((grade): grade is NonNullable<typeof grade> => Boolean(grade))
    .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())
    .slice(0, 4);
  const pendingSubmission = submissionList
    .filter((submission) => submission.assignment_id && submission.status === "PENDING")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
  const pendingAssignment = pendingSubmission?.assignment_id
    ? assignmentById.get(pendingSubmission.assignment_id)
    : undefined;
  const continueItem = pendingAssignment
    ? {
        title:
          titleByContentId.get(pendingAssignment.content_id) ??
          (pendingAssignment.content_type === "EXAM" ? "Prova" : "Atividade"),
        href: `/aluno/tarefas/${pendingAssignment.id}`,
        detail: classNameById.get(pendingAssignment.class_id) ?? "Turma",
      }
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const sessionList = sessions ?? [];
  const totalSecondsSince = (start: Date) =>
    sessionList
      .filter((session) => isInRange(session.started_at, start))
      .reduce((total, session) => total + session.duration_seconds, 0);

  const gradedAnswers = (answers ?? []).filter((answer) => answer.is_correct !== null);
  const correctAnswers = gradedAnswers.filter((answer) => answer.is_correct).length;

  return {
    completedAssignments: completedSubmissions.length,
    accuracyPct: gradedAnswers.length
      ? Math.round((correctAnswers / gradedAnswers.length) * 100)
      : null,
    completedStudyItems: (studyItems ?? []).filter((item) => item.status === "DONE").length,
    totalStudyItems: studyItems?.length ?? 0,
    flashcardDecks: decks?.length ?? 0,
    studyStreak: calculateStudyStreak([
      ...submissionList
        .filter((submission) => submission.status !== "PENDING" && submission.submitted_at)
        .map((submission) => submission.submitted_at as string),
      ...(studyItems ?? []).filter((item) => item.status === "DONE").map((item) => item.item_date),
    ]),
    routine: {
      assignmentProgress: {
        completed: completedSubmissions.filter((submission) => submission.assignment_id).length,
        total: assignmentIds.length,
      },
      recentGrades,
      continueItem,
      classes: classList.map((classroom) => {
        const classAssignments = activeAssignments.filter(
          (assignment) => assignment.class_id === classroom.id,
        );
        const next = (kind: AssignmentRow["content_type"]) =>
          classAssignments
            .filter((assignment) => assignment.content_type === kind)
            .sort((a, b) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"))[0];
        return {
          id: classroom.id,
          name: classroom.name,
          subject: classroom.subject_id
            ? (subjectNameById.get(classroom.subject_id) ?? null)
            : null,
          teacherName: teacherNameByClassId.get(classroom.id) ?? null,
          nextExam: next("EXAM")
            ? (titleByContentId.get(next("EXAM")!.content_id) ?? "Prova")
            : null,
          nextActivity: next("ACTIVITY")
            ? (titleByContentId.get(next("ACTIVITY")!.content_id) ?? "Atividade")
            : null,
          pendingAssignments: classAssignments.length,
          materialsCount: (materials ?? []).filter((material) => material.class_id === classroom.id)
            .length,
        };
      }),
      studyTime: {
        todaySeconds: totalSecondsSince(today),
        weekSeconds: totalSecondsSince(week),
        monthSeconds: totalSecondsSince(month),
        hasRecords: sessionList.length > 0,
      },
      announcements: (announcements ?? []).map((announcement) => ({
        id: announcement.id,
        message: announcement.message,
        publishedAt: announcement.created_at,
        className: classNameById.get(announcement.class_id) ?? "Turma",
        teacherName: teacherNameByClassId.get(announcement.class_id) ?? null,
      })),
    },
  };
}
