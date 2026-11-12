"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Storefront } from "@/components/storefront/Storefront";
import { MaintenanceLoadingScreen } from "@/components/MaintenanceLoadingScreen";
import { useBiaMakes } from "@/context/BiaMakesContext";
import { ProductCategory } from "@/types";
import { AlertTriangle, Power } from "lucide-react";

export default function Home() {
  const {
    products,
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    isAdminAuthenticated,
    adminUser,
    isMaintenanceMode,
    maintenanceMessage,
    setMaintenanceMode,
    isSystemOffline,
  } = useBiaMakes();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Todos'>('Todos');
  const [adminBypassView, setAdminBypassView] = useState(false);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // 1. Queda de Conexão com a Internet (Offline)
  if (isSystemOffline) {
    return (
      <MaintenanceLoadingScreen
        variant="offline"
        isAdmin={isAdminAuthenticated}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // 2. Modo Manutenção / Atualização Ativo
  if (isMaintenanceMode) {
    // Se for cliente comum ou se o admin optar por ver a tela de manutenção
    if (!isAdminAuthenticated || !adminBypassView) {
      return (
        <MaintenanceLoadingScreen
          variant="maintenance"
          customMessage={maintenanceMessage}
          isAdmin={isAdminAuthenticated}
          onDeactivateMaintenance={() => setMaintenanceMode(false)}
          onRetry={() => {
            if (isAdminAuthenticated) {
              setAdminBypassView(true);
            } else {
              window.location.reload();
            }
          }}
        />
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F8]">
      {/* Banner de aviso para o Administrador quando a manutenção estiver ativa */}
      {isMaintenanceMode && isAdminAuthenticated && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-950 animate-pulse" />
            <span>
              Atenção: O Modo Manutenção está ATIVO! Clientes comuns veem a tela &quot;Voltamos Já!&quot;. Você está navegando em prévia de administrador.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminBypassView(false)}
              className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              Ver Tela &quot;Voltamos Já!&quot;
            </button>
            <button
              type="button"
              onClick={() => setMaintenanceMode(false)}
              className="px-3 py-1 rounded-full bg-white text-amber-900 hover:bg-amber-100 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Desativar Manutenção</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Storefront Header (CRM is hidden for regular customers) */}
      <Navigation
        variant="storefront"
        cartCount={totalCartItems}
        onOpenCart={() => setIsCartOpen(true)}
        adminUser={adminUser}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Storefront View (B2C Loja Virtual) */}
      <main className="flex-1">
        <Storefront
          products={products}
          cart={cart}
          onAddToCart={addToCart}
          onUpdateCartQuantity={updateCartQuantity}
          onRemoveFromCart={removeFromCart}
          isCartOpen={isCartOpen}
          onOpenCart={() => setIsCartOpen(true)}
          onCloseCart={() => setIsCartOpen(false)}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </main>
    </div>
  );
}
