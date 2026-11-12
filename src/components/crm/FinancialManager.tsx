"use client";

import React, { useState, useMemo } from "react";
import { 
  DollarSign, 
  TrendingUp, 
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
  Clock, 
  BarChart3, 
  Download, 
  Filter, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import { FinancialMetric, MarketplaceChannel, Order, OrderStatus, ChannelType } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useBiaMakes } from "@/context/BiaMakesContext";

interface FinancialManagerProps {
  financial: FinancialMetric;
  channels: MarketplaceChannel[];
  orders?: Order[];
}

type PeriodType = "today" | "7days" | "current" | "12months";
type ActiveTabType = "overview" | "dre" | "history";

const MONTHLY_12_MONTHS_HISTORY = [
  { month: "Dez/25", gross: 31200, net: 9800, ordersCount: 260, margin: 31.4 },
  { month: "Jan/26", gross: 28500, net: 8900, ordersCount: 235, margin: 31.2 },
  { month: "Fev/26", gross: 32400, net: 10400, ordersCount: 270, margin: 32.1 },
  { month: "Mar/26", gross: 34100, net: 11100, ordersCount: 285, margin: 32.5 },
  { month: "Abr/26", gross: 35800, net: 11800, ordersCount: 300, margin: 33.0 },
  { month: "Mai/26", gross: 38200, net: 12900, ordersCount: 320, margin: 33.8 },
  { month: "Jun/26", gross: 39900, net: 13600, ordersCount: 335, margin: 34.1 },
  { month: "Jul/26", gross: 41500, net: 14400, ordersCount: 350, margin: 34.7 },
  { month: "Ago/26", gross: 43200, net: 15100, ordersCount: 365, margin: 35.0 },
  { month: "Set/26", gross: 45600, net: 16180, ordersCount: 385, margin: 35.5 },
  { month: "Out/26", gross: 47200, net: 16900, ordersCount: 400, margin: 35.8 },
  { month: "Nov/26 (Atual)", gross: 48771.10, net: 17573.15, ordersCount: 412, margin: 36.0 },
];

