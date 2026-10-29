import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocaleProof | Real Estate Truth & Neighborhood Quality Engine",
  description: "Verify builder marketing claims, audit neighborhood livability, and calculate true pedestrian commute times with AI-powered geospatial data.",
  keywords: [
    "real estate audit", 
    "proptech", 
    "commute verifier", 
    "neighborhood quality", 
    "property investment", 
    "AI real estate"
  ],
  authors: [{ name: "LocaleProof" }],
  openGraph: {
    title: "LocaleProof | Real Estate Truth Engine",
    description: "Don't fall for exaggerated builder claims. Verify real commute times and audit neighborhood quality before you invest.",
    url: "https://localeproof-orpin.vercel.app",
    siteName: "LocaleProof",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocaleProof | Real Estate Truth Engine",
    description: "Verify real commute times and audit neighborhood quality before you invest.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}