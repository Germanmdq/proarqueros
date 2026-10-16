import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Último Bastión — Equipo para arqueros",
  description: "Guantes e indumentaria para arqueros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
