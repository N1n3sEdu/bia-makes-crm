"use client";

import React from "react";
import { Navigation } from "@/components/Navigation";
import { Storefront } from "@/components/storefront/Storefront";
import { useBiaMakes } from "@/context/BiaMakesContext";

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
  } = useBiaMakes();

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F8]">
      {/* Customer Storefront Header (CRM is hidden for regular customers) */}
      <Navigation
        variant="storefront"
        cartCount={totalCartItems}
        onOpenCart={() => setIsCartOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
        adminUser={adminUser}
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
          onCloseCart={() => setIsCartOpen(false)}
        />
      </main>
    </div>
  );
}
