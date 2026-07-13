import type { Metadata } from "next";
import { NovaAtividadeTabs } from "./NovaAtividadeTabs";

export const metadata: Metadata = { title: "Nova Atividade" };

export default function NovaAtividadePage() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Nova Atividade</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Gere com IA ou crie do zero uma lista de exercícios.</p>
        </div>
      </div>
      <NovaAtividadeTabs />
    </>
  );
}
