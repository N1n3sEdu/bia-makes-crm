import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BiaMakesProvider } from "@/context/BiaMakesContext";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";

export const metadata: Metadata = {
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
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300..800;1,300..800&family=Outfit:wght@300..800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-[#FAF7F8] text-[#39313A] antialiased selection:bg-[#F5DDE5] selection:text-[#7A3F51]">
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
