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
  professor = await createProfessorUser("Professor Responsivo");
  student = await createStudentUser("Aluno Responsivo");
  fixture = await seedActivityTaskFixture(professor, student);

  const { error } = await createServiceClient().from("materials").insert({
    tenant_id: professor.tenantId,
    owner_id: professor.id,
    kind: "FILE",
    title: "Material de apoio com um titulo propositalmente longo para validar a quebra responsiva",
  });
  if (error) throw new Error(`Failed to seed Biblioteca material: ${error.message}`);
});

test.afterAll(async () => {
  await cleanupSeedUsers([professor, student]);
});

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
}

async function expectTabLabelsToFit(page: import("@playwright/test").Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".tabbar-item")).every((item) => {
          const label = item.lastElementChild?.getBoundingClientRect();
          const tab = item.getBoundingClientRect();
          return label && label.left >= tab.left && label.right <= tab.right;
        }),
      ),
    )
    .toBe(true);
}

test("keeps Turmas, Biblioteca and the student tab bar usable across viewport sizes", async ({ page }, testInfo) => {
  await loginThroughUi(page, professor.email, professor.password, "/professor/turmas");

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of ["/professor/turmas", `/professor/turmas/${fixture.classId}`, "/professor/biblioteca"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      await expectNoHorizontalOverflow(page);
      if (viewport.width <= 390) await expectTabLabelsToFit(page);
      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-${path.split("/").filter(Boolean).join("-")}.png`), fullPage: true });
    }
  }

  await page.context().clearCookies();
  await loginThroughUi(page, student.email, student.password, "/aluno/turmas");
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of ["/aluno/turmas", "/aluno/dashboard"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      await expectNoHorizontalOverflow(page);
      if (viewport.width <= 390) await expectTabLabelsToFit(page);
      if (path === "/aluno/dashboard" && viewport.width <= 390) {
        await expect(page.locator(".tabbar-item.active")).toContainText("Progresso");
      }
      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-${path.split("/").filter(Boolean).join("-")}.png`), fullPage: true });
    }
  }
});
