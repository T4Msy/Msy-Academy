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
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

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
      </head>
      <body>{children}</body>
    </html>
  );
}
