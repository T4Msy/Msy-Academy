"use client";

import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DsBarChart } from "@/components/charts/recharts";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SwatchRow({ items }: { items: { name: string; cssVar: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((s) => (
        <div key={s.name} className="flex flex-col items-start gap-1.5">
          <span
            className="block h-14 w-24 rounded-sm border border-border"
            style={{ background: `var(${s.cssVar})` }}
          />
          <span className="text-2xs text-muted-foreground">{s.name}</span>
        </div>
      ))}
    </div>
  );
}

/** Showcase de tokens + todos os componentes ui/ em seus estados. */
export function Showcase() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Design System</h1>
          <p className="mt-1 text-md text-muted-foreground">
            Fonte única de verdade da interface — tokens e primitivas reais de{" "}
            <code className="text-brand-text">components/ui</code>. Toda tela nova compõe estas
            peças.
          </p>
        </div>
        <ThemeToggle variant="icon" />
      </header>

      <Section title="Cores">
        <div className="flex flex-col gap-5">
          <SwatchRow
            items={[
              { name: "background", cssVar: "--bg" },
              { name: "shell", cssVar: "--bg-shell" },
              { name: "card", cssVar: "--bg-card" },
              { name: "card-2", cssVar: "--bg-card-2" },
              { name: "border", cssVar: "--border" },
            ]}
          />
          <SwatchRow
            items={[
              { name: "brand / primary", cssVar: "--accent" },
              { name: "brand-dim", cssVar: "--accent-dim" },
              { name: "danger", cssVar: "--danger" },
              { name: "danger-dim", cssVar: "--danger-dim" },
            ]}
          />
          <SwatchRow
            items={Array.from({ length: 8 }, (_, i) => ({
              name: `cat-${i + 1}`,
              cssVar: `--cat-${i + 1}`,
            }))}
          />
          <p className="text-sm text-muted-foreground">
            Texto: <span className="text-foreground">foreground</span> ·{" "}
            <span className="text-muted-foreground">muted</span> ·{" "}
            <span className="text-subtle">subtle</span> ·{" "}
            <span className="text-brand-text">brand-text (AA nos dois temas)</span> ·{" "}
            <span className="text-danger-text">danger-text</span>
          </p>
        </div>
      </Section>

      <Section title="Tipografia">
        <div className="flex flex-col gap-2">
          <p className="font-display text-4xl font-extrabold">Display 4xl — Inter Tight</p>
          <p className="font-display text-3xl font-extrabold">Título de página 3xl</p>
          <p className="font-display text-2xl font-bold">Título de seção 2xl</p>
          <p className="text-xl font-semibold">Heading xl</p>
          <p className="text-lg font-semibold">Heading lg</p>
          <p className="text-base">Corpo base (15px/1.6) — Inter. Texto padrão da plataforma.</p>
          <p className="text-md">Controles md (14px) — botões, itens de menu, labels.</p>
          <p className="text-sm text-muted-foreground">Suporte sm (13px) — subtítulos, hints.</p>
          <p className="text-xs text-muted-foreground">Meta xs (12px) — timestamps, contadores.</p>
          <p className="text-2xs text-muted-foreground">Micro 2xs (11px) — eyebrows, badges.</p>
        </div>
      </Section>

      <Section title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Sparkles /> Primário
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button variant="destructive-ghost">Destrutivo ghost</Button>
          <Button disabled>Desabilitado</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Large</Button>
          <Button size="default">Default</Button>
          <Button size="sm">Small</Button>
          <Button size="xs">Extra small</Button>
          <Button size="icon" aria-label="Ícone">
            <Sparkles />
          </Button>
        </div>
      </Section>

      <Section title="Formulário">
        <Card>
          <CardContent className="flex max-w-md flex-col gap-4 pt-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-input">Título da prova</Label>
              <Input id="ds-input" placeholder="Ex.: Avaliação de Matemática — 2º bimestre" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-textarea">Instruções</Label>
              <Textarea id="ds-textarea" placeholder="Orientações para os alunos…" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="ds-check" defaultChecked />
              <Label htmlFor="ds-check">Embaralhar questões</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ds-switch" defaultChecked />
              <Label htmlFor="ds-switch">Correção automática</Label>
            </div>
            <div aria-invalid className="contents">
              <Input aria-invalid placeholder="Estado de erro (aria-invalid)" />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publicar prova?</DialogTitle>
                <DialogDescription>
                  Os alunos da turma receberão a tarefa imediatamente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button>Publicar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Painel lateral</SheetTitle>
                <SheetDescription>Para fluxos secundários e detalhes.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <p className="text-md">Conteúdo contextual leve, com foco gerenciado.</p>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Dropdown</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Renomear</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Dica curta e objetiva.</TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            onClick={() => toast.success("Prova criada com sucesso.", { description: "8 questões geradas pela IA." })}
          >
            Toast
          </Button>
        </div>
      </Section>

      <Section title="Feedback e estrutura">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge className="bg-brand-dim text-brand-text">Chip da marca</Badge>
        </div>
        <div className="flex max-w-md flex-col gap-2">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Separator />
        <Tabs defaultValue="a" className="max-w-md">
          <TabsList>
            <TabsTrigger value="a">Questões</TabsTrigger>
            <TabsTrigger value="b">Configurações</TabsTrigger>
            <TabsTrigger value="c">Resultados</TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="pt-3 text-md text-muted-foreground">
            Conteúdo da aba de questões.
          </TabsContent>
          <TabsContent value="b" className="pt-3 text-md text-muted-foreground">
            Conteúdo da aba de configurações.
          </TabsContent>
          <TabsContent value="c" className="pt-3 text-md text-muted-foreground">
            Conteúdo da aba de resultados.
          </TabsContent>
        </Tabs>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Card</CardTitle>
          </CardHeader>
          <CardContent className="text-md text-muted-foreground">
            Superfície padrão de conteúdo (card sobre background, card-2 para aninhados).
          </CardContent>
        </Card>
      </Section>

      <Section title="Editor de conteúdo (Tiptap)">
        <RichTextEditor
          value={{
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Editor padrão da plataforma — armazena " },
                  { type: "text", marks: [{ type: "bold" }], text: "JSON do Tiptap" },
                  { type: "text", text: ", nunca HTML cru." },
                ],
              },
            ],
          }}
        />
      </Section>

      <Section title="Charts (Recharts tematizado)">
        <Card>
          <CardContent className="pt-6">
            <DsBarChart
              xKey="turma"
              series={[
                { key: "media", label: "Média da turma" },
                { key: "engajamento", label: "Engajamento" },
              ]}
              data={[
                { turma: "6º A", media: 72, engajamento: 85 },
                { turma: "6º B", media: 64, engajamento: 71 },
                { turma: "7º A", media: 81, engajamento: 90 },
                { turma: "8º C", media: 58, engajamento: 62 },
              ]}
            />
          </CardContent>
        </Card>
      </Section>
    </main>
  );
}
