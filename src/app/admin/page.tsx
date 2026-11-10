"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { CrmDashboard } from "@/components/crm/CrmDashboard";
import { ProductsManager } from "@/components/crm/ProductsManager";
import { StockManager } from "@/components/crm/StockManager";
import { OrdersManager } from "@/components/crm/OrdersManager";
import { MarketplacesManager } from "@/components/crm/MarketplacesManager";
import { FinancialManager } from "@/components/crm/FinancialManager";
import { ImportExportManager } from "@/components/crm/ImportExportManager";
import { UsersManager } from "@/components/crm/UsersManager";
import { useBiaMakes } from "@/context/BiaMakesContext";
import AdminLoginPage from "./login/page";
import { UserRole } from "@/types";

import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ShoppingCart, 
  Globe, 
  DollarSign, 
  FileSpreadsheet,
  Users
} from "lucide-react";

const ROLE_ALLOWED_TABS: Record<UserRole, string[]> = {
  ADMIN: ["dashboard", "products", "stock", "orders", "marketplaces", "financial", "import", "users"],
  GERENTE: ["dashboard", "products", "stock", "orders", "marketplaces", "import"],
  ESTOQUE: ["products", "stock", "import"],
  VENDAS: ["dashboard", "products", "orders"],
  FINANCEIRO: ["dashboard", "orders", "financial"],
};

export default function AdminPage() {
  const router = useRouter();
  const {
    products,
    movements,
    orders,
    channels,
    financial,
    users,
    cart,
    isAdminAuthenticated,
    adminUser,
    logoutAdmin,
    addUser,
    updateUser,
    deleteUser,
    addProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    addMovement,
    updateProductStock,
    updateOrderStatus,
    syncChannel,
    updateChannel,
  } = useBiaMakes();

  const allowedTabs = ROLE_ALLOWED_TABS[adminUser?.role || "ADMIN"] || ROLE_ALLOWED_TABS.ADMIN;
  const [crmActiveTab, setCrmActiveTab] = useState<string>(allowedTabs[0] || "dashboard");

  useEffect(() => {
    if (!allowedTabs.includes(crmActiveTab)) {
      setCrmActiveTab(allowedTabs[0] || "dashboard");
    }
  }, [adminUser, allowedTabs, crmActiveTab]);

  // Protect Admin Route: If not logged in, render Admin Login screen
  if (!isAdminAuthenticated) {
    return <AdminLoginPage />;
  }

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F8]">
      {/* Exclusive Admin Header */}
      <Navigation
        variant="admin"
        cartCount={totalCartItems}
        isAdminAuthenticated={isAdminAuthenticated}
        adminUser={adminUser}
        onLogoutAdmin={() => {
          logoutAdmin();
          router.push("/admin/login");
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* CRM Tab Navigation (Filtered by User Profile/Role) */}
        <div className="bg-white p-2 rounded-3xl border border-[#E9D9CD] shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-none">
          {allowedTabs.includes("dashboard") && (
            <button
              onClick={() => setCrmActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                crmActiveTab === "dashboard"
                  ? "bg-[#9C5B6F] text-white shadow-md"
                  : "text-[#39313A] hover:bg-[#F5DDE5]/40"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          )}

          {allowedTabs.includes("products") && (
            <button
              onClick={() => setCrmActiveTab("products")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                crmActiveTab === "products"
                  ? "bg-[#9C5B6F] text-white shadow-md"
                  : "text-[#39313A] hover:bg-[#F5DDE5]/40"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Produtos, Frete & Redes</span>
            </button>
          )}

          {allowedTabs.includes("stock") && (
            <button
              onClick={() => setCrmActiveTab("stock")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                crmActiveTab === "stock"
                  ? "bg-[#9C5B6F] text-white shadow-md"
                  : "text-[#39313A] hover:bg-[#F5DDE5]/40"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Estoque Central (Kardex)</span>
            </button>
          )}

          {allowedTabs.includes("orders") && (
            <button
              onClick={() => setCrmActiveTab("orders")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                crmActiveTab === "orders"
                  ? "bg-[#9C5B6F] text-white shadow-md"
                  : "text-[#39313A] hover:bg-[#F5DDE5]/40"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Pedidos & Vendas ({orders.length})</span>
            </button>
          )}

          {allowedTabs.includes("marketplaces") && (
            <button
              onClick={() => setCrmActiveTab("marketplaces")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                crmActiveTab === "marketplaces"
                  ? "bg-[#9C5B6F] text-white shadow-md"
                  : "text-[#39313A] hover:bg-[#F5DDE5]/40"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Marketplaces</span>
            </button>
          )}

          {allowedTabs.includes("financial") && (
            <button
              onClick={() => setCrmActiveTab("financial")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                crmActiveTab === "financial"
                  ? "bg-[#9C5B6F] text-white shadow-md"
                  : "text-[#39313A] hover:bg-[#F5DDE5]/40"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Financeiro (DRE)</span>
            </button>
          )}

          {allowedTabs.includes("import") && (
            <button
              onClick={() => setCrmActiveTab("import")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                crmActiveTab === "import"
                  ? "bg-[#9C5B6F] text-white shadow-md"
                  : "text-[#39313A] hover:bg-[#F5DDE5]/40"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar Planilhas</span>
            </button>
          )}

          {allowedTabs.includes("users") && (
            <button
              onClick={() => setCrmActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                crmActiveTab === "users"
                  ? "bg-[#9C5B6F] text-white shadow-md"
                  : "text-[#39313A] hover:bg-[#F5DDE5]/40"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuários & Perfis</span>
            </button>
          )}
        </div>

        {/* Active Module Content */}
        {crmActiveTab === "dashboard" && (
          <CrmDashboard
            products={products}
            orders={orders}
            financial={financial}
            channels={channels}
            onNavigateTab={(tab) => setCrmActiveTab(tab)}
          />
        )}

        {crmActiveTab === "products" && (
          <ProductsManager
            products={products}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
        )}

        {crmActiveTab === "stock" && (
          <StockManager
            products={products}
            movements={movements}
            onAddMovement={addMovement}
            onUpdateProductStock={updateProductStock}
          />
        )}

        {crmActiveTab === "orders" && (
          <OrdersManager
            orders={orders}
            onUpdateOrderStatus={updateOrderStatus}
          />
        )}

        {crmActiveTab === "marketplaces" && (
          <MarketplacesManager
            channels={channels}
            onSyncChannel={syncChannel}
            onUpdateChannel={updateChannel}
          />
        )}

        {crmActiveTab === "financial" && (
          <FinancialManager
            financial={financial}
            channels={channels}
            orders={orders}
          />
        )}

        {crmActiveTab === "import" && (
          <ImportExportManager
            products={products}
            onImportProducts={importProducts}
          />
        )}

        {crmActiveTab === "users" && (
          <UsersManager
            users={users}
            currentAdmin={adminUser}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        )}

      </main>
    </div>
  );
}
