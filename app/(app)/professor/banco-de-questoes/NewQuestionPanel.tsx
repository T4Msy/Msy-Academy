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
      <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-md font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow active:translate-y-px disabled:pointer-events-none disabled:opacity-50 bg-primary font-bold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.16)] hover:-translate-y-px hover:opacity-90 px-3 py-[7px] text-sm mb-4" onClick={() => setOpen(true)}>
        + Nova questão
      </button>
    );
  }

  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-elevated transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5.5 pt-5 pb-4">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.2px] text-foreground">Nova questão</h2>
      </div>
      <div className="flex flex-col gap-4.5 p-5.5">
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
