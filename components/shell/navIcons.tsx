/**
 * Ícones de navegação — adapter fino sobre lucide-react (decisão nº 12 do
 * ADR de 2026-07: Lucide é o set único de ícones da plataforma).
 * Mantém os nomes de export originais para não tocar nos consumidores
 * (layouts professor/aluno/admin, Sidebar, MobileTabBar). 18px / stroke 1.6
 * preserva o peso de linha do set anterior. Código NOVO deve importar
 * lucide-react diretamente; este arquivo existe só pela navegação legada.
 */

import {
  Book,
  Building2,
  CalendarCheck,
  ChartColumn,
  ChevronDown,
  CircleCheck,
  ClipboardCheck,
  Copy,
  EllipsisVertical,
  FileText,
  Gamepad2,
  House,
  Layers,
  MessageCircle,
  Plus,
  Route,
  ScanLine,
  Settings,
  Tag,
  Target,
  Users,
} from "lucide-react";

const ICON_PROPS = { size: 18, strokeWidth: 1.6, "aria-hidden": true } as const;

export function IconHome() {
  return <House {...ICON_PROPS} />;
}

export function IconProvas() {
  return <FileText {...ICON_PROPS} />;
}

export function IconNovaProva() {
  return <Plus {...ICON_PROPS} />;
}

export function IconAtividade() {
  return <ClipboardCheck {...ICON_PROPS} />;
}

export function IconPlano() {
  return <CalendarCheck {...ICON_PROPS} />;
}

export function IconBiblioteca() {
  return <Book {...ICON_PROPS} />;
}

export function IconQuestoes() {
  return <Layers {...ICON_PROPS} />;
}

export function IconTurma() {
  return <Users {...ICON_PROPS} />;
}

export function IconCorrecao() {
  return <CircleCheck {...ICON_PROPS} />;
}

export function IconDashboard() {
  return <ChartColumn {...ICON_PROPS} />;
}

export function IconTutorIA() {
  return <MessageCircle {...ICON_PROPS} />;
}

export function IconSimulados() {
  return <Target {...ICON_PROPS} />;
}

export function IconPlanoDeEstudos() {
  return <Route {...ICON_PROPS} />;
}

export function IconFlashcards() {
  return <Copy {...ICON_PROPS} />;
}

export function IconEstudoAnimado() {
  return <Gamepad2 {...ICON_PROPS} />;
}

export function IconUsuarios() {
  return <Users {...ICON_PROPS} />;
}

export function IconTenants() {
  return <Building2 {...ICON_PROPS} />;
}

export function IconPlanosAdmin() {
  return <Tag {...ICON_PROPS} />;
}

export function IconConfiguracoes() {
  return <Settings {...ICON_PROPS} />;
}

export function IconScan() {
  return <ScanLine {...ICON_PROPS} />;
}

export function IconChevronDown() {
  return <ChevronDown {...ICON_PROPS} strokeWidth={1.8} />;
}

export function IconMais() {
  return <EllipsisVertical {...ICON_PROPS} strokeWidth={2.4} />;
}
