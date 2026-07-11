"use server";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Confirms guardian consent for a minor student (RNF-C02). No auth — the
 * guardian has no account on the platform at all; the token itself (a
 * 24-byte random value, migration 0020) is the authorization, same trust
 * model as a password-reset link. Runs entirely through the admin client
 * since guardian_consents has no RLS policy that would let an anonymous
 * visitor read or write it directly.
 */
export async function confirmGuardianConsent(token: string, guardianName: string): Promise<void> {
  const clean = guardianName.trim();
  if (!clean) throw new Error("Informe o nome do responsável.");

  const admin = createAdminClient();
  const { data: consent } = await admin
    .from("guardian_consents")
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  if (!consent) throw new Error("Link inválido ou expirado.");
  if (consent.status === "CONFIRMED") return;

  const { error } = await admin
    .from("guardian_consents")
    .update({ status: "CONFIRMED", guardian_name: clean, confirmed_at: new Date().toISOString() })
    .eq("id", consent.id);

  if (error) throw new Error(`Não foi possível confirmar: ${error.message}`);
}
