import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SattaGPT - Indian Political Debate Simulator",
  description:
    "Watch AI agents debate hot Indian political topics in real-time with live voting and analytics",
  keywords: [
    "AI debate",
    "Indian politics",
    "political simulation",
    "live voting",
    "debate analytics",
  ],
  authors: [{ name: "SattaGPT Team" }],
  openGraph: {
    title: "SattaGPT - Indian Political Debate Simulator",
    description:
      "Watch AI agents debate hot Indian political topics in real-time with live voting and analytics",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "SattaGPT - Indian Political Debate Simulator",
    description:
      "Watch AI agents debate hot Indian political topics in real-time with live voting and analytics",
  },
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
