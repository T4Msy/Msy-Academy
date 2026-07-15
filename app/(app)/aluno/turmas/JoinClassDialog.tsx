"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinClass } from "./actions";

export function JoinClassDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const { className } = await joinClass(code);
        setCode("");
        setOpen(false);
        toast.success(`Você entrou em ${className}.`);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível entrar na turma.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Entrar em uma turma</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrar em uma turma</DialogTitle>
          <DialogDescription>
            Digite o código de convite compartilhado pelo professor.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-code">Código da turma</Label>
            <Input
              id="invite-code"
              value={code}
              disabled={pending}
              placeholder="ABC123"
              autoComplete="off"
              autoCapitalize="characters"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
            {error && <p className="text-xs text-danger-text">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
