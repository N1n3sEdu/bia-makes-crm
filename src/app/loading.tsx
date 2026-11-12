import { MaintenanceLoadingScreen } from "@/components/MaintenanceLoadingScreen";

export default function Loading() {
  return (
    <MaintenanceLoadingScreen
      variant="loading"
      title="Carregando o Universo Bia Makes..."
      customMessage="Estamos preparando o catálogo oficial, novidades exclusivas e promoções para você."
    />
  );
}
