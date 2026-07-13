import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./tailwind.css";

// As variáveis expõem a *fonte-fonte* (--font-inter*); os tokens de uso
// (--font-body/--font-display no globals.css e --font-sans/--font-display
// no @theme do tailwind.css) referenciam estas — evita colisão de nomes
// com os namespaces --font-* do Tailwind v4.
const interBody = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interDisplay = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const description =
  "Provas, atividades, turmas, correção e tutor de IA para o aluno — Professor e Aluno numa única plataforma.";

export const metadata: Metadata = {
  title: {
    default: "MSY Academy — Ensinar e estudar com IA",
    template: "%s · MSY Academy",
  },
  description,
  openGraph: {
    title: "MSY Academy — Ensinar e estudar com IA",
    description,
    siteName: "MSY Academy",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8f6" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies the saved theme + sidebar collapsed state before paint so there's
 * no flash of the wrong value on load — same reasoning for both (hand-rolled
 * instead of a dependency, reads localStorage directly since neither has a
 * server-rendering dependency here). Theme falls back to the OS preference,
 * then dark; sidebar falls back to expanded.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
  try {
    var sidebar = localStorage.getItem("sidebar-collapsed") === "true" ? "collapsed" : "expanded";
    document.documentElement.setAttribute("data-sidebar", sidebar);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${interBody.variable} ${interDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
