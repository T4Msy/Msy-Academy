import type { Metadata } from "next";
import { NovaProvaTabs } from "./NovaProvaTabs";

export const metadata: Metadata = { title: "Nova Prova" };

export default function NovaProvaPage() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.6px] text-foreground">Nova Prova</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Gere com IA ou crie do zero — as questões são editáveis e salvas
            automaticamente ao final.
          </p>
        </div>
      </div>
      <NovaProvaTabs />
    </>
  );
}
