import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combinação canônica de classes do Design System (padrão shadcn):
 * clsx resolve condicionais, twMerge resolve conflitos de utilities
 * (ex.: "p-2" passado por prop vence o "p-4" default do componente).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
