"use client";

import React from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  Calendar, 
  Layers, 
  ExternalLink,
  ArrowUpRight,
  ShieldAlert,
  Zap
} from "lucide-react";
import { Product, Order, FinancialMetric, MarketplaceChannel } from "@/types";
import { formatCurrency, getDaysUntil, formatDateShort } from "@/lib/utils";

interface CrmDashboardProps {
  products: Product[];
  orders: Order[];
  financial: FinancialMetric;
  channels: MarketplaceChannel[];
  onNavigateTab: (tab: string) => void;
}

export function CrmDashboard({
  products,
  orders,
  financial,
  channels,
  onNavigateTab,
}: CrmDashboardProps) {
  // Low stock products
  const lowStockProducts = products.filter(
    (p) => (p.physicalStock - p.reservedStock) <= p.minStock
  );

  // Expiring products (ANVISA cosmetic compliance: < 90 days)
  const expiringProducts = products.filter((p) => {
    const days = getDaysUntil(p.expiryDate);
    return days >= 0 && days <= 90;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#FAF0F4] via-[#F5DDE5] to-[#EDE5F3] p-6 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[#9C5B6F] text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-[#C69A76]" />
            Visão Geral em Tempo Real
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#39313A]">
            Painel Central — Bia Makes ERP & CRM
          </h1>
          <p className="text-xs sm:text-sm text-[#39313A]/70 mt-1">
            Gestão unificada de estoque central, vendas multicanal e rentabilidade líquida da loja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab("products")}
            className="px-4 py-2.5 bg-[#9C5B6F] hover:bg-[#7A3F51] text-white rounded-full text-xs font-semibold shadow-md transition-all flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>+ Cadastrar Produto</span>
          </button>
          <button
            onClick={() => onNavigateTab("import")}
            className="px-4 py-2.5 bg-white border border-[#E9D9CD] hover:border-[#C69A76] text-[#7A3F51] rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Importar Planilha</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Faturamento Bruto */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD]/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#39313A]/70 uppercase tracking-wider">
              Faturamento Bruto
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#F5DDE5] flex items-center justify-center text-[#9C5B6F]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#7A3F51]">
              {formatCurrency(financial.grossRevenue)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs mês anterior</span>
            </div>
          </div>
        </div>

        {/* Lucro Líquido Real */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD]/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#39313A]/70 uppercase tracking-wider">
              Lucro Líquido Real
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#EDE5F3] flex items-center justify-center text-purple-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#39313A]">
              {formatCurrency(financial.netProfit)}
            </div>
            <div className="text-[11px] text-[#C69A76] font-semibold mt-1">
              Margem Líquida: <strong>{financial.profitMargin}%</strong>
            </div>
          </div>
        </div>

        {/* Pedidos Multicanal */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD]/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#39313A]/70 uppercase tracking-wider">
              Pedidos Processados
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#F4ECE6] flex items-center justify-center text-[#C69A76]">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#39313A]">
              {financial.ordersCount}
            </div>
            <div className="text-[11px] text-[#39313A]/60 mt-1">
              Ticket Médio: <strong>{formatCurrency(financial.averageTicket)}</strong>
            </div>
          </div>
        </div>

        {/* Alertas de Estoque & Validade */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD]/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#39313A]/70 uppercase tracking-wider">
              Alertas de Atenção
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-amber-600">
              {lowStockProducts.length + expiringProducts.length}
            </div>
            <div className="text-[11px] text-amber-700/80 font-medium mt-1">
              {lowStockProducts.length} estoque baixo • {expiringProducts.length} lote a vencer
            </div>
          </div>
        </div>

      </div>

      {/* COMPLIANCE & SAFETY ALERTS SECTION */}
      {(lowStockProducts.length > 0 || expiringProducts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Estoque Crítico */}
          {lowStockProducts.length > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 p-5 rounded-3xl">
              <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span>Produtos com Estoque Crítico (Ponto de Reposição)</span>
              </div>
              <div className="space-y-2">
                {lowStockProducts.map((p) => {
                  const available = p.physicalStock - p.reservedStock;
                  return (
                    <div 
                      key={p.id}
                      className="bg-white p-3 rounded-2xl border border-rose-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#39313A]">{p.name}</div>
                        <div className="text-[10px] text-gray-500">SKU: {p.sku} • Mínimo: {p.minStock} un</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          {available} un disponíveis
                        </span>
                        <button
                          onClick={() => onNavigateTab("stock")}
                          className="block text-[10px] text-[#9C5B6F] font-bold mt-1 hover:underline"
                        >
                          Repor Estoque &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Validade ANVISA Cosméticos */}
          {expiringProducts.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-3xl">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-3">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Alerta ANVISA: Lotes com Vencimento &lt; 90 Dias</span>
              </div>
              <div className="space-y-2">
                {expiringProducts.map((p) => {
                  const days = getDaysUntil(p.expiryDate);
                  return (
                    <div 
                      key={p.id}
                      className="bg-white p-3 rounded-2xl border border-amber-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#39313A]">{p.name}</div>
                        <div className="text-[10px] text-gray-500">
                          Lote: <strong>{p.batch}</strong> • Validade: {formatDateShort(p.expiryDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          {days} dias restantes
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">Priorizar queima/promoção</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* CHANNELS STATUS & RECENT ORDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Marketplace Channels Status (Col 5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E9D9CD]/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-medium text-[#39313A]">
              Canais & Marketplaces
            </h3>
            <button
              onClick={() => onNavigateTab("marketplaces")}
              className="text-xs text-[#9C5B6F] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Gerenciar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {channels.map((chan) => (
              <div 
                key={chan.id}
                className="p-3.5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: chan.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-[#39313A]">{chan.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {chan.accountName} • Taxa: {chan.feePercentage}%
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    chan.status === 'CONECTADO' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : chan.status === 'SINCRONIZANDO'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {chan.status}
                  </span>
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    {chan.activeAds} anúncios
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Multichannel Orders (Col 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E9D9CD]/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-medium text-[#39313A]">
              Últimas Vendas & Pedidos
            </h3>
            <button
              onClick={() => onNavigateTab("orders")}
              className="text-xs text-[#9C5B6F] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Ver Todos ({orders.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E9D9CD] text-[#39313A]/60">
                  <th className="pb-2 font-semibold">Nº Pedido</th>
                  <th className="pb-2 font-semibold">Canal</th>
                  <th className="pb-2 font-semibold">Cliente</th>
                  <th className="pb-2 font-semibold">Total</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9D9CD]/40">
                {orders.slice(0, 5).map((order) => {
                  const isRefunded = order.status === 'DEVOLUCAO' || order.status === 'CANCELADO';
                  return (
                    <tr key={order.id} className={`hover:bg-[#FAF7F8] transition-colors ${isRefunded ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3 font-semibold text-[#7A3F51]">
                        {order.orderNumber}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-[#F5DDE5]/80 text-[#7A3F51] rounded-md text-[10px] font-semibold">
                          {order.channel.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-[#39313A]">{order.customerName}</td>
                      <td className="py-3">
                        <span className={`font-bold ${
                          isRefunded
                            ? 'line-through decoration-2 decoration-red-600 text-red-600'
                            : 'text-[#39313A]'
                        }`}>
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isRefunded
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : order.status === 'CONCLUIDO' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : order.status === 'ENVIADO'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'SEPARACAO'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {order.status === 'DEVOLUCAO' ? 'DEVOLUÇÃO' : order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
