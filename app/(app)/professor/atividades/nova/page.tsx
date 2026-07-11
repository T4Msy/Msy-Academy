import type { Metadata } from "next";
import { ActivityForm } from "./ActivityForm";

export const metadata: Metadata = { title: "Nova Atividade" };

export default function NovaAtividadePage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Nova Atividade</h1>
          <p className="page-subtitle">Gere uma lista de exercícios com IA.</p>
        </div>
      </div>
      <ActivityForm />
    </>
  );
}
