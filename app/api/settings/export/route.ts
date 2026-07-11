import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * LGPD self-service data export (RF-AD/US-16.3) — every table filtered to
 * rows this user authored/owns/is the student on, queried through the
 * admin client with author_id/owner_id/student_id filtered explicitly.
 * Deliberately not the RLS-bound client, for two reasons: (1) some tables
 * (e.g. classes) are also readable by *enrolled* students, which would leak
 * other people's rows into this user's own export if RLS visibility were the
 * only gate; (2) several tables' SELECT policies filter `deleted_at is
 * null`, which would silently drop the user's own soft-deleted content from
 * what's supposed to be a full copy of everything they still legally own.
 * The explicit ownership filter below is what actually keeps this safe, not
 * RLS — the admin client only removes RLS's *false negatives*.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const uid = user.id;
  const admin = createAdminClient();

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
    admin.from("profiles").select("*").eq("id", uid).maybeSingle(),
    admin.from("user_roles").select("role").eq("user_id", uid),
    admin.from("exams").select("*").eq("author_id", uid),
    admin.from("activities").select("*").eq("author_id", uid),
    admin.from("lesson_plans").select("*").eq("author_id", uid),
    admin.from("classes").select("*").eq("owner_id", uid),
    admin.from("materials").select("*").eq("owner_id", uid),
    admin.from("submissions").select("*, submission_answers(*), grades(*)").eq("student_id", uid),
    admin.from("study_plans").select("*, study_plan_items(*)").eq("student_id", uid),
    admin.from("flashcard_decks").select("*, flashcards(*)").eq("student_id", uid),
    admin.from("tutor_conversations").select("*, tutor_messages(*)").eq("student_id", uid),
    admin.from("notifications").select("*").eq("user_id", uid),
    admin.from("ai_usage").select("*").eq("user_id", uid),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: { id: uid, email: user.email },
    profile: profile.data,
    roles: (roles.data ?? []).map((r: { role: string }) => r.role),
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
