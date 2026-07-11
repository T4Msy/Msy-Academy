"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Update the caller's display name. RLS (`profiles_update_own`) enforces ownership. */
export async function updateProfile(fullName: string): Promise<void> {
  const clean = fullName.trim();
  if (!clean) throw new Error("O nome não pode ficar vazio.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: clean })
    .eq("id", user.id);

  if (error) throw new Error(`Não foi possível salvar: ${error.message}`);

  // Topbar reads full_name from each environment layout's own fetch — refresh it.
  revalidatePath("/", "layout");
}
