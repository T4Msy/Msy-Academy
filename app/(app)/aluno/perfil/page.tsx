import type { Metadata } from "next";
import { PerfilPageContent } from "@/components/settings/PerfilPageContent";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPage() {
  return <PerfilPageContent />;
}
