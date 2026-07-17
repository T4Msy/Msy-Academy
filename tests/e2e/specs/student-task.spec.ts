import { expect, test } from "@playwright/test";
import {
  cleanupSeedUsers,
  createProfessorUser,
  createStudentUser,
  createServiceClient,
  loginThroughUi,
  seedActivityTaskFixture,
  type ActivityTaskFixture,
  type SeedUser,
} from "../support/e2e";

test.describe.configure({ mode: "serial" });

let professor!: SeedUser;
let student!: SeedUser;
let fixture!: ActivityTaskFixture;

test.beforeAll(async () => {
  professor = await createProfessorUser("Professor Tarefa E2E");
  student = await createStudentUser("Aluno Tarefa E2E");
  fixture = await seedActivityTaskFixture(professor, student);
});

test.afterAll(async () => {
  await cleanupSeedUsers([professor, student]);
});

test("student submits a task and the submission is stored", async ({ page }) => {
  await loginThroughUi(page, student.email, student.password, `/aluno/tarefas/${fixture.assignmentId}`);

  await page.getByTestId(`answer-${fixture.multipleQuestionId}-${fixture.multipleOptionId}`).click();
  await page.getByTestId(`answer-${fixture.discursiveQuestionId}`).fill("Porque o fluxo de teste foi concluído.");

  const submit = page.getByTestId("resolve-submit");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(submit).toBeDisabled();

  const admin = createServiceClient();
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("submissions")
        .select("id, status")
        .eq("assignment_id", fixture.assignmentId)
        .eq("student_id", student.id)
        .maybeSingle();
      return data?.id ?? null;
    }, { timeout: 30000 })
    .not.toBeNull();

  const { data: submission, error: submissionError } = await admin
    .from("submissions")
    .select("id, status")
    .eq("assignment_id", fixture.assignmentId)
    .eq("student_id", student.id)
    .single();
  expect(submissionError).toBeNull();
  expect(submission).not.toBeNull();
  expect(submission?.status).toBe("SUBMITTED");
  await page.reload();
  await expect(page.getByTestId("submission-submitted")).toBeVisible();

  const { data: answers, error: answersError } = await admin
    .from("submission_answers")
    .select("question_id")
    .eq("submission_id", submission!.id);
  expect(answersError).toBeNull();
  expect((answers ?? []).length).toBe(2);
});
