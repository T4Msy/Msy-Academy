import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/search?q=... — RF-G07 (busca global). Queries materials
 * (full-text via search_vector, migration 0007) and classes (name ilike)
 * through the caller's own RLS-scoped client — a professor sees their
 * tenant's materials/classes, an aluno sees only class-attached materials
 * and classes they're enrolled in (0007/0013). No extra scoping needed
 * here; RLS already does it.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ materials: [], classes: [] });

  const [materialsRes, classesRes] = await Promise.all([
    supabase.from("materials").select("id, kind, ref_id, title").textSearch("search_vector", q, { type: "plain", config: "portuguese" }).limit(5),
    supabase.from("classes").select("id, name").ilike("name", `%${q}%`).limit(5),
  ]);

  return NextResponse.json({
    materials: materialsRes.data ?? [],
    classes: classesRes.data ?? [],
  });
}
