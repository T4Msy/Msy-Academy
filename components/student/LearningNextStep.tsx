import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getNextStep, type LearningStage } from "@/lib/learning/nextStep";

export function LearningNextStep({
  stage,
  materialId,
  deckId,
  events = [],
}: {
  stage: LearningStage;
  materialId?: string;
  deckId?: string;
  events?: { label: string; status: "done" | "current" }[];
}) {
  const nextStep = getNextStep({ stage, materialId, deckId });

  return (
    <Card className="mt-6 gap-0 border-brand-border bg-brand-dim py-0">
      <CardContent className="px-5.5 py-4.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-foreground">{nextStep.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{nextStep.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {nextStep.secondary.map((action) => (
              <Link key={action.href} href={action.href} className="rounded-sm border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-ring">
                {action.label}
              </Link>
            ))}
            <Link href={nextStep.primary.href} className="inline-flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring">
              {nextStep.primary.label}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
        {events.length > 0 && (
          <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-brand-border/60 pt-3 text-xs text-muted-foreground" aria-label="Sequência de estudo">
            {events.map((event, index) => (
              <li key={`${event.label}-${index}`} className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${event.status === "done" ? "bg-card text-brand-text" : "bg-brand text-primary-foreground"}`}>
                  {event.status === "done" && <Check className="size-3" aria-hidden />}
                  {event.label}
                </span>
                {index < events.length - 1 && <span aria-hidden>→</span>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
