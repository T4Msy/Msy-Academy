"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, RefreshCw, Save } from "lucide-react";
import { AiThinking } from "@/components/AiThinking";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QuestionData } from "@/lib/questions/types";
import type { ExamVariation } from "@/lib/exam/variation";
import { saveExamVariation } from "../actions";

type PreviewQuestion = {
  type: "MULTIPLA" | "VF" | "DISCURSIVA";
  statement: string;
  options?: { id: string; text: string }[] | null;
  correctAnswer: string | string[];
  explanation?: string | null;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
};

const difficultyLabel = { FACIL: "Fácil", MEDIO: "Médio", DIFICIL: "Difícil" } as const;
const typeLabel = {
  MULTIPLA: "Múltipla escolha",
  VF: "Verdadeiro/Falso",
  DISCURSIVA: "Discursiva",
} as const;

function QuestionPreview({
  question,
  index,
  idPrefix,
}: {
  question: PreviewQuestion;
  index: number;
  idPrefix: string;
}) {
  return (
    <article
      className="rounded-lg border border-border bg-card p-4"
      aria-labelledby={`${idPrefix}-question-${index}`}
    >
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="font-bold text-foreground">Questão {index + 1}</span>
        <span>{typeLabel[question.type]}</span>
        <span>{difficultyLabel[question.difficulty]}</span>
      </div>
      <h4 id={`${idPrefix}-question-${index}`} className="text-sm leading-relaxed font-medium">
        {question.statement}
      </h4>
      {question.type !== "DISCURSIVA" && question.options?.length ? (
        <ul className="mt-3 flex list-none flex-col gap-2">
          {question.options.map((option) => (
            <li
              key={option.id}
              className="rounded-sm border border-border px-3 py-2 text-sm text-muted-foreground"
            >
              <b className="mr-2 text-brand-text">{option.id}</b>
              {option.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          <b>Resposta de referência:</b>{" "}
          {Array.isArray(question.correctAnswer)
            ? question.correctAnswer.join(", ")
            : question.correctAnswer}
        </p>
      )}
      {question.explanation && (
        <p className="mt-3 text-xs text-muted-foreground">
          <b>Explicação:</b> {question.explanation}
        </p>
      )}
    </article>
  );
}

function VersionColumn({
  title,
  questions,
  idPrefix,
}: {
  title: string;
  questions: PreviewQuestion[];
  idPrefix: string;
}) {
  return (
    <section aria-label={title} className="min-w-0">
      <h3 className="mb-3 font-display text-lg font-bold">{title}</h3>
      <div className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <QuestionPreview
            key={`${title}-${index}`}
            question={question}
            index={index}
            idPrefix={idPrefix}
          />
        ))}
      </div>
    </section>
  );
}

export function ExamVariationDialog({
  examId,
  examTitle,
  originalQuestions,
}: {
  examId: string;
  examTitle: string;
  originalQuestions: QuestionData[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [variation, setVariation] = useState<ExamVariation | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const original: PreviewQuestion[] = originalQuestions.map((question) => ({
    type: question.type,
    statement: question.statement,
    options: question.options,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    difficulty: question.difficulty,
  }));

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai/exams/${examId}/variation`, { method: "POST" });
      const payload = (await response.json().catch(() => null)) as
        (ExamVariation & { error?: string }) | null;
      if (!response.ok || !payload || payload.error)
        throw new Error(payload?.error || "Não conseguimos gerar a variação. Tente novamente.");
      setVariation(payload);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não conseguimos gerar a variação. Tente novamente.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    void generate();
  }

  async function save() {
    if (!variation) return;
    setSaving(true);
    setError(null);
    try {
      const result = await saveExamVariation(examId, variation);
      if (result.error || !result.id)
        throw new Error(result.error || "Não conseguimos salvar a nova prova. Tente novamente.");
      router.push(`/professor/provas/${result.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não conseguimos salvar a nova prova. Tente novamente.",
      );
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleOpen}
        disabled={generating || saving}
        aria-label="Gerar variação desta prova"
      >
        <GitBranch aria-hidden />
        {generating ? <AiThinking label="Gerando" /> : "Gerar variação"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!generating && !saving) setOpen(next);
        }}
      >
        <DialogContent
          className="top-[82px] z-[150] flex h-[calc(100vh-106px)] max-h-[860px] w-[calc(100vw-96px)] max-w-[1400px] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:top-[84px] sm:h-[calc(100vh-108px)] [&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:right-5"
          aria-busy={generating || saving}
        >
          <DialogHeader className="z-10 shrink-0 border-b border-border bg-background px-6 pt-5 pr-16 pb-4">
            <DialogTitle>Comparar variação</DialogTitle>
            <DialogDescription>
              {examTitle} · confira as duas versões antes de criar uma nova prova.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {generating && !variation ? (
              <div className="grid gap-4 md:grid-cols-2" aria-label="Gerando prévia">
                {[0, 1].map((column) => (
                  <div key={column} className="space-y-3">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                  </div>
                ))}
              </div>
            ) : variation ? (
              <>
                <div className="hidden items-start gap-4 md:grid md:grid-cols-2">
                  <VersionColumn
                    title="Versão original"
                    questions={original}
                    idPrefix="desktop-original"
                  />
                  <VersionColumn
                    title="Nova variação"
                    questions={variation.questions}
                    idPrefix="desktop-variation"
                  />
                </div>
                <Tabs defaultValue="original" className="md:hidden">
                  <TabsList className="mb-3 grid w-full grid-cols-2">
                    <TabsTrigger value="original">Original</TabsTrigger>
                    <TabsTrigger value="variation">Variação</TabsTrigger>
                  </TabsList>
                  <TabsContent value="original">
                    <VersionColumn
                      title="Versão original"
                      questions={original}
                      idPrefix="mobile-original"
                    />
                  </TabsContent>
                  <TabsContent value="variation">
                    <VersionColumn
                      title="Nova variação"
                      questions={variation.questions}
                      idPrefix="mobile-variation"
                    />
                  </TabsContent>
                </Tabs>
              </>
            ) : null}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-danger-border bg-danger-dim p-3 text-sm text-danger-text"
              >
                {error}
              </div>
            )}
          </div>

          <footer className="z-10 flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={generating || saving}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={generating || saving}
              onClick={() => void generate()}
              aria-label="Gerar uma nova variação"
            >
              <RefreshCw aria-hidden />
              {generating ? <AiThinking label="Gerando novamente" /> : "Gerar novamente"}
            </Button>
            <Button
              type="button"
              disabled={!variation || generating || saving}
              onClick={() => void save()}
              aria-label="Salvar variação como nova prova"
            >
              <Save aria-hidden />
              {saving ? "Salvando…" : "Salvar como nova prova"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  );
}
