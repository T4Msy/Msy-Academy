import { expect, test } from "@playwright/test";
import { randomUUID } from "crypto";
import { cleanupSeedUsers, createProfessorUser, createServiceClient, loginThroughUi, type SeedUser } from "../support/e2e";

test.describe.configure({ mode: "serial" });

let professor!: SeedUser;

test.beforeAll(async () => {
  professor = await createProfessorUser("Professor Provas E2E");
});

test.afterAll(async () => {
  await cleanupSeedUsers([professor]);
});

test("creates a generated exam and persists it in Supabase", async ({ page }) => {
  const examTitle = `Prova E2E ${randomUUID().slice(0, 8)}`;

  await loginThroughUi(page, professor.email, professor.password, "/professor/provas/nova");

  await expect(page.getByTestId("create-mode-ai")).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("create-mode-blank").click();
  await expect(page.getByTestId("create-mode-blank")).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("create-mode-ai").click();

  await page.getByTestId("exam-title").fill(examTitle);
  await page.getByTestId("exam-course").fill("Ensino Médio");
  await page.getByTestId("exam-subject").fill("Biologia");
  await page.getByTestId("exam-topic").fill("Fotossíntese");

  const submit = page.getByTestId("exam-submit");
  await submit.click();
  await expect(submit).toBeDisabled();

  const admin = createServiceClient();
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("exams")
        .select("id")
        .eq("title", examTitle)
        .eq("author_id", professor.id)
        .maybeSingle();
      return data?.id ?? null;
    }, { timeout: 30000 })
    .not.toBeNull();

  const { data: exam, error: examError } = await admin
    .from("exams")
    .select("id, title, course, author_id")
    .eq("title", examTitle)
    .eq("author_id", professor.id)
    .single();
  expect(examError).toBeNull();
  expect(exam).not.toBeNull();

  if (!exam) {
    throw new Error("Generated exam was not persisted.");
  }

  await page.goto(`/professor/provas/${exam.id}`);
  await expect(page).toHaveURL(/\/professor\/provas\/[0-9a-f-]+$/);

  const { data: links, error: linksError } = await admin
    .from("exam_questions")
    .select("question_id")
    .eq("exam_id", exam.id);
  expect(linksError).toBeNull();
  expect((links ?? []).length).toBeGreaterThan(0);
});
