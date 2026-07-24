"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Bot,
  ChartNoAxesCombined,
  CheckCheck,
  ChevronRight,
  ClipboardList,
  FileText,
  Grid2X2,
  LibraryBig,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DashboardProgressCard, type ProgressStep } from "@/components/ui/dashboard-progress-card";
import { getVisibleExploreResources, type ExploreResource } from "@/lib/dashboard/exploreResourcesModel";

const ICONS = { FileText, Sparkles, ClipboardList, LibraryBig, BookOpen, Send, CheckCheck, ChartNoAxesCombined, UserRound, Bot };

export function ExploreResourcesCard({ resources, userId }: { resources: ExploreResource[]; userId: string }) {
  const [open, setOpen] = useState(false);
  const completed = resources.filter((resource) => resource.completed).length;
  const visible = useMemo(() => getVisibleExploreResources(resources), [resources]);
  const steps: ProgressStep[] = visible.map((resource) => ({
    id: resource.id,
    label: resource.title,
    description: resource.description,
    completed: resource.completed,
    href: resource.href,
    actionLabel: "Abrir recurso",
    icon: ICONS[resource.icon as keyof typeof ICONS],
  }));

  useEffect(() => {
    const key = `msy-explore-reward:${userId}`;
    const seen = JSON.parse(localStorage.getItem(key) ?? "[]") as number[];
    const rewards: [number, string][] = [
      [1, "Você acabou de descobrir um novo recurso da plataforma!"],
      [5, "⭐ Você já conhece boa parte da MSY Academy."],
      [resources.length, "Parabéns! Você explorou todos os principais recursos da plataforma."],
    ];
    rewards.forEach(([threshold, message]) => {
      if (completed >= threshold && !seen.includes(threshold)) {
        toast.success(message);
        seen.push(threshold);
      }
    });
    localStorage.setItem(key, JSON.stringify(seen));
  }, [completed, resources.length, userId]);

  const categories = [...new Set(resources.map((resource) => resource.category))];

  return (
    <DashboardProgressCard
      title="Explore recursos"
      description="Descubra aos poucos tudo o que a MSY Academy oferece."
      completedLabel="recursos explorados"
      progress={{ completed, total: resources.length }}
      steps={steps}
      footer={
        <div className="border-t border-border px-5.5 py-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                aria-label="Ver todos os recursos da MSY Academy"
                className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_4px_14px_rgba(217,119,87,0.2)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_7px_20px_rgba(217,119,87,0.3)] active:translate-y-0 active:scale-[0.98] sm:px-6"
              >
                <Grid2X2 aria-hidden="true" />
                Ver todos os recursos
                <ChevronRight aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Todos os recursos</DialogTitle>
                <DialogDescription>Explore no seu ritmo. Os recursos concluídos permanecem marcados.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 sm:grid-cols-2">
                {categories.map((category) => (
                  <section key={category} aria-labelledby={`resource-category-${category}`}>
                    <h3 id={`resource-category-${category}`} className="mb-2 font-display text-sm font-bold text-foreground">{category}</h3>
                    <ul className="space-y-1.5">
                      {resources.filter((resource) => resource.category === category).map((resource) => (
                        <li key={resource.id} className="flex items-start gap-2 rounded-md border border-border p-2.5 text-sm">
                          <span className="mt-0.5 text-brand-text" aria-hidden="true">{resource.completed ? "✓" : "○"}</span>
                          <span className={resource.completed ? "text-foreground" : "text-muted-foreground"}>{resource.title}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    />
  );
}
