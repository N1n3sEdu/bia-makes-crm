"use client";

import React from "react";
import { MaintenanceLoadingScreen } from "@/components/MaintenanceLoadingScreen";
import { useBiaMakes } from "@/context/BiaMakesContext";

export default function MaintenancePage() {
  const { maintenanceMessage, isAdminAuthenticated, setMaintenanceMode } = useBiaMakes();

  return (
    <MaintenanceLoadingScreen
      variant="maintenance"
      customMessage={maintenanceMessage}
      isAdmin={isAdminAuthenticated}
      onDeactivateMaintenance={() => setMaintenanceMode(false)}
      onRetry={() => {
        window.location.href = "/";
      }}
    />
  );
}
