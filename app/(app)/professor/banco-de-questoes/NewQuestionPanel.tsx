"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuestion } from "@/lib/questions/actions";
import { QuestionForm } from "@/components/questions/QuestionForm";

export function NewQuestionPanel() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)} style={{ marginBottom: 16 }}>
        + Nova questão
      </button>
    );
  }

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <h2 className="card-title">Nova questão</h2>
      </div>
      <div className="card-body">
        <QuestionForm
          submitLabel="Salvar"
          onCancel={() => setOpen(false)}
          onSubmit={async (input) => {
            await createQuestion(input);
            setOpen(false);
            router.refresh();
          }}
        />
      </div>
    </section>
  );
}
