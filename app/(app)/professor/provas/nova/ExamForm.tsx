"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Upload } from "lucide-react";
import { examGenerationSchema, type ExamGenerationInput } from "@/lib/exam/schemas";
import { AiThinking } from "@/components/AiThinking";
import { QuotaNotice } from "@/components/ai/QuotaNotice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const STEPS = [
  { n: 1, label: "Geral" },
  { n: 2, label: "Conteúdo" },
  { n: 3, label: "Formato" },
  { n: 4, label: "Apoio" },
  { n: 5, label: "Gerar" },
];

const PUBLICO_OPTIONS = [
  ["infantil", "Infantil"],
  ["fundamental", "Fundamental"],
  ["medio", "Ensino Médio"],
  ["graduacao", "Graduação"],
  ["tecnico", "Técnico"],
  ["concurso", "Concurso"],
] as const;

const ESTILO_OPTIONS = [
  ["escolar", "Escolar (direto e didático)"],
  ["enem", "ENEM (contextualizado)"],
  ["vestibular", "Vestibular (mais cobrança)"],
  ["tecnico", "Técnico (objetivo e prático)"],
  ["desafiador", "Desafiador (nível alto)"],
] as const;

const TIPO_OPTIONS = [
  ["multipla", "Múltipla escolha"],
  ["vf", "Verdadeiro / Falso"],
  ["discursiva", "Discursiva"],
  ["mista", "Mista"],
] as const;

const NIVEL_OPTIONS = [
  ["facil", "Fácil"],
  ["medio", "Médio"],
  ["dificil", "Difícil"],
] as const;

const DIST_OPTIONS = [
  ["40/40/20", "40% fácil, 40% médio, 20% difícil"],
  ["30/50/20", "30% fácil, 50% médio, 20% difícil"],
  ["25/50/25", "25% fácil, 50% médio, 25% difícil"],
  ["20/40/40", "20% fácil, 40% médio, 40% difícil"],
] as const;

const OBSERVATION_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;
const OBSERVATION_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