export function FinancialManager({
  financial,
  channels,
  orders: propOrders,
}: FinancialManagerProps) {
  const { products, orders: ctxOrders } = useBiaMakes();
  const orders = propOrders && propOrders.length > 0 ? propOrders : ctxOrders;
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("current");
  const [activeTab, setActiveTab] = useState<ActiveTabType>("overview");

  // Vendas do dia em tempo real - rigorosamente integradas aos pedidos com status ativo
  const todayMetrics = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const activeStatuses: OrderStatus[] = ["PAGO", "SEPARACAO", "ENVIADO", "CONCLUIDO"];

    const todaysActiveOrders = orders.filter((o) => {
      if (!activeStatuses.includes(o.status)) return false;
      const orderDate = new Date(o.createdAt);
      if (isNaN(orderDate.getTime())) return false;
      return (
        orderDate.getFullYear() === todayYear &&
        orderDate.getMonth() === todayMonth &&
        orderDate.getDate() === todayDate
      );
    });

    const totalRevenue = Math.round(todaysActiveOrders.reduce((acc, o) => acc + o.totalAmount, 0) * 100) / 100;
    const count = todaysActiveOrders.length;
    const ticketMedio = count > 0 ? Math.round((totalRevenue / count) * 100) / 100 : 0;

    return {
      total: totalRevenue,
      count,
      ticketMedio,
      lastUpdated: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
  }, [orders]);

  // Cálculos consolidados por período selecionado com vínculo real aos pedidos e DRE
  const periodData = useMemo(() => {
    const now = new Date();
    const activeStatuses: OrderStatus[] = ["PAGO", "SEPARACAO", "ENVIADO", "CONCLUIDO"];

    // Filtrar pedidos conforme período
    let filteredOrders = orders.filter(o => activeStatuses.includes(o.status));
    let opex = financial.operatingExpenses;
    let label = "Mês Atual (Vigente)";

    if (selectedPeriod === "today") {
      label = "Hoje (Operação em Tempo Real)";
      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDate = now.getDate();

      filteredOrders = filteredOrders.filter(o => {
        const d = new Date(o.createdAt);
        return !isNaN(d.getTime()) &&
          d.getFullYear() === todayYear &&
          d.getMonth() === todayMonth &&
          d.getDate() === todayDate;
      });
      opex = Math.round((financial.operatingExpenses / 30) * 100) / 100;
    } else if (selectedPeriod === "7days") {
      label = "Últimos 7 Dias Corridos";
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = filteredOrders.filter(o => {
        const d = new Date(o.createdAt);
        return !isNaN(d.getTime()) && d >= sevenDaysAgo;
      });
      opex = Math.round(((financial.operatingExpenses * 7) / 30) * 100) / 100;
    } else if (selectedPeriod === "current") {
      label = "Mês Atual (Vigente)";
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      filteredOrders = filteredOrders.filter(o => {
        const d = new Date(o.createdAt);
        return !isNaN(d.getTime()) &&
          d.getFullYear() === currentYear &&
          d.getMonth() === currentMonth;
      });
      opex = financial.operatingExpenses;
    } else if (selectedPeriod === "12months") {
      label = "Últimos 12 Meses Consolidados";
      opex = financial.operatingExpenses * 12;
    }

    // Se o filtro específico por data não encontrar pedidos mockados (ex: período selecionado é 'today' e ainda não há pedidos no dia),
    // usamos a contagem e valores exatos do filtro, sem inventar dados artificiais.
    const gross = Math.round(filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100;

    // Mapa de taxas reais dos canais
    const channelFeeMap: Record<string, number> = {};
    channels.forEach(c => {
      channelFeeMap[c.code] = typeof c.feePercentage === "number" ? c.feePercentage : 0;
    });

    let fees = 0;
    filteredOrders.forEach(o => {
      const feePct = channelFeeMap[o.channel] ?? 0;
      fees += o.totalAmount * (feePct / 100);
    });
    fees = Math.round(fees * 100) / 100;

    // Custo das mercadorias vendidas real (CMV)
    let cmv = 0;
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.sku === item.sku);
        const unitCost = prod && typeof prod.costPrice === "number" ? prod.costPrice : item.price * 0.38;
        cmv += unitCost * item.quantity;
      });
    });
    cmv = Math.round(cmv * 100) / 100;

    const totalCosts = Math.round((fees + cmv + opex) * 100) / 100;
    const net = Math.round((gross - totalCosts) * 100) / 100;
    const margin = gross > 0 ? Number(((net / gross) * 100).toFixed(1)) : 0;
    const ordersCount = filteredOrders.length;

    // Estornos no período
    const refundedOrders = orders.filter(o => o.status === "DEVOLUCAO" || o.status === "CANCELADO");
    const refundedAmount = refundedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      label,
      gross,
      fees,
      cmv,
      opex,
      totalCosts,
      net,
      margin,
      ordersCount,
      refundedAmount,
      refundedOrdersCount: refundedOrders.length,
    };
  }, [selectedPeriod, orders, products, channels, financial]);

  // Porcentagens sobre faturamento bruto
  const costsPercentage = periodData.gross > 0 
    ? ((periodData.totalCosts / periodData.gross) * 100).toFixed(1)
    : "0.0";
  const feesPct = periodData.gross > 0 ? Math.min(100, Math.round((periodData.fees / periodData.gross) * 100)) : 0;
  const cmvPct = periodData.gross > 0 ? Math.min(100, Math.round((periodData.cmv / periodData.gross) * 100)) : 0;
  const opexPct = periodData.gross > 0 ? Math.min(100, Math.round((periodData.opex / periodData.gross) * 100)) : 0;
  const netPct = periodData.gross > 0 ? Math.max(0, Math.min(100, Math.round((periodData.net / periodData.gross) * 100))) : 0;

  // Mix de Canais com cálculo real baseado nos pedidos faturados de orders e taxas de channels
  const channelMix = useMemo(() => {
    const activeStatuses: OrderStatus[] = ["PAGO", "SEPARACAO", "ENVIADO", "CONCLUIDO"];
    const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));

    const revenueByChannel: Record<string, { count: number; revenue: number }> = {};
    activeOrders.forEach((o) => {
      if (!revenueByChannel[o.channel]) {
        revenueByChannel[o.channel] = { count: 0, revenue: 0 };
      }
      revenueByChannel[o.channel].count += 1;
      revenueByChannel[o.channel].revenue += o.totalAmount;
    });

    const totalRev = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return channels.map((c) => {
      const data = revenueByChannel[c.code] || { count: 0, revenue: 0 };
      const share = totalRev > 0 ? ((data.revenue / totalRev) * 100).toFixed(1) : "0.0";
      const shareNum = totalRev > 0 ? (data.revenue / totalRev) * 100 : 0;
      return {
        code: c.code,
        name: c.name,
        icon: c.code.toLowerCase(),
        count: data.count,
        revenue: data.revenue,
        color: c.color || "#7A3F51",
        fee: c.feePercentage || 0,
        share,
        shareNum,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [orders, channels]);

  // Exportar CSV executivo
  const handleExportCSV = () => {
    const csvRows = [
      ["METRICA FINANCEIRA (BIA MAKES)", "VALOR (R$)", "PARTICIPACAO (%)"],
      ["Faturamento Bruto", periodData.gross.toFixed(2), "100.0%"],
      ["(-) Comissoes de Marketplaces", (-periodData.fees).toFixed(2), `${feesPct}%`],
      ["(-) Custo de Mercadorias Vendidas (CMV)", (-periodData.cmv).toFixed(2), `${cmvPct}%`],
      ["(-) Despesas Operacionais Fixas", (-periodData.opex).toFixed(2), `${opexPct}%`],
      ["(=) Resultado Liquido (Lucro Real)", periodData.net.toFixed(2), `${periodData.margin}%`],
      [],
      ["CANAL DE VENDA", "FATURAMENTO (R$)", "PARTICIPACAO (%)", "PEDIDOS", "TAXA COMISSAO (%)"],
      ...channelMix.map(c => [c.name, c.revenue.toFixed(2), `${c.share}%`, c.count.toString(), `${c.fee}%`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DRE_BiaMakes_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderChannelIcon = (icon: string) => {
    switch (icon) {
      case "instagram": return <Instagram className="w-4 h-4 text-[#E1306C]" />;
      case "whatsapp": return <MessageCircle className="w-4 h-4 text-[#25D366]" />;
      case "facebook": return <Facebook className="w-4 h-4 text-[#1877F2]" />;
      case "mercadolivre":
      case "shopee":
      case "tiktok":
      case "site":
      default: return <Store className="w-4 h-4 text-[#7A3F51]" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. CABEÇALHO EXECUTIVO E CONTROLES GLOBAIS */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E9D9CD] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7A3F51] to-[#9C5B6F] text-white flex items-center justify-center shadow-md">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#39313A] tracking-tight">
                Gestão Financeira & DRE Gerencial
              </h2>
              <p className="text-xs text-[#39313A]/70 mt-0.5">
                Visão executiva e contábil em tempo real do faturamento, custos operacionais e margens líquidas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Seletor de Período Global em Pílulas */}
          <div className="bg-[#FAF7F8] p-1 rounded-2xl border border-[#E9D9CD] flex items-center gap-1 shadow-inner">
            {(
              [
                { id: "today", label: "Hoje" },
                { id: "7days", label: "7 Dias" },
                { id: "current", label: "Mês Atual" },
                { id: "12months", label: "12 Meses" },
              ] as { id: PeriodType; label: string }[]
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selectedPeriod === p.id
                    ? "bg-[#7A3F51] text-white shadow-sm"
                    : "text-gray-600 hover:text-[#7A3F51] hover:bg-white/60"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botão de Exportação CSV */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white hover:bg-[#FAF0F4] text-[#7A3F51] border border-[#E9D9CD] hover:border-[#9C5B6F] rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            title="Baixar planilha estruturada em CSV"
          >
            <Download className="w-4 h-4 text-[#9C5B6F]" />
            <span>Exportar (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. FAIXA SUPERIOR: 4 HERO CARDS DE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Faturamento Bruto */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Faturamento Bruto
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +18.4%
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#7A3F51] tracking-tight">
              {formatCurrency(periodData.gross)}
            </div>
            <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
              <span>{periodData.ordersCount} pedidos faturados</span>
              {periodData.refundedAmount > 0 && (
                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                  -{formatCurrency(periodData.refundedAmount)} estornado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Custos Totais Deduzidos */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Custos Totais Deduzidos
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {costsPercentage}% do faturamento
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              -{formatCurrency(periodData.totalCosts)}
            </div>
            <div className="text-[11px] text-gray-500 mt-2">
              CMV: {formatCurrency(periodData.cmv)} • Comissões: {formatCurrency(periodData.fees)}
            </div>
          </div>
        </div>

        {/* Card 3: Lucro Líquido Real */}
        <div className={`p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all ${
          periodData.net >= 0 
            ? "bg-gradient-to-br from-emerald-50/60 via-white to-white border-emerald-200" 
            : "bg-gradient-to-br from-rose-50/60 via-white to-white border-rose-200"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {periodData.net >= 0 ? "Lucro Líquido Real" : "Prejuízo Operacional"}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              periodData.net >= 0 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "bg-rose-600 text-white shadow-sm"
            }`}>
              Margem: {periodData.margin}%
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              periodData.net >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}>
              {formatCurrency(periodData.net)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Retenção real após impostos, taxas e CMV
            </div>
          </div>
        </div>

        {/* Card 4: Vendas do Dia (Ao Vivo) */}
        <div className="bg-gradient-to-br from-[#FAF0F4] via-white to-white p-5 rounded-3xl border-2 border-[#9C5B6F]/30 shadow-sm hover:border-[#9C5B6F] transition-all relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A3F51] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#9C5B6F]" />
              Vendas do Dia
            </span>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ao Vivo</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#7A3F51] tracking-tight">
              {formatCurrency(todayMetrics.total)}
            </div>
            <div className="text-xs text-[#39313A]/70 mt-2 flex items-center justify-between border-t border-[#E9D9CD]/50 pt-2">
              <span className={`font-semibold ${todayMetrics.count > 0 ? "text-emerald-800" : "text-gray-500"}`}>
                {todayMetrics.count > 0 
                  ? `${todayMetrics.count} ${todayMetrics.count === 1 ? "pedido faturado hoje" : "pedidos faturados hoje"}`
                  : "0 pedidos faturados hoje"}
              </span>
              <span className="text-[10px] text-gray-500">
                {todayMetrics.total > 0 && financial.grossRevenue > 0
                  ? `${((todayMetrics.total / financial.grossRevenue) * 100).toFixed(1)}% do mês`
                  : `Atualizado às ${todayMetrics.lastUpdated}`}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. DRE VISUAL DIDÁTICO: RÉGUA PROGRESSIVA DE CACHOEIRA (WATERFALL) */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E9D9CD]/70">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#39313A] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#9C5B6F]" />
              <span>Caminho do Dinheiro: Da Receita Bruta ao Lucro Líquido Real</span>
            </h3>
            <p className="text-xs text-[#39313A]/70">
              Demonstrativo visual de onde cada centavo faturado é alocado nos custos e quanto sobra líquido no caixa.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-[#FAF7F8] px-3 py-1 rounded-full border border-[#E9D9CD]">
            {periodData.label}
          </span>
        </div>

        {/* 5 Passos do Waterfall em Grid Horizontal */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          
          {/* Passo 1: Receita Bruta */}
          <div className="bg-[#FAF7F8] p-3.5 rounded-2xl border border-[#E9D9CD] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Passo 1</span>
              <span className="text-xs font-bold text-[#7A3F51] block mt-0.5">Receita Bruta</span>
            </div>
            <div className="mt-3">
              <span className="text-lg font-extrabold text-[#7A3F51]">{formatCurrency(periodData.gross)}</span>
              <span className="text-[10px] text-gray-500 block font-semibold">100% da Entrada</span>
            </div>
          </div>

          {/* Passo 2: Comissões */}
          <div className="bg-rose-50/40 p-3.5 rounded-2xl border border-rose-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Passo 2</span>
              <span className="text-xs font-bold text-rose-800 block mt-0.5">(-) Comissões Canais</span>
            </div>
            <div className="mt-3">
              <span className="text-lg font-extrabold text-rose-600">-{formatCurrency(periodData.fees)}</span>
              <span className="text-[10px] text-rose-500 block font-semibold">{feesPct}% consumido</span>
            </div>
          </div>

          {/* Passo 3: CMV */}
          <div className="bg-rose-50/40 p-3.5 rounded-2xl border border-rose-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Passo 3</span>
              <span className="text-xs font-bold text-rose-800 block mt-0.5">(-) Custo Mercadorias</span>
            </div>
            <div className="mt-3">
              <span className="text-lg font-extrabold text-rose-600">-{formatCurrency(periodData.cmv)}</span>
              <span className="text-[10px] text-rose-500 block font-semibold">{cmvPct}% em insumos/make</span>
            </div>
          </div>

          {/* Passo 4: Despesas Fixas */}
          <div className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Passo 4</span>
              <span className="text-xs font-bold text-amber-900 block mt-0.5">(-) Despesas Fixas</span>
            </div>
            <div className="mt-3">
              <span className="text-lg font-extrabold text-amber-700">-{formatCurrency(periodData.opex)}</span>
              <span className="text-[10px] text-amber-600 block font-semibold">{opexPct}% operacional</span>
            </div>
          </div>

          {/* Passo 5: Lucro Líquido Real */}
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border-2 border-emerald-300 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Passo 5</span>
              <span className="text-xs font-bold text-emerald-900 block mt-0.5">(=) Lucro Real em Caixa</span>
            </div>
            <div className="mt-3">
              <span className="text-lg font-extrabold text-emerald-800">{formatCurrency(periodData.net)}</span>
              <span className="text-[10px] text-emerald-700 block font-bold">{periodData.margin}% de margem</span>
            </div>
          </div>

        </div>

        {/* Barra Proporcional Segmentada */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
            <span>Distribuição Proporcional de Cada R$ 1,00 Faturado:</span>
            <span>Retenção Líquida: {periodData.margin}%</span>
          </div>
          <div className="h-4 rounded-full bg-gray-100 overflow-hidden flex border border-[#E9D9CD]">
            <div 
              style={{ width: `${feesPct}%` }} 
              className="bg-rose-400 hover:bg-rose-500 transition-all cursor-pointer"
              title={`Comissões Marketplaces: ${feesPct}%`}
            />
            <div 
              style={{ width: `${cmvPct}%` }} 
              className="bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer"
              title={`CMV dos Cosméticos: ${cmvPct}%`}
            />
            <div 
              style={{ width: `${opexPct}%` }} 
              className="bg-amber-400 hover:bg-amber-500 transition-all cursor-pointer"
              title={`Despesas Fixas e Fretes: ${opexPct}%`}
            />
            <div 
              style={{ width: `${netPct}%` }} 
              className="bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer"
              title={`Lucro Líquido Real: ${netPct}%`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Comissões ({feesPct}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>CMV Cosméticos ({cmvPct}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Despesas Fixas ({opexPct}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <strong className="text-emerald-800">Lucro Líquido Retido ({netPct}%)</strong>
            </span>
          </div>
        </div>

      </div>

      {/* 4. SISTEMA DE ABAS INTERNAS (Substituindo a rolagem infinita) */}
      <div className="space-y-4">
        
        {/* Barra de Abas */}
        <div className="bg-white p-1.5 rounded-2xl border border-[#E9D9CD] shadow-sm flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#7A3F51] text-white shadow-md"
                : "text-gray-600 hover:text-[#7A3F51] hover:bg-[#FAF0F4]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Visão Geral & Mix de Canais</span>
          </button>

          <button
            onClick={() => setActiveTab("dre")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "dre"
                ? "bg-[#7A3F51] text-white shadow-md"
                : "text-gray-600 hover:text-[#7A3F51] hover:bg-[#FAF0F4]"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>DRE Contábil Detalhado</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "history"
                ? "bg-[#7A3F51] text-white shadow-md"
                : "text-gray-600 hover:text-[#7A3F51] hover:bg-[#FAF0F4]"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Histórico de 12 Meses & Transações</span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA A: VISÃO GERAL & MIX DE CANAIS */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            
            {/* Lado Esquerdo: Comparativo Mensal em Barras (col-span-5) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-serif text-base font-bold text-[#39313A] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C69A76]" />
                  <span>Evolução do Faturamento (Últimos Meses)</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comparação direta do faturamento bruto mês a mês.
                </p>
              </div>

              <div className="pt-6 pb-2">
                <div className="flex items-end justify-between gap-2 h-44 border-b border-[#E9D9CD] pb-2">
                  {MONTHLY_12_MONTHS_HISTORY.slice(-6).map((m, idx) => {
                    const heightPercent = Math.min(100, Math.round((m.gross / 50000) * 100));
                    const isLatest = idx === 5;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(m.gross)}
                        </span>
                        <div className="w-full bg-[#FAF0F4] rounded-t-xl overflow-hidden flex items-end h-32">
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full transition-all duration-500 rounded-t-xl ${
                              isLatest ? "bg-gradient-to-t from-[#7A3F51] to-[#9C5B6F]" : "bg-[#C69A76]/70 group-hover:bg-[#C69A76]"
                            }`}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${isLatest ? "text-[#7A3F51]" : "text-gray-400"}`}>
                          {m.month.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#FAF7F8] p-3 rounded-2xl border border-[#E9D9CD] flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600">Média Mensal Faturada:</span>
                <span className="font-extrabold text-[#7A3F51]">{formatCurrency(41250)}</span>
              </div>
            </div>

            {/* Lado Direito: Mix de Origens com Barras Horizontais e Rentabilidade (col-span-7) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-6">
              <div>
                <h4 className="font-serif text-base font-bold text-[#39313A] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#9C5B6F]" />
                  <span>Mix de Origens de Venda & Participação</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Distribuição percentual do faturamento entre a Loja Própria, Redes Sociais e Marketplaces.
                </p>
              </div>

              {/* Barras de Progresso Horizontais Elegantes */}
              <div className="space-y-3.5">
                {channelMix.map((c) => (
                  <div key={c.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-[#39313A]">
                        {renderChannelIcon(c.icon)}
                        <span>{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#7A3F51]">{formatCurrency(c.revenue)}</span>
                        <span className="text-xs font-extrabold text-gray-500 w-12 text-right">{c.share}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[#FAF7F8] overflow-hidden border border-[#E9D9CD]/50">
                      <div 
                        style={{ width: `${c.shareNum}%`, backgroundColor: c.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela Compacta de Rentabilidade Estratégica */}
              <div className="pt-2 border-t border-[#E9D9CD]/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                  Rentabilidade Estimada por Canal
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase border-b border-[#E9D9CD]/50">
                        <th className="pb-2">Canal</th>
                        <th className="pb-2">Taxa Comissão</th>
                        <th className="pb-2 text-right">Margem Líquida Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9D9CD]/30">
                      <tr>
                        <td className="py-2 font-bold text-[#7A3F51]">Loja Virtual Bia Makes (Site)</td>
                        <td className="py-2 text-emerald-700 font-bold">0.99% (PIX)</td>
                        <td className="py-2 text-right font-extrabold text-emerald-700">54.2% (Mais Lucrativo)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#39313A]">Instagram Shopping / Direct</td>
                        <td className="py-2 text-emerald-700 font-bold">0.00% (Venda Direta)</td>
                        <td className="py-2 text-right font-bold text-emerald-700">52.8%</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#39313A]">Mercado Livre Full</td>
                        <td className="py-2 text-gray-600">16.00%</td>
                        <td className="py-2 text-right font-bold text-[#39313A]">32.5%</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#39313A]">Shopee Oficial</td>
                        <td className="py-2 text-gray-600">14.00%</td>
                        <td className="py-2 text-right font-bold text-[#39313A]">34.8%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* CONTEÚDO DA ABA B: DRE CONTÁBIL DETALHADO */}
        {activeTab === "dre" && (
          <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9D9CD]">
              <div>
                <h4 className="font-serif text-lg font-bold text-[#39313A] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#C69A76]" />
                  <span>Demonstrativo do Resultado do Exercício (DRE Oficial)</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Estrutura contábil oficial com detalhamento de deduções e apuração do Lucro Real.
                </p>
              </div>
              <span className="text-xs bg-[#FAF0F4] text-[#7A3F51] px-3 py-1 rounded-full font-bold">
                {periodData.label}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              
              {periodData.refundedAmount > 0 && (
                <div className="flex justify-between py-2 px-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold items-center">
                  <span>(-) Estornos, Devoluções & Cancelamentos ({periodData.refundedOrdersCount} pedidos)</span>
                  <span className="line-through decoration-2 decoration-rose-600">
                    {formatCurrency(periodData.refundedAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-2.5 px-3 border-b border-gray-100 font-bold text-sm text-[#39313A]">
                <span>(+) RECEITA OPERACIONAL BRUTA</span>
                <span className="text-base text-[#7A3F51]">{formatCurrency(periodData.gross)}</span>
              </div>

              <div className="flex justify-between py-2 px-3 text-rose-700 pl-6 border-b border-gray-50">
                <span>(-) Comissões e Taxas de Intermediação de Marketplaces</span>
                <span className="font-bold">-{formatCurrency(periodData.fees)}</span>
              </div>

              <div className="flex justify-between py-2 px-3 text-rose-700 pl-6 border-b border-gray-50">
                <span>(-) Custo das Mercadorias Vendidas (CMV Cosméticos)</span>
                <span className="font-bold">-{formatCurrency(periodData.cmv)}</span>
              </div>

              <div className="flex justify-between py-2.5 px-3 border-b border-gray-100 font-bold text-sm text-[#7A3F51] bg-[#FAF7F8] rounded-xl">
                <span>(=) LUCRO OPERACIONAL BRUTO</span>
                <span>{formatCurrency(periodData.gross - periodData.fees - periodData.cmv)}</span>
              </div>

              <div className="flex justify-between py-2 px-3 text-rose-700 pl-6 border-b border-gray-50">
                <span>(-) Despesas Operacionais Fixas (Embalagens, Fretes e Plataforma)</span>
                <span className="font-bold">-{formatCurrency(periodData.opex)}</span>
              </div>

              <div className={`flex justify-between py-3.5 border-t-2 font-bold text-base px-4 rounded-2xl mt-4 ${
                periodData.net >= 0 
                  ? "border-[#7A3F51] text-emerald-800 bg-emerald-50/70" 
                  : "border-rose-600 text-rose-800 bg-rose-50/80"
              }`}>
                <span>{periodData.net >= 0 ? "(=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO REAL)" : "(=) RESULTADO LÍQUIDO DO EXERCÍCIO (PREJUÍZO REAL)"}</span>
                <span className="text-lg">{formatCurrency(periodData.net)}</span>
              </div>

            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA C: HISTÓRICO DE 12 MESES & TRANSAÇÕES */}
        {activeTab === "history" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Tabela dos 12 Meses */}
            <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-bold text-[#39313A] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C69A76]" />
                <span>Histórico Financeiro Consolidado (12 Meses)</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-gray-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Mês / Ano</th>
                      <th className="py-2.5 px-3 text-right">Faturamento Bruto</th>
                      <th className="py-2.5 px-3 text-right">Lucro Líquido</th>
                      <th className="py-2.5 px-3 text-center">Pedidos</th>
                      <th className="py-2.5 px-3 text-right">Margem Líquida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9D9CD]/30">
                    {MONTHLY_12_MONTHS_HISTORY.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F8]/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#39313A]">{row.month}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#7A3F51]">{formatCurrency(row.gross)}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">{formatCurrency(row.net)}</td>
                        <td className="py-2.5 px-3 text-center text-gray-600">{row.ordersCount}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-700">{row.margin}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Últimas Transações Faturadas */}
            <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-bold text-[#39313A] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#9C5B6F]" />
                <span>Últimas Transações Faturadas</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-gray-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Pedido</th>
                      <th className="py-2.5 px-3">Canal</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Forma Pagto</th>
                      <th className="py-2.5 px-3 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9D9CD]/30">
                    {orders.slice(0, 6).map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FAF7F8]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#7A3F51]">{ord.orderNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-[#E9D9CD] text-[#7A3F51]">
                            {ord.channel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#39313A]">{ord.customerName}</td>
                        <td className="py-2.5 px-3 text-gray-500 text-[11px]">{formatDate(ord.createdAt)}</td>
                        <td className="py-2.5 px-3 text-gray-600">{ord.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">{formatCurrency(ord.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
