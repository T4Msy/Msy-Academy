import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { cleanupSeedUsers, createProfessorUser, loginThroughUi, type SeedUser } from "../support/e2e";

test.describe.configure({ mode: "serial" });

let professor!: SeedUser;

test.beforeAll(async () => {
  professor = await createProfessorUser("Professor Login E2E");
});

test.afterAll(async () => {
  await cleanupSeedUsers([professor]);
});

test("login shows an error and then lands on the professor shell", async ({ page }) => {
  await page.goto("/login?redirect=/professor", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("login-form")).toBeVisible();

  const auth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { error } = await auth.auth.signInWithPassword({ email: professor.email, password: "wrong-password" });

  expect(error).toBeTruthy();
  expect(error?.message ?? "").toMatch(/invalid/i);

  await loginThroughUi(page, professor.email, professor.password, "/professor");
  await expect(page).toHaveURL(/\/professor$/);
  await expect(page.getByText("Olá,")).toBeVisible();
});
