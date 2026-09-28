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
  title: "Vitrine — Every collection deserves a vitrine.",
  description:
    "The private-archive standard for serious art collections. Provenance, condition, and legacy — kept in one quiet room. Invite-only.",
  openGraph: {
    title: "Vitrine",
    description: "Every collection deserves a vitrine.",
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
