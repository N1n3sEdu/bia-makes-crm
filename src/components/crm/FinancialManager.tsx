"use client";

import React, { useState, useMemo } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle,
  Percent,
  FileSpreadsheet,
  Calendar,
  Layers,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  Store,
  RefreshCw,
  Clock
} from "lucide-react";
import { FinancialMetric, MarketplaceChannel, Order, ChannelType } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FinancialManagerProps {
  financial: FinancialMetric;
  channels: MarketplaceChannel[];
  orders?: Order[];
}

export function FinancialManager({
  financial,
  channels,
  orders = [],
}: FinancialManagerProps) {
  // Gross Profit calculation
  const grossProfit = financial.grossRevenue - financial.marketplaceFees - financial.cmv;
  const grossMargin = ((grossProfit / financial.grossRevenue) * 100).toFixed(1);

  // Porcentagens para composição e gráfico de pizza / rosca
  const netProfitPct = Math.round((financial.netProfit / financial.grossRevenue) * 1000) / 10;
  const deductionsVal = financial.grossRevenue - financial.netProfit;
  const deductionsPct = Math.round((deductionsVal / financial.grossRevenue) * 1000) / 10;

  // Quebra detalhada de custos
  const cmvPct = Math.round((financial.cmv / financial.grossRevenue) * 1000) / 10;
  const feesPct = Math.round((financial.marketplaceFees / financial.grossRevenue) * 1000) / 10;
  const opexPct = Math.round((financial.operatingExpenses / financial.grossRevenue) * 1000) / 10;

  // Coordenadas para SVG Donut / Pizza (raio = 50, circunferência = 2 * PI * 50 = 314.159)
  const circumference = 2 * Math.PI * 50;
  const strokeDashNet = (netProfitPct / 100) * circumference;
  const strokeDashRest = circumference - strokeDashNet;

  // CÁLCULO AUTOMÁTICO DE ONDE ESTÃO SAINDO AS VENDAS (CANAIS / REDES / MARKETPLACES)
  const salesByChannel = useMemo(() => {
    // Totais padrão consolidados caso haja ou não pedidos simulados em memória
    const channelStats: Record<string, { label: string; count: number; total: number; color: string; icon: string }> = {
      SITE: { label: "Site Bia Makes (Loja Própria)", count: 184, total: 21900, color: "#7A3F51", icon: "site" },
      INSTAGRAM: { label: "Instagram Shopping / Direct", count: 72, total: 8650, color: "#E1306C", icon: "instagram" },
      FACEBOOK: { label: "Facebook Loja / Meta", count: 31, total: 3450, color: "#1877F2", icon: "facebook" },
      WHATSAPP: { label: "WhatsApp Vendas VIP", count: 28, total: 3340, color: "#25D366", icon: "whatsapp" },
      MERCADO_LIVRE: { label: "Mercado Livre", count: 45, total: 5740, color: "#EAB308", icon: "mercadolivre" },
      SHOPEE: { label: "Shopee", count: 36, total: 4220, color: "#F97316", icon: "shopee" },
      TIKTOK: { label: "TikTok Shop", count: 16, total: 1650, color: "#EC4899", icon: "tiktok" },
    };

    // Ajusta dinamicamente com pedidos reais do sistema (removendo devoluções e cancelamentos)
    const initialOrderIds = new Set(['ord-1001', 'ord-1002', 'ord-1003', 'ord-1004']);
    orders.forEach((order) => {
      const chKey = order.channel;
      const isRefunded = order.status === 'DEVOLUCAO' || order.status === 'CANCELADO';
      const isInitial = initialOrderIds.has(order.id);

      if (isRefunded && isInitial) {
        if (channelStats[chKey]) {
          channelStats[chKey].count = Math.max(0, channelStats[chKey].count - 1);
          channelStats[chKey].total = Math.max(0, channelStats[chKey].total - order.totalAmount);
        }
      } else if (!isRefunded && !isInitial) {
        if (channelStats[chKey]) {
          channelStats[chKey].count += 1;
          channelStats[chKey].total += order.totalAmount;
        } else {
          channelStats[chKey] = {
            label: chKey.replace("_", " "),
            count: 1,
            total: order.totalAmount,
            color: "#9C5B6F",
            icon: "store"
          };
        }
      }
    });

    const list = Object.entries(channelStats).map(([key, data]) => ({
      key,
      ...data,
    }));

    // Ordenar do maior para o menor faturamento
    list.sort((a, b) => b.total - a.total);
    return list;
  }, [orders]);

  const totalSalesFromChannels = salesByChannel.reduce((acc, curr) => acc + curr.total, 0);

  // Helper para ícones dos canais de venda
  const renderChannelIcon = (icon: string) => {
    switch (icon) {
      case "instagram":
        return <Instagram className="w-4 h-4 text-[#E1306C]" />;
      case "facebook":
        return <Facebook className="w-4 h-4 text-[#1877F2]" />;
      case "whatsapp":
        return <MessageCircle className="w-4 h-4 text-[#25D366]" />;
      case "mercadolivre":
      case "shopee":
      case "tiktok":
      case "site":
      default:
        return <Store className="w-4 h-4 text-[#7A3F51]" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#39313A]">
            Gestão Financeira & DRE Gerencial
          </h2>
          <p className="text-xs text-[#39313A]/70 mt-0.5">
            Cálculo de faturamento, custo de mercadorias (CMV), taxas de marketplaces, despesas e lucro líquido real.
          </p>
        </div>
      </div>

      {/* GRÁFICO HORIZONTAL EM FORMATO DE PIZZA / ROSCA ACIMA DOS 3 FATURAMENTOS */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Lado Esquerdo: Título e Gráfico Circular (Pizza/Donut) */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
            {/* SVG Donut / Pizza Chart */}
            <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
                {/* Círculo de Fundo: Faturamento Total / Custos Deduzidos */}
                <circle
                  cx="65"
                  cy="65"
                  r="50"
                  fill="transparent"
                  stroke="#7A3F51"
                  strokeWidth="22"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Arco do Lucro Líquido Real */}
                <circle
                  cx="65"
                  cy="65"
                  r="50"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="22"
                  strokeDasharray={`${strokeDashNet} ${strokeDashRest}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Centro da Pizza */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Margem</span>
                <span className="text-2xl font-extrabold text-emerald-700 leading-none mt-0.5">
                  {financial.profitMargin}%
                </span>
                <span className="text-[10px] text-emerald-800 font-medium mt-1">Lucro Real</span>
              </div>
            </div>

            {/* Explicação e Título do Gráfico */}
            <div className="text-center sm:text-left space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0F4] text-[#9C5B6F] text-xs font-semibold">
                <PieChart className="w-3.5 h-3.5 text-[#C69A76]" />
                Distribuição Proporcional da Receita
              </div>
              <h3 className="font-serif text-xl font-medium text-[#39313A]">
                Faturamento Bruto vs Lucro Líquido
              </h3>
              <p className="text-xs text-[#39313A]/70 max-w-sm">
                Visualização em pizza demonstrando a fatia retida como lucro real após a dedução de custos e comissões.
              </p>
            </div>
          </div>

          {/* Lado Direito: Barras Horizontais e Legenda Proporcional */}
          <div className="w-full lg:flex-1 max-w-xl space-y-4 bg-[#FAF7F8]/80 p-5 rounded-2xl border border-[#E9D9CD]/70">
            {/* Barra 1: Faturamento Bruto (100%) */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#7A3F51]"></span>
                  <span className="font-semibold text-[#39313A]">Faturamento Bruto</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#7A3F51]">{formatCurrency(financial.grossRevenue)}</span>
                  <span className="text-[10px] text-gray-500 font-medium bg-white px-2 py-0.5 rounded-md border border-[#E9D9CD]">100%</span>
                </div>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-gradient-to-r from-[#7A3F51] to-[#9C5B6F] rounded-full w-full"></div>
              </div>
            </div>

            {/* Barra 2: Lucro Líquido Real */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-emerald-900">Lucro Líquido Real</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-700">{formatCurrency(financial.netProfit)}</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {netProfitPct}%
                  </span>
                </div>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${netProfitPct}%` }}
                ></div>
              </div>
            </div>

            {/* Detalhamento horizontal dos custos que formam a diferença */}
            <div className="pt-2 border-t border-[#E9D9CD]/60 grid grid-cols-3 gap-2 text-[11px] text-center">
              <div className="bg-white p-2 rounded-xl border border-[#E9D9CD]/80">
                <span className="text-gray-500 block text-[10px]">CMV (Produtos)</span>
                <span className="font-bold text-rose-700">{cmvPct}%</span>
                <span className="text-[9px] text-gray-400 block">{formatCurrency(financial.cmv)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E9D9CD]/80">
                <span className="text-gray-500 block text-[10px]">Comissões Marketplaces</span>
                <span className="font-bold text-rose-700">{feesPct}%</span>
                <span className="text-[9px] text-gray-400 block">{formatCurrency(financial.marketplaceFees)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E9D9CD]/80">
                <span className="text-gray-500 block text-[10px]">Despesas Operacionais</span>
                <span className="font-bold text-rose-700">{opexPct}%</span>
                <span className="text-[9px] text-gray-400 block">{formatCurrency(financial.operatingExpenses)}</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Top 3 High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            Faturamento Bruto (Líquido de Devoluções)
          </div>
          <div className="text-3xl font-bold text-[#7A3F51] mt-2">
            {formatCurrency(financial.grossRevenue)}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>{financial.ordersCount} pedidos faturados</span>
            {(financial.refundedAmount || 0) > 0 && (
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Estornado: <span className="line-through decoration-2 decoration-red-600">{formatCurrency(financial.refundedAmount || 0)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            Comissões de Marketplaces
          </div>
          <div className="text-3xl font-bold text-rose-600 mt-2">
            -{formatCurrency(financial.marketplaceFees)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Média de 14.7% de taxa por canal
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            Lucro Líquido Real
          </div>
          <div className="text-3xl font-bold text-emerald-700 mt-2">
            {formatCurrency(financial.netProfit)}
          </div>
          <div className="text-xs text-emerald-800 font-semibold mt-1">
            Margem Líquida Final: {financial.profitMargin}%
          </div>
        </div>

      </div>

      {/* ORIGEM DAS VENDAS & CANAIS DE AQUISIÇÃO (INSTAGRAM, FACEBOOK, WHATSAPP, SITE, MARKETPLACES) */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E9D9CD]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FAF0F4] text-[#7A3F51] flex items-center justify-center border border-[#E9D9CD]">
              <Globe className="w-5 h-5 text-[#9C5B6F]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#39313A]">
                Origem das Vendas & Canais de Compras
              </h3>
              <p className="text-xs text-[#39313A]/70">
                Acompanhamento em tempo real de onde os clientes estão comprando (Redes Sociais, Site e Marketplaces)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-[#FAF7F8] px-3 py-1.5 rounded-full border border-[#E9D9CD] text-[#7A3F51] font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C69A76]" />
            Sincronização Ativa
          </div>
        </div>

        {/* Grid de Canais de Venda e Origens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {salesByChannel.map((ch) => {
            const channelShare = ((ch.total / totalSalesFromChannels) * 100).toFixed(1);

            return (
              <div 
                key={ch.key}
                className="bg-[#FAF7F8]/80 hover:bg-white transition-all p-4 rounded-2xl border border-[#E9D9CD]/70 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white border border-[#E9D9CD] shadow-sm">
                        {renderChannelIcon(ch.icon)}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#39313A] block line-clamp-1">
                          {ch.label}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {ch.count} pedidos realizados
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-lg font-bold text-[#7A3F51]">
                    {formatCurrency(ch.total)}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E9D9CD]/50">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-gray-500 mb-1">
                    <span>Participação nas Vendas</span>
                    <span className="text-[#7A3F51]">{channelShare}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${channelShare}%`, 
                        backgroundColor: ch.color 
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fluxo de Compras Recentes / Pedidos Recentes com Identificação de Origem */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#39313A] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C69A76]" />
              Últimas Compras Realizadas por Canal
            </h4>
            <span className="text-[11px] text-gray-500">
              Ajustado automaticamente conforme novas vendas entram
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-[#39313A]/70 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Pedido</th>
                  <th className="py-2.5 px-3">Origem da Compra</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9D9CD]/40">
                {orders.slice(0, 8).map((ord) => {
                  const channelInfo = salesByChannel.find((c) => c.key === ord.channel);
                  const isRefunded = ord.status === 'DEVOLUCAO' || ord.status === 'CANCELADO';

                  return (
                    <tr key={ord.id} className={`hover:bg-[#FAF7F8]/50 ${isRefunded ? 'bg-red-50/30' : ''}`}>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#7A3F51]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white border border-[#E9D9CD] shadow-sm"
                        >
                          {renderChannelIcon(channelInfo?.icon || 'store')}
                          <span>{channelInfo?.label || ord.channel}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#39313A]">
                        {ord.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-[11px]">
                        {formatDate(ord.createdAt)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isRefunded
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : ord.status === 'CONCLUIDO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'ENVIADO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status === 'DEVOLUCAO' ? 'DEVOLUÇÃO' : ord.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-bold ${
                          isRefunded
                            ? 'line-through decoration-2 decoration-red-600 text-red-600'
                            : 'text-emerald-700'
                        }`}>
                          {formatCurrency(ord.totalAmount)}
                        </span>
                        {isRefunded && (
                          <span className="block text-[9px] font-bold text-red-600 uppercase">
                            Removido do Financeiro
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* DETAILED DRE (DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO) */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9D9CD]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#C69A76]" />
            <h3 className="font-serif text-lg font-medium text-[#39313A]">
              DRE Gerencial Consolidado (Mês Vigente)
            </h3>
          </div>
          <span className="text-xs bg-[#FAF0F4] text-[#9C5B6F] px-3 py-1 rounded-full font-bold">
            Competência Mensal
          </span>
        </div>

        <div className="space-y-3 text-xs">
          
          {(financial.refundedAmount || 0) > 0 && (
            <div className="flex justify-between py-2 px-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold">
              <span>(-) Devoluções & Cancelamentos Estornados ({financial.refundedOrdersCount} pedido{(financial.refundedOrdersCount || 0) > 1 ? 's' : ''})</span>
              <span className="line-through decoration-2 decoration-red-600">
                {formatCurrency(financial.refundedAmount || 0)}
              </span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-gray-100 font-bold text-sm text-[#39313A]">
            <span>(+) Receita Operacional Bruta (Líquida de Devoluções)</span>
            <span>{formatCurrency(financial.grossRevenue)}</span>
          </div>

          <div className="flex justify-between py-1.5 text-rose-700 pl-4 border-b border-gray-50">
            <span>(-) Comissões e Taxas de Marketplaces (ML, Shopee, Amazon)</span>
            <span>-{formatCurrency(financial.marketplaceFees)}</span>
          </div>

          <div className="flex justify-between py-1.5 text-rose-700 pl-4 border-b border-gray-50">
            <span>(-) Custo das Mercadorias Vendidas (CMV Cosméticos)</span>
            <span>-{formatCurrency(financial.cmv)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 font-bold text-sm text-[#7A3F51] bg-[#FAF7F8] px-3 rounded-xl">
            <span>(=) Lucro Operacional Bruto</span>
            <span>{formatCurrency(grossProfit)} ({grossMargin}%)</span>
          </div>

          <div className="flex justify-between py-1.5 text-rose-700 pl-4 border-b border-gray-50">
            <span>(-) Despesas Operacionais (Embalagens, Fretes, Ferramentas)</span>
            <span>-{formatCurrency(financial.operatingExpenses)}</span>
          </div>

          <div className="flex justify-between py-3 border-t-2 border-[#7A3F51] font-bold text-base text-emerald-800 bg-emerald-50/60 px-4 rounded-xl mt-4">
            <span>(=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO REAL)</span>
            <span>{formatCurrency(financial.netProfit)}</span>
          </div>

        </div>
      </div>

      {/* CHANNEL RENTABILITY BREAKDOWN */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-medium text-[#39313A]">
          Rentabilidade Comparada por Canal de Venda
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-[#39313A]/70 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Taxa de Comissão</th>
                <th className="py-3 px-4">Vantagem Estratégica</th>
                <th className="py-3 px-4 text-right">Margem Estimada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9D9CD]/40">
              <tr className="hover:bg-[#FAF7F8]/40">
                <td className="py-3 px-4 font-bold text-[#7A3F51]">
                  Loja Virtual Bia Makes (Site Próprio)
                </td>
                <td className="py-3 px-4 text-emerald-700 font-bold">0.99% (PIX Direto)</td>
                <td className="py-3 px-4 text-gray-600">Maior margem, base própria de clientes e fidelização</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-700">54.2%</td>
              </tr>
              <tr className="hover:bg-[#FAF7F8]/40">
                <td className="py-3 px-4 font-bold text-[#39313A]">Mercado Livre</td>
                <td className="py-3 px-4 text-gray-600">16.0%</td>
                <td className="py-3 px-4 text-gray-600">Alto volume de tráfego, entrega rápida Full</td>
                <td className="py-3 px-4 text-right font-bold text-[#39313A]">32.5%</td>
              </tr>
              <tr className="hover:bg-[#FAF7F8]/40">
                <td className="py-3 px-4 font-bold text-[#39313A]">Shopee</td>
                <td className="py-3 px-4 text-gray-600">14.0%</td>
                <td className="py-3 px-4 text-gray-600">Forte conversão em maquiagens e cupons de frete</td>
                <td className="py-3 px-4 text-right font-bold text-[#39313A]">34.8%</td>
              </tr>
              <tr className="hover:bg-[#FAF7F8]/40">
                <td className="py-3 px-4 font-bold text-[#39313A]">TikTok Shop</td>
                <td className="py-3 px-4 text-gray-600">10.0%</td>
                <td className="py-3 px-4 text-gray-600">Vendas ao vivo (Lives de Make) e tutoriais virais</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-700">41.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
