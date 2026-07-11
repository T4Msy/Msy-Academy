"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/lib/billing/plans";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles ?? []).some((r) => r.role === "ADMIN")) redirect("/");
}

/**
 * Manual plan override — the way to change a tenant's plan without Stripe
 * (comps, testing quota enforcement before a real checkout exists). Doesn't
 * touch stripe_customer_id/stripe_subscription_id — a subsequent real
 * checkout still works normally afterward.
 */
export async function changeTenantPlan(tenantId: string, planCode: PlanCode): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: plan } = await admin.from("plans").select("id").eq("code", planCode).single();
  if (!plan) throw new Error("Plano não encontrado.");

  const { error } = await admin
    .from("subscriptions")
    .update({ plan_id: plan.id, status: "ACTIVE" })
    .eq("tenant_id", tenantId);
  if (error) throw new Error(`Não foi possível mudar o plano: ${error.message}`);

  revalidatePath("/admin/tenants");
}
