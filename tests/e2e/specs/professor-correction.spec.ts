import { expect, test } from "@playwright/test";
import {
  cleanupSeedUsers,
  createProfessorUser,
  createServiceClient,
  createStudentUser,
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
  professor = await createProfessorUser("Professor Correção E2E");
  student = await createStudentUser("Aluno Correção E2E");
  fixture = await seedActivityTaskFixture(professor, student);
});

test.afterAll(async () => {
  await cleanupSeedUsers([professor, student]);
});

test("professor reviews a discursive answer and finalizes the grade", async ({ page }) => {
  await loginThroughUi(page, student.email, student.password, `/aluno/tarefas/${fixture.assignmentId}`);
  await page.getByTestId(`answer-${fixture.multipleQuestionId}-${fixture.multipleOptionId}`).click();
  await page.getByTestId(`answer-${fixture.discursiveQuestionId}`).fill("Porque o fluxo de teste foi concluído.");
  await page.getByTestId("resolve-submit").click();

  const admin = createServiceClient();
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("submissions")
        .select("id")
        .eq("assignment_id", fixture.assignmentId)
        .eq("student_id", student.id)
        .maybeSingle();
      return data?.id ?? null;
    }, { timeout: 30000 })
    .not.toBeNull();

  const { data: submission, error: submissionError } = await admin
    .from("submissions")
    .select("id")
    .eq("assignment_id", fixture.assignmentId)
    .eq("student_id", student.id)
    .single();
  expect(submissionError).toBeNull();
  if (!submission) {
    throw new Error("Submission was not created.");
  }
  await page.reload();
  await expect(page.getByTestId("submission-submitted")).toBeVisible();

  await page.context().clearCookies();
  await loginThroughUi(page, professor.email, professor.password, `/professor/correcao/${submission.id}`);

  const suggest = page.getByTestId(`grade-suggest-${fixture.discursiveQuestionId}`);
  await suggest.click();
  await expect(suggest).toBeDisabled();
  await expect(page.getByTestId(`grade-score-${fixture.discursiveQuestionId}`)).not.toHaveValue("");
  await expect(page.getByTestId(`grade-feedback-${fixture.discursiveQuestionId}`)).not.toHaveValue("");

  await page.getByTestId(`grade-approve-${fixture.discursiveQuestionId}`).click();
  await page.getByTestId("correcao-finalize").click();

  await expect
    .poll(async () => {
      const { data } = await admin
        .from("submissions")
        .select("status")
        .eq("id", submission.id)
        .maybeSingle();
      return data?.status ?? null;
    }, { timeout: 30000 })
    .toBe("GRADED");

  const { data: gradedSubmission, error: gradedError } = await admin
    .from("submissions")
    .select("status")
    .eq("id", submission.id)
    .single();
  expect(gradedError).toBeNull();
  expect(gradedSubmission?.status).toBe("GRADED");

  const { data: grade, error: gradeError } = await admin
    .from("grades")
    .select("total_score, graded_by")
    .eq("submission_id", submission.id)
    .single();
  expect(gradeError).toBeNull();
  expect(grade?.graded_by).toBe("AI_SUGGESTED");
});
