import type { Metadata } from "next";
import { Cormorant_Garamond, Syncopate } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const display = Syncopate({
  variable: "--font-display",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vitrine — Exceptional art. An extraordinary collection.",
  description:
    "Premium art collection software for collectors. Catalog your works, preserve provenance, track condition, and build a lasting legacy. Available by invitation.",
  openGraph: {
    title: "Vitrine",
    description: "Exceptional art. An extraordinary collection. Art collection software for those who see more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
