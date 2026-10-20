import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./brand.css";

const sanFrancisco = localFont({
  src: [
    { path: "../../public/fonts/san-francisco/SF-Pro-Text-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/san-francisco/SF-Pro-Text-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/san-francisco/SF-Pro-Text-Semibold.otf", weight: "600", style: "normal" },
    { path: "../../public/fonts/san-francisco/SF-Pro-Text-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/fonts/san-francisco/SF-Pro-Text-Heavy.otf", weight: "800 900", style: "normal" },
  ],
  variable: "--font-san-francisco",
  display: "swap",
  preload: true,
});

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
    <html lang="es" className={sanFrancisco.variable}>
      <body>{children}</body>
    </html>
  );
}
