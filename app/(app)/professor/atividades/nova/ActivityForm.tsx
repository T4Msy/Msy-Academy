"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { activityGenerationSchema, type ActivityGenerationInput } from "@/lib/activities/schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ActivityForm() {
  const form = useForm<ActivityGenerationInput>({
    resolver: zodResolver(activityGenerationSchema),
    defaultValues: {
      tituloprova: "",
      materia: "",
      assunto: "",
      tipo: "multipla",
      quantidade: "8",
      nivel: "medio",
    },
  });
  const { generate, error, quotaHit } = useAiGenerate(
    "/api/ai/activities/generate",
    (id) => `/professor/atividades/${id}`,
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
                name="tituloprova"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lista de exercícios — Frações" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="materia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matéria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Matemática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assunto"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Assunto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Frações equivalentes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de questão</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="multipla">Múltipla escolha</SelectItem>
                        <SelectItem value="vf">Verdadeiro / Falso</SelectItem>
                        <SelectItem value="discursiva">Discursiva</SelectItem>
                        <SelectItem value="mista">Mista</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={30} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
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
                {loading ? <AiThinking label="Gerando" /> : "Gerar Atividade"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
