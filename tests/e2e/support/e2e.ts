import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { Page } from "@playwright/test";

loadEnvConfig(process.cwd());

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
export const TEST_PASSWORD = "E2E-Test-123!";
const SUPABASE_URL = new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
const SUPABASE_STORAGE_KEY = `sb-${SUPABASE_URL.hostname.split(".")[0]}-auth-token`;

type UserRole = "PROFESSOR" | "ALUNO" | "ADMIN";

export interface SeedUser {
  id: string;
  email: string;
  password: string;
  tenantId: string;
  fullName: string;
  role: UserRole;
}

export interface ActivityTaskFixture {
  classId: string;
  activityId: string;
  assignmentId: string;
  multipleQuestionId: string;
  multipleOptionId: string;
  discursiveQuestionId: string;
  professor: SeedUser;
  student: SeedUser;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createServiceClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Authenticated Data API client used only to assert real RLS behavior in E2E tests. */
export async function createAuthenticatedClient(email: string, password: string) {
  const client = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Failed to authenticate RLS test client: ${error.message}`);
  return client;
}

async function setRoles(userId: string, roles: UserRole[]): Promise<void> {
  const admin = createServiceClient();
  await admin.from("user_roles").delete().eq("user_id", userId);
  if (roles.length > 0) {
    const { error } = await admin.from("user_roles").insert(
      roles.map((role) => ({ user_id: userId, role })),
    );
    if (error) {
      throw new Error(`Failed to set roles: ${error.message}`);
    }
  }
}

async function createUser(role: UserRole, fullName: string): Promise<SeedUser> {
  const admin = createServiceClient();
  const email = `e2e-${role.toLowerCase()}-${randomUUID().slice(0, 8)}@msy-academy.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message ?? "unknown error"}`);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("tenant_id")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error(`Failed to load profile for test user: ${profileError?.message ?? "unknown error"}`);
  }

  await setRoles(
    data.user.id,
    role === "PROFESSOR" ? ["PROFESSOR"] : role === "ALUNO" ? ["ALUNO"] : ["ADMIN"],
  );
  // E2E users are already provisioned by the test harness; they should not
  // be diverted into the interactive terms-consent screen before exercising
  // the protected application flow under test.
  const { error: consentError } = await admin
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", data.user.id);
  if (consentError) throw new Error(`Failed to accept test-user terms: ${consentError.message}`);

  return {
    id: data.user.id,
    email,
    password: TEST_PASSWORD,
    tenantId: profile.tenant_id,
    fullName,
    role,
  };
}

export async function createProfessorUser(fullName = "Professor E2E"): Promise<SeedUser> {
  return createUser("PROFESSOR", fullName);
}

export async function createStudentUser(fullName = "Aluno E2E"): Promise<SeedUser> {
  return createUser("ALUNO", fullName);
}

export async function createAdminUser(fullName = "Admin E2E"): Promise<SeedUser> {
  return createUser("ADMIN", fullName);
}

async function deleteSeedUser(user: SeedUser): Promise<void> {
  const admin = createServiceClient();
  await admin.from("tenants").delete().eq("id", user.tenantId);
  await admin.auth.admin.deleteUser(user.id);
}

export async function cleanupSeedUsers(users: SeedUser[]): Promise<void> {
  for (const user of users) {
    await deleteSeedUser(user);
  }
}

export async function seedActivityTaskFixture(professor: SeedUser, student: SeedUser): Promise<ActivityTaskFixture> {
  const admin = createServiceClient();
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  const inviteCode = `E2E${suffix.slice(0, 6)}`;

  const { data: classRow, error: classError } = await admin
    .from("classes")
    .insert({
      tenant_id: professor.tenantId,
      owner_id: professor.id,
      name: `Turma E2E ${suffix}`,
      invite_code: inviteCode,
    })
    .select("id")
    .single();
  if (classError || !classRow) {
    throw new Error(`Failed to create class fixture: ${classError?.message ?? "unknown error"}`);
  }

  const { data: activityRow, error: activityError } = await admin
    .from("activities")
    .insert({
      tenant_id: professor.tenantId,
      author_id: professor.id,
      title: `Atividade E2E ${suffix}`,
      generation_params: {},
      status: "READY",
      ai_provider: "mock",
    })
    .select("id")
    .single();
  if (activityError || !activityRow) {
    throw new Error(`Failed to create activity fixture: ${activityError?.message ?? "unknown error"}`);
  }

  const multipleQuestion = {
    tenant_id: professor.tenantId,
    author_id: professor.id,
    type: "MULTIPLA",
    difficulty: "MEDIO",
    statement: `Qual alternativa identifica o valor esperado para o fluxo ${suffix}?`,
    options: [
      { id: "A", text: "Resposta errada" },
      { id: "B", text: "Resposta correta" },
      { id: "C", text: "Outra resposta" },
      { id: "D", text: "Resposta distratora" },
    ],
    correct_answer: "B",
    explanation: "Questão de teste com alternativa correta B.",
    tags: ["e2e"],
    ai_provider: "mock",
  } as const;

  const discursiveQuestion = {
    tenant_id: professor.tenantId,
    author_id: professor.id,
    type: "DISCURSIVA",
    difficulty: "MEDIO",
    statement: `Explique, em uma frase, por que o fluxo ${suffix} passou.`,
    options: null,
    correct_answer: "Porque o fluxo de teste foi concluído.",
    explanation: "Resposta de referência para o professor.",
    tags: ["e2e"],
    ai_provider: "mock",
  } as const;

  const { data: insertedQuestions, error: questionError } = await admin
    .from("questions")
    .insert([multipleQuestion, discursiveQuestion])
    .select("id");
  if (questionError || !insertedQuestions || insertedQuestions.length !== 2) {
    throw new Error(`Failed to create question fixture: ${questionError?.message ?? "unknown error"}`);
  }

  const [multipleQuestionRow, discursiveQuestionRow] = insertedQuestions;
  const multipleQuestionId = multipleQuestionRow.id;
  const discursiveQuestionId = discursiveQuestionRow.id;

  const { error: linkError } = await admin.from("activity_items").insert([
    { activity_id: activityRow.id, question_id: multipleQuestionId, position: 1, points: 1 },
    { activity_id: activityRow.id, question_id: discursiveQuestionId, position: 2, points: 1 },
  ]);
  if (linkError) {
    throw new Error(`Failed to link questions to activity: ${linkError.message}`);
  }

  const { data: assignmentRow, error: assignmentError } = await admin
    .from("assignments")
    .insert({
      tenant_id: professor.tenantId,
      class_id: classRow.id,
      content_type: "ACTIVITY",
      content_id: activityRow.id,
      due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (assignmentError || !assignmentRow) {
    throw new Error(`Failed to create assignment fixture: ${assignmentError?.message ?? "unknown error"}`);
  }

  const { error: enrollmentError } = await admin.from("enrollments").insert({
    class_id: classRow.id,
    student_id: student.id,
    status: "ACTIVE",
  });
  if (enrollmentError) {
    throw new Error(`Failed to enroll student: ${enrollmentError.message}`);
  }

  return {
    classId: classRow.id,
    activityId: activityRow.id,
    assignmentId: assignmentRow.id,
    multipleQuestionId,
    multipleOptionId: "B",
    discursiveQuestionId,
    professor,
    student,
  };
}

export async function loginThroughUi(page: Page, email: string, password: string, redirectTo: string): Promise<void> {
  await setSupabaseSessionCookie(page, email, password);
  await page.goto("about:blank");
  await page.goto(redirectTo, { waitUntil: "domcontentloaded" });
  await page.waitForURL(new RegExp(`${escapeRegExp(redirectTo)}$`), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function setSupabaseSessionCookie(page: Page, email: string, password: string): Promise<void> {
  const admin = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );

  const { data, error } = await admin.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Failed to establish Supabase session for E2E login: ${error?.message ?? "unknown error"}`);
  }

  const encodedSession = `base64-${Buffer.from(JSON.stringify(data.session), "utf8").toString("base64url")}`;
  const expires = data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;
  const cookieOrigins = new Set([
    new URL(BASE_URL).origin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  await page.context().addCookies(
    Array.from(cookieOrigins).map((url) => ({
      name: SUPABASE_STORAGE_KEY,
      value: encodedSession,
      url,
      expires,
    })),
  );
}
