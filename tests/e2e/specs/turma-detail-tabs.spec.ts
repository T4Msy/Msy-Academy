import { expect, test } from "@playwright/test";
import {
  cleanupSeedUsers,
  createProfessorUser,
  createStudentUser,
  loginThroughUi,
  seedActivityTaskFixture,
  type ActivityTaskFixture,
  type SeedUser,
} from "../support/e2e";

test.describe.configure({ mode: "serial" });

const viewports = [
  { name: "mobile-320", width: 320, height: 568 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 900 },
] as const;

let professor!: SeedUser;
let student!: SeedUser;
let fixture!: ActivityTaskFixture;

test.beforeAll(async () => {
  professor = await createProfessorUser("Professor Turma Detalhe");
  student = await createStudentUser("Aluno Turma Detalhe");
  fixture = await seedActivityTaskFixture(professor, student);
});

test.afterAll(async () => {
  await cleanupSeedUsers([professor, student]);
});

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
}

test("professor tabs (geral/alunos/atividades/notas/materiais/chat/configuracoes) stay usable across viewports", async ({ page }) => {
  await loginThroughUi(page, professor.email, professor.password, "/professor/turmas");
  const base = `/professor/turmas/${fixture.classId}`;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of [base, `${base}/alunos`, `${base}/atividades`, `${base}/notas`, `${base}/materiais`, `${base}/chat`, `${base}/configuracoes`]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("student tabs (geral/colegas/atividades/notas/materiais/chat) stay usable across viewports", async ({ page }) => {
  await loginThroughUi(page, student.email, student.password, "/aluno/turmas");
  const base = `/aluno/turmas/${fixture.classId}`;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of [base, `${base}/alunos`, `${base}/atividades`, `${base}/notas`, `${base}/materiais`, `${base}/chat`]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("student cannot reach the professor's Configurações route for the same class", async ({ page }) => {
  await loginThroughUi(page, student.email, student.password, "/aluno/turmas");
  const response = await page.goto(`/professor/turmas/${fixture.classId}/configuracoes`, { waitUntil: "domcontentloaded" });
  // A student has no PROFESSOR role, so professor/layout.tsx redirects away
  // (homeForRoles) before the [id]/layout.tsx ownership check even runs.
  expect(page.url()).not.toContain("/professor/turmas");
  expect(response?.status()).toBeLessThan(500);
});
