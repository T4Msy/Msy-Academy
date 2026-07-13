"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * Confirms a reviewed scan: `overrides` carries any answer the teacher
 * corrected by hand in the review screen ({ "<question_id>": "A" | null }),
 * merged over the auto-detected answers by confirm_answer_sheet_scan() (0022)
 * — jsonb `||` overwrites a key but can't remove one, so "sem resposta"
 * (null here) is sent through as an empty string rather than omitted, to
 * make sure it actually clears a wrongly-detected letter instead of the
 * original detection winning the merge.
 */
export async function confirmScan(scanId: string, overrides: Record<string, string | null>): Promise<void> {
  const { supabase } = await requireUser();

  const normalizedOverrides = Object.fromEntries(
    Object.entries(overrides).map(([questionId, letter]) => [questionId, letter ?? ""]),
  );

  const { error } = await supabase.rpc("confirm_answer_sheet_scan", {
    p_scan_id: scanId,
    p_overrides: normalizedOverrides,
  });
  if (error) throw new Error(`Não foi possível confirmar a digitalização: ${error.message}`);

  revalidatePath("/professor/correcao");
  revalidatePath(`/professor/correcao/gabarito/${scanId}`);
}
