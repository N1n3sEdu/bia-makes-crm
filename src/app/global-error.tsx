"use client";

import React, { useEffect } from "react";
import { MaintenanceLoadingScreen } from "@/components/MaintenanceLoadingScreen";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro global capturado:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#FAF7F8] font-sans antialiased">
        <MaintenanceLoadingScreen
          variant="updating"
          title="Voltamos Já!"
          customMessage="Estamos realizando atualizações técnicas no site da Bia Makes para trazer o melhor em maquiagens e alta performance. Já estamos voltando!"
          onRetry={() => reset()}
        />
      </body>
    </html>
  );
}
