"use client";

import React, { useEffect } from "react";
import { MaintenanceLoadingScreen } from "@/components/MaintenanceLoadingScreen";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado pela tela de atualização/manutenção:", error);
  }, [error]);

  return (
    <MaintenanceLoadingScreen
      variant="updating"
      title="Voltamos Já!"
      customMessage="O site da Bia Makes está passando por uma rápida atualização técnica para trazer uma experiência ainda melhor. Estaremos de volta em instantes!"
      onRetry={() => reset()}
    />
  );
}
