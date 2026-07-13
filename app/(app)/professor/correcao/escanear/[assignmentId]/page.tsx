import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ScanCaptureView } from "./ScanCaptureView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Escanear Gabarito" };

export default async function EscanearAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, class_id, content_type, content_id")
    .eq("id", assignmentId)
    .single();
  if (!assignment || assignment.content_type !== "EXAM") notFound();

  const [{ data: klass }, { data: exam }] = await Promise.all([
    supabase.from("classes").select("name").eq("id", assignment.class_id).single(),
    supabase.from("exams").select("title").eq("id", assignment.content_id).single(),
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/professor/correcao/escanear" className="sidebar-link back-link">
            ← Escanear Gabarito
          </Link>
          <h1 className="page-title">{exam?.title ?? "Prova"}</h1>
          <p className="page-subtitle">Turma: {klass?.name ?? ""}</p>
        </div>
      </div>

      <ScanCaptureView assignmentId={assignmentId} />
    </>
  );
}
