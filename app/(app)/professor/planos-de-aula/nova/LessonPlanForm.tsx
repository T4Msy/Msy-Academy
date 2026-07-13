"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  lessonPlanGenerationSchema,
  type LessonPlanGenerationInput,
} from "@/lib/lesson-plans/schemas";
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
import { Textarea } from "@/components/ui/textarea";

export function LessonPlanForm() {
  const form = useForm<LessonPlanGenerationInput>({
    resolver: zodResolver(lessonPlanGenerationSchema),
    defaultValues: { disciplina: "", serie: "", tema: "", observacoes: "" },
  });
  const { generate, error, quotaHit } = useAiGenerate(
    "/api/ai/lesson-plans/generate",
    (id) => `/professor/planos-de-aula/${id}`,
  );
  const loading = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(generate)} noValidate>
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="disciplina"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: História" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 8º ano" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tema"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Tema da aula</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Revolução Industrial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: turma com pouco tempo disponível, priorizar atividade prática..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {quotaHit && <QuotaNotice upgradeHref="/professor/configuracoes" />}
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
                {loading ? <AiThinking label="Gerando" /> : "Gerar Plano de Aula"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
