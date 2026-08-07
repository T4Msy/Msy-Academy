import type { Metadata } from "next";
import { ContentCreationHub } from "@/components/professor/ContentCreationHub";

export const metadata: Metadata = { title: "Criar" };

export default async function CriarPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const initialKind = tipo === "exam" || tipo === "activity" || tipo === "material" ? tipo : undefined;
  return <ContentCreationHub initialKind={initialKind} />;
}
