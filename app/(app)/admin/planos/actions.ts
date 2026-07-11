"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles ?? []).some((r) => r.role === "ADMIN")) redirect("/");
}

/** RF-AD07 — edits a plan's quota/price/Stripe price id. Never touches `code` (identity). */
export async function updatePlan(
  planId: string,
  fields: { ai_quota_monthly: number; price_cents: number; stripe_price_id: string },
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("plans")
    .update({
      ai_quota_monthly: fields.ai_quota_monthly,
      price_cents: fields.price_cents,
      stripe_price_id: fields.stripe_price_id.trim() || null,
    })
    .eq("id", planId);
  if (error) throw new Error(`Não foi possível salvar o plano: ${error.message}`);

  revalidatePath("/admin/planos");
}
