import type { Metadata, Viewport } from "next";
import "./globals.css";

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
 * Applies the saved theme before paint so there's no flash of the wrong
 * theme on load — same reasoning as any dark/light toggle, hand-rolled
 * (15 lines) instead of a dependency. Reads localStorage directly (no
 * cookie) since theme has no server-rendering dependency here; falls back
 * to the OS preference, then dark (the current default).
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
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
