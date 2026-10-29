import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocaleProof | AI Real Estate Truth Engine & Neighborhood Audit",
  description: "Verify builder marketing claims with real pedestrian commute routing and AI-powered neighborhood quality audits. Get true livability scores before you invest.",
  keywords: [
    "real estate verification", 
    "neighborhood audit", 
    "commute verifier", 
    "property check India", 
    "livability score", 
    "real estate AI data"
  ],
  openGraph: {
    title: "LocaleProof | Real Estate Truth Engine",
    description: "Expose ad claims vs. actual walking commutes.",
    type: "website",
  },
  verification: {
    google: "cVXg6Zj2QY_2xwnIbVg9JSXUXSMv9M0PLJzpMkVaJE8", // We will get this in Step 4
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}