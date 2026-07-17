import { expect, test } from "@playwright/test";
import { randomUUID } from "crypto";
import {
  cleanupSeedUsers,
  createAdminUser,
  createServiceClient,
  loginThroughUi,
  type SeedUser,
} from "../support/e2e";

test.describe.configure({ mode: "serial" });

let adminUser!: SeedUser;

test.beforeAll(async () => {
  adminUser = await createAdminUser("Admin Billing E2E");
});

test.afterAll(async () => {
  await cleanupSeedUsers([adminUser]);
});

test("admin updates a billing plan from the dashboard", async ({ page }) => {
  const client = createServiceClient();
  const { data: plan, error: planError } = await client
    .from("plans")
    .select("id, code, ai_quota_monthly, price_cents, stripe_price_id")
    .eq("code", "PROFESSOR")
    .single();
  expect(planError).toBeNull();
  if (!plan) {
    throw new Error("Billing plan was not found.");
  }

  const nextValues = {
    ai_quota_monthly: plan.ai_quota_monthly + 1234,
    price_cents: plan.price_cents + 111,
    stripe_price_id: `price_e2e_${randomUUID().slice(0, 8)}`,
  };

  try {
    await loginThroughUi(page, adminUser.email, adminUser.password, "/admin/planos");

    await page.getByTestId(`plan-quota-${plan.id}`).fill(String(nextValues.ai_quota_monthly));
    await page.getByTestId(`plan-price-${plan.id}`).fill(String(nextValues.price_cents));
    await page.getByTestId(`plan-price-id-${plan.id}`).fill(nextValues.stripe_price_id);

    const save = page.getByTestId(`plan-save-${plan.id}`);
    await save.click();
    await expect(page.getByTestId(`plan-notice-${plan.id}`)).toBeVisible();

    const { data: updatedPlan, error: updatedError } = await client
      .from("plans")
      .select("ai_quota_monthly, price_cents, stripe_price_id")
      .eq("id", plan.id)
      .single();
    expect(updatedError).toBeNull();
    expect(updatedPlan?.ai_quota_monthly).toBe(nextValues.ai_quota_monthly);
    expect(updatedPlan?.price_cents).toBe(nextValues.price_cents);
    expect(updatedPlan?.stripe_price_id).toBe(nextValues.stripe_price_id);
  } finally {
    await client
      .from("plans")
      .update({
        ai_quota_monthly: plan.ai_quota_monthly,
        price_cents: plan.price_cents,
        stripe_price_id: plan.stripe_price_id,
      })
      .eq("id", plan.id);
  }
});
