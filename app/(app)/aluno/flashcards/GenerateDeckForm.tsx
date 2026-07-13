"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deckGenerationSchema, type DeckGenerationInput } from "@/lib/flashcards/schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GenerateDeckForm({ materials }: { materials: { id: string; title: string }[] }) {
  const form = useForm<DeckGenerationInput>({
    resolver: zodResolver(deckGenerationSchema),
    defaultValues: { materialId: "" },
  });
  const { generate, error, quotaHit } = useAiGenerate(
    "/api/ai/flashcards/generate",
    (id) => `/aluno/flashcards/${id}`,
  );
  const loading = form.formState.isSubmitting;

  if (materials.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card-2 p-4 text-sm text-muted-foreground">
        Nenhum material disponível ainda. Peça ao seu professor para anexar um PDF a uma das suas
        turmas.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(generate)} noValidate>
        <Card className="max-w-md">
          <CardContent className="flex flex-col gap-4 pt-6">
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gerar a partir de</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um material…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {loading ? <AiThinking label="Gerando" /> : "Gerar deck"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
