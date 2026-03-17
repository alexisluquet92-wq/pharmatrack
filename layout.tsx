import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PharmaTrack – Gestion des périmés",
  description: "Logiciel SaaS pour prévenir et gérer les pertes sur médicaments périmés en pharmacie.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
