"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassModuleOption } from "./types";

/**
 * Filtro de módulo, vive na URL (?modulo=). Não renderiza nada quando a
 * turma só tem o módulo padrão — mostrar um seletor de opção única é ruído
 * para a esmagadora maioria das turmas que nunca usam múltiplos módulos.
 */
export function ModuleSwitcher({ modules }: { modules: ClassModuleOption[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeModuleId = searchParams.get("modulo") ?? "all";

  if (modules.length <= 1) return null;

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("modulo");
    else params.set("modulo", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select value={activeModuleId} onValueChange={onChange}>
      <SelectTrigger aria-label="Filtrar por módulo" size="sm" className="bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="all">Todos os módulos</SelectItem>
        {modules.map((module) => (
          <SelectItem key={module.id} value={module.id}>
            <span className="flex items-center gap-1.5">
              {module.name}
              {module.isDefault && (
                <Badge variant="outline" className="text-2xs">
                  Padrão
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
