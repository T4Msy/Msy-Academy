import type { Metadata } from "next";
import { NovaAtividadeTabs } from "./NovaAtividadeTabs";

export const metadata: Metadata = { title: "Nova Atividade" };

export default function NovaAtividadePage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Nova Atividade</h1>
          <p className="page-subtitle">Gere com IA ou crie do zero uma lista de exercícios.</p>
        </div>
      </div>
      <NovaAtividadeTabs />
    </>
  );
}
