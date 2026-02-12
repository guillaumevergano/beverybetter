import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Be Very Better — Apprends le dev web par la pratique",
  description:
    "Plateforme d'apprentissage basée sur des projets réels. Apprends Next.js et Tailwind CSS avec des cours générés par IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased">
        {children}
      </body>
    </html>
  );
}
