"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  studyPlanGenerationSchema,
  type StudyPlanGenerationInput,
} from "@/lib/study-plans/schemas";
import { useAiGenerate } from "@/hooks/useAiGenerate";
import { AiThinking } from "@/components/AiThinking";
import { QuotaNotice } from "@/components/ai/QuotaNotice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function StudyPlanWizard() {
  const form = useForm<StudyPlanGenerationInput>({
    resolver: zodResolver(studyPlanGenerationSchema),
    defaultValues: { goal: "", examDate: "" },
  });
  const { generate, error, quotaHit } = useAiGenerate(
    "/api/ai/study-plan/generate",
    (id) => `/aluno/plano-de-estudos/${id}`,
  );
  const loading = form.formState.isSubmitting;

  return (
    <Form {...form}>
      {/* examDate vazio segue como "" — o route converte para null ao salvar. */}
      <form onSubmit={form.handleSubmit(generate)} noValidate>
        <Card className="max-w-md">
          <CardContent className="flex flex-col gap-4 pt-6">
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Passar no vestibular de Medicina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="examDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da prova (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {quotaHit && <QuotaNotice upgradeHref="/aluno/configuracoes" />}
            {error && (
              <div
                role="alert"
                className="rounded-md border border-danger-border bg-danger-dim p-3 text-sm text-danger-text"
              >
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="h-11 min-w-40 rounded-full font-display tracking-[-0.2px]"
                disabled={loading}
              >
                {loading ? <AiThinking label="Gerando" /> : "Gerar cronograma"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
