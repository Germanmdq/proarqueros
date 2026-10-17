import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";

export const metadata: Metadata = {
  title: "Proarquero — Guantes e indumentaria para arqueros",
  description: "Todos los productos para defender el arco. Guantes, indumentaria, pelotas, accesorios y calzado. Elegí tu modelo y talle en Proarquero.",
  icons: { icon: "/images/proarquero-logo.png" },
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
