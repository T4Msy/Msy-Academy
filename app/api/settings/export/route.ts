import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * LGPD self-service data export (RF-AD/US-16.3) — every table filtered to
 * rows this user authored/owns/is the student on, queried through the
 * RLS-bound client. Deliberately filters by author_id/owner_id/student_id
 * explicitly rather than relying on RLS visibility alone: some tables (e.g.
 * classes) are also readable by *enrolled* students, which would leak other
 * people's rows into this user's own export if visibility were the only gate.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const uid = user.id;

  const [
    profile,
    roles,
    exams,
    activities,
    lessonPlans,
    classes,
    materials,
    submissions,
    studyPlans,
    flashcardDecks,
    tutorConversations,
    notifications,
    aiUsage,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", uid),
    supabase.from("exams").select("*").eq("author_id", uid),
    supabase.from("activities").select("*").eq("author_id", uid),
    supabase.from("lesson_plans").select("*").eq("author_id", uid),
    supabase.from("classes").select("*").eq("owner_id", uid),
    supabase.from("materials").select("*").eq("owner_id", uid),
    supabase.from("submissions").select("*, submission_answers(*), grades(*)").eq("student_id", uid),
    supabase.from("study_plans").select("*, study_plan_items(*)").eq("student_id", uid),
    supabase.from("flashcard_decks").select("*, flashcards(*)").eq("student_id", uid),
    supabase.from("tutor_conversations").select("*, tutor_messages(*)").eq("student_id", uid),
    supabase.from("notifications").select("*").eq("user_id", uid),
    supabase.from("ai_usage").select("*").eq("user_id", uid),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: { id: uid, email: user.email },
    profile: profile.data,
    roles: (roles.data ?? []).map((r) => r.role),
    exams: exams.data ?? [],
    activities: activities.data ?? [],
    lesson_plans: lessonPlans.data ?? [],
    classes: classes.data ?? [],
    materials: materials.data ?? [],
    submissions: submissions.data ?? [],
    study_plans: studyPlans.data ?? [],
    flashcard_decks: flashcardDecks.data ?? [],
    tutor_conversations: tutorConversations.data ?? [],
    notifications: notifications.data ?? [],
    ai_usage: aiUsage.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="msy-academy-dados-${uid}.json"`,
    },
  });
}
