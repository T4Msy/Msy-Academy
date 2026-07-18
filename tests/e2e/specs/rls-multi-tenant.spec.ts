import { expect, test } from "@playwright/test";
import {
  cleanupSeedUsers,
  createAuthenticatedClient,
  createProfessorUser,
  createStudentUser,
  seedActivityTaskFixture,
  type SeedUser,
} from "../support/e2e";

test.describe.configure({ mode: "serial" });

let owner!: SeedUser;
let student!: SeedUser;
let outsider!: SeedUser;
let assignmentId!: string;

test.beforeAll(async () => {
  owner = await createProfessorUser("Professor RLS Owner");
  student = await createStudentUser("Aluno RLS");
  outsider = await createProfessorUser("Professor RLS Outsider");
  assignmentId = (await seedActivityTaskFixture(owner, student)).assignmentId;
});

test.afterAll(async () => {
  await cleanupSeedUsers([owner, student, outsider]);
});

test("does not expose another tenant's assignment or submissions through the Data API", async () => {
  const client = await createAuthenticatedClient(outsider.email, outsider.password);
  const { data: assignments, error: assignmentsError } = await client.from("assignments").select("id").eq("id", assignmentId);
  expect(assignmentsError).toBeNull();
  expect(assignments).toEqual([]);

  const { data: submissions, error: submissionsError } = await client.from("submissions").select("id").eq("assignment_id", assignmentId);
  expect(submissionsError).toBeNull();
  expect(submissions).toEqual([]);
});