function markdownWithMathDelimiters(value: string) {
  return value
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, formula: string) => `\n$$\n${formula}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, formula: string) => `$${formula}$`);
}

function StepBadge({ n, accent = false }: { n: number; accent?: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        accent
          ? "border-brand-border bg-brand-dim text-brand-text"
          : "text-muted-foreground"
      }
    >
      Etapa {n}
    </Badge>
  );
}

/** Formulário de geração de prova — piloto RHF+Zod+DS (decisões 1 e 9 do ADR 13). */
export function ExamForm() {
  const router = useRouter();

  const form = useForm<ExamGenerationInput>({
    resolver: zodResolver(examGenerationSchema),
    defaultValues: {
      curso: "",
      tituloprova: "",
      materia: "",
      assunto: "",
      publico: "medio",
      estilo: "escolar",
      observacoesprofessor: "",
      tipo: "multipla",
      quantidade: "10",
      pontos: "1",
      nivel: "medio",
      distniveis: "40/40/20",
      usarapostila: false,
      gabarito: true,
    },
  });

  const [apostila, setApostila] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [quotaHit, setQuotaHit] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [observationAttachment, setObservationAttachment] = useState<File | null>(null);
  const [observationAttachmentError, setObservationAttachmentError] = useState<string | null>(null);
  const [observationDragOver, setObservationDragOver] = useState(false);
  const observationFileInputRef = useRef<HTMLInputElement>(null);
  const observationPreviewUrl = useMemo(
    () => observationAttachment?.type.startsWith("image/") ? URL.createObjectURL(observationAttachment) : null,
    [observationAttachment],
  );
  const loading = form.formState.isSubmitting;

  useEffect(() => {
    return () => {
      if (observationPreviewUrl) URL.revokeObjectURL(observationPreviewUrl);
    };
  }, [observationPreviewUrl]);

  // ── Scroll-driven progress tracker (parity with legacy) ────
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('[id^="step-"]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const n = Number(entry.target.id.replace("step-", ""));
            if (n) setActiveStep(n);
          }
        });
      },
      { threshold: 0.4 },
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  function handleFile(file: File | null) {
    if (file && !/\.pdf$/i.test(file.name)) {
      setErro("Escolha um arquivo PDF para continuar.");
      return;
    }
    setErro(null);
    setApostila(file);
    form.setValue("usarapostila", !!file);
  }

  function handleObservationAttachment(file: File | null) {
    if (!file) {
      setObservationAttachment(null);
      setObservationAttachmentError(null);
      return;
    }
    if (!OBSERVATION_ATTACHMENT_TYPES.has(file.type)) {
      setObservationAttachmentError("Escolha uma imagem PNG, JPG, JPEG ou WEBP, ou um arquivo PDF.");
      return;
    }
    if (file.size > OBSERVATION_ATTACHMENT_MAX_SIZE) {
      setObservationAttachmentError("O anexo deve ter no máximo 10 MB.");
      return;
    }
    setObservationAttachment(file);
    setObservationAttachmentError(null);
  }

  async function onSubmit(values: ExamGenerationInput) {
    setErro(null);
    setQuotaHit(false);

    const body = new FormData();
    body.append("dados", JSON.stringify(values));
    if (apostila) body.append("apostila", apostila);

    try {
      const res = await fetch("/api/ai/exams/generate", { method: "POST", body });
      const data = await res.json();
      if (res.status === 402) {
        setQuotaHit(true);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Não conseguimos gerar a prova agora. Tente novamente.");
      router.push(`/professor/provas/${data.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
    }
  }

  const usarapostila = form.watch("usarapostila");

  return (
    <>
      {/* Progress tracker */}
      <div
        className="mb-6 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Progresso do formulário"
      >
        <div className="flex min-w-max items-center py-1">
          {STEPS.map((s, i) => (
            <div key={s.n} className="contents">
              <div
                className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                  activeStep === s.n ? "text-brand-text" : "text-subtle"
                }`}
              >
                <span
                  className={`grid size-6 place-items-center rounded-full border-[1.5px] text-xs ${
                    activeStep === s.n ? "border-brand bg-brand-dim" : "border-subtle"
                  }`}
                >
                  {s.n}
                </span>
                <b>{s.label}</b>
              </div>
              {i < STEPS.length - 1 && <div className="mx-3 h-px w-8 bg-border" aria-hidden />}
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {/* ETAPA 1 — Configurações Gerais */}
          <Card id="step-1">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <StepBadge n={1} />
                  <CardTitle>Configurações Gerais</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  O motor de IA é configurado pela plataforma.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="curso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curso</FormLabel>
                      <FormControl>
                        <Input data-testid="exam-course" placeholder="Ex: Ensino Médio, Graduação..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tituloprova"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Prova</FormLabel>
                      <FormControl>
                        <Input data-testid="exam-title" placeholder="Ex: Avaliação Bimestral" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
          </Card>

          {/* ETAPA 2 — Conteúdo */}
          <Card id="step-2">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <StepBadge n={2} />
                  <CardTitle>Conteúdo da Prova</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="materia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matéria</FormLabel>
                      <FormControl>
                        <Input data-testid="exam-subject" placeholder="Ex: Informática, Matemática..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assunto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto / Tema</FormLabel>
                      <FormControl>
                        <Input data-testid="exam-topic" placeholder="Ex: Redes, Funções, HTML..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="publico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Público-alvo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PUBLICO_OPTIONS.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estilo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ESTILO_OPTIONS.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacoesprofessor"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Observações do professor</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: inclua exemplos práticos ou fórmulas como \\(\\sqrt{4} = 2\\)."
                          {...field}
                        />
                      </FormControl>
                      {field.value.trim() && (
                        <div className="rounded-md border border-border bg-card-2 p-4">
                          <p className="mb-2 text-xs font-semibold text-muted-foreground">Pré-visualização</p>
                          <div className="prose prose-sm max-w-none text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
                            >
                              {markdownWithMathDelimiters(field.value)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      <div
                        className={`flex flex-wrap items-center gap-3 rounded-md border border-dashed p-4 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow ${
                          observationDragOver ? "border-brand bg-brand-dim" : "border-border-hover bg-card-2"
                        }`}
                        role="button"
                        tabIndex={0}
                        aria-label="Anexar imagem ou PDF às observações"
                        onClick={() => observationFileInputRef.current?.click()}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            observationFileInputRef.current?.click();
                          }
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setObservationDragOver(true);
                        }}
                        onDragLeave={() => setObservationDragOver(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setObservationDragOver(false);
                          handleObservationAttachment(event.dataTransfer.files?.[0] ?? null);
                        }}
                      >
                        {observationPreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- local object URL selected by the professor.
                          <img src={observationPreviewUrl} alt="Pré-visualização do anexo" className="size-16 rounded-sm object-cover" />
                        ) : (
                          <Upload size={22} className="shrink-0 text-muted-foreground" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {observationAttachment?.name ?? "Arraste uma imagem ou PDF aqui"}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {observationAttachment ? "Anexo selecionado para pré-visualização." : "ou clique para selecionar · até 10 MB"}
                          </span>
                        </div>
                        {observationAttachment && (
                          <Button
                            type="button"
                            variant="destructive-ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (observationFileInputRef.current) observationFileInputRef.current.value = "";
                              handleObservationAttachment(null);
                            }}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                      <input
                        ref={observationFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        className="sr-only"
                        onChange={(event) => handleObservationAttachment(event.target.files?.[0] ?? null)}
                      />
                      {observationAttachmentError && (
                        <p className="text-sm text-danger-text">{observationAttachmentError}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
          </Card>

          {/* ETAPA 3 — Formato & Estrutura */}
          <Card id="step-3">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <StepBadge n={3} />
                  <CardTitle>Formato &amp; Estrutura</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Questões</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPO_OPTIONS.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
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
                      <FormLabel>Quantidade de Questões</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={50} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pontos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pontos por Questão</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.5" {...field} />
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
                          {NIVEL_OPTIONS.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="distniveis"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Distribuição de dificuldade</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DIST_OPTIONS.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
          </Card>

          {/* ETAPA 4 — Material de Apoio */}
          <Card id="step-4">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <StepBadge n={4} />
                  <CardTitle>Material de Apoio</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="usarapostila"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4">
                      <div>
                        <FormLabel>Usar apostila (PDF)</FormLabel>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Envie um PDF de referência — a IA lê o conteúdo e baseia as questões
                          nele. PDFs escaneados (sem texto selecionável) ainda não são suportados.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div
                  className={`flex flex-wrap items-center gap-4 rounded-md border border-dashed p-5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-brand-glow ${
                    dragOver ? "border-brand bg-brand-dim" : "border-border-hover bg-card-2"
                  }`}
                  tabIndex={0}
                  role="button"
                  aria-label="Área de envio de PDF — arraste ou clique para selecionar"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                >
                  <Upload
                    size={24}
                    strokeWidth={1.8}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-md font-semibold text-foreground">
                      {apostila ? apostila.name : "Arraste e solte seu PDF aqui"}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {apostila ? "PDF selecionado." : "ou clique para selecionar o arquivo"}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Selecionar arquivo
                    </Button>
                    {apostila && (
                      <Button
                        type="button"
                        variant="destructive-ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fileInputRef.current) fileInputRef.current.value = "";
                          handleFile(null);
                        }}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  accept="application/pdf"
                  className="visually-hidden"
                  type="file"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {!usarapostila && apostila && (
                  <p className="text-xs text-muted-foreground">
                    O arquivo só é usado com &ldquo;Usar apostila&rdquo; ligado.
                  </p>
                )}
              </CardContent>
          </Card>

          {/* ETAPA 5 — Finalizar */}
          <Card id="step-5" className="border-brand-border shadow-accent-glow">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <StepBadge n={5} accent />
                  <CardTitle>Finalizar</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Gabarito e geração da prova.</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="gabarito"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div>
                        <FormLabel>Incluir gabarito ao final</FormLabel>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Adiciona resposta de cada questão ao final do documento.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {quotaHit && <QuotaNotice upgradeHref="/professor/configuracoes" />}
                {erro && (
                  <div
                    role="alert"
                    className="rounded-md border border-danger-border bg-danger-dim p-3 text-sm text-danger-text"
                  >
                    {erro}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Questões editáveis</Badge>
                    <Badge variant="secondary">Salva automaticamente</Badge>
                  </div>
                  <Button
                    data-testid="exam-submit"
                    type="submit"
                    size="lg"
                    className="h-11 min-w-40 rounded-full font-display tracking-[-0.2px]"
                    disabled={loading}
                  >
                    {loading ? <AiThinking label="Gerando" /> : "Gerar Prova"}
                  </Button>
                </div>
              </CardContent>
          </Card>
        </form>
      </Form>
    </>
  );
}
