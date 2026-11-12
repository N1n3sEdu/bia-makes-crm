import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat, Outfit } from "next/font/google";
import "./globals.css";
import { BiaMakesProvider } from "@/context/BiaMakesContext";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://biamakes.netlify.app"),
  title: "Bia Makes — Loja Oficial de Maquiagem & Cosméticos",
  description: "Loja especializada em maquiagem feminina de alta performance — @biamakeoficial_",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-bia-offwhite text-bia-text font-sans antialiased selection:bg-bia-pink selection:text-bia-marsala-dark">
        <BiaMakesProvider>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          {children}
          <CookieConsentBanner />
        </BiaMakesProvider>
      </body>
    </html>
  );
}
