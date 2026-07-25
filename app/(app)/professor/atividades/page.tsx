import type { Metadata } from "next";
import Link from "next/link";
import { ActivityLibrary } from "./ActivityLibrary";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minhas Atividades" };

export default function AtividadesPage() {
  return <><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Minhas atividades</h1><p className="mt-1 text-[13.5px] text-muted-foreground">Crie, edite e reutilize suas atividades.</p></div><Link href="/professor/atividades/nova" className="rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Nova atividade</Link></div><ActivityLibrary /></>;
}
