"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
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
  Zap,
  Target,
  Clock,
  Truck,
  CheckCircle2,
  Box,
  Store,
  ChevronRight,
  Sparkles,
  Search,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  BarChart3,
  Percent,
  Flame,
  Radio
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
  const [chartPeriod, setChartPeriod] = useState<"30days" | "14days" | "7days" | "today">("7days");

  // Saudação dinâmica com base no horário
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  // 1. Termômetro da Meta Mensal
  const targetMetrics = useMemo(() => {
    const monthlyGoal = 60000.00;
    const currentGross = financial.grossRevenue;
    const progressPct = Math.min(100, Number(((currentGross / monthlyGoal) * 100).toFixed(1)));
    const remaining = Math.max(0, monthlyGoal - currentGross);
    const dayOfMonth = new Date().getDate();
    const daysInMonth = 30;
    const dailyAverage = dayOfMonth > 0 ? currentGross / dayOfMonth : 0;
    const projectedClose = Math.round(dailyAverage * daysInMonth);

    return {
      monthlyGoal,
      currentGross,
      progressPct,
      remaining,
      projectedClose,
    };
  }, [financial.grossRevenue]);

  // 2. Esteira de Expedição / Workflow Operacional
  const workflowCounters = useMemo(() => {
    const pendingOrders = orders.filter((o) => o.status === "PENDENTE");
    const paidOrders = orders.filter((o) => o.status === "PAGO");
    const separationOrders = orders.filter((o) => o.status === "SEPARACAO");
    const shippedOrders = orders.filter((o) => o.status === "ENVIADO");
    const deliveredOrders = orders.filter((o) => o.status === "CONCLUIDO");

    const pendingTotal = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const paidTotal = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      pending: { count: pendingOrders.length, total: pendingTotal },
      paid: { count: paidOrders.length, total: paidTotal },
      separation: { count: separationOrders.length },
      shipped: { count: shippedOrders.length },
      delivered: { count: deliveredOrders.length },
    };
  }, [orders]);

  // 3. Valuation & Patrimônio do Estoque Central
  const warehouseValuation = useMemo(() => {
    let costTotal = 0;
    let retailTotal = 0;
    let totalPhysical = 0;
    let totalReserved = 0;

    products.forEach((p) => {
      const physical = Number(p.physicalStock) || 0;
      const reserved = Number(p.reservedStock) || 0;
      const cost = Number(p.costPrice) || 0;
      const sellingPrice = p.promoPrice && p.promoPrice > 0 ? p.promoPrice : p.salePrice;

      costTotal += physical * cost;
      retailTotal += physical * sellingPrice;
      totalPhysical += physical;
      totalReserved += reserved;
    });

    const potentialGrossProfit = retailTotal - costTotal;
    const potentialMargin = retailTotal > 0 ? ((potentialGrossProfit / retailTotal) * 100).toFixed(1) : "0.0";
    const available = Math.max(0, totalPhysical - totalReserved);
    const availablePct = totalPhysical > 0 ? Math.round((available / totalPhysical) * 100) : 0;
    const reservedPct = totalPhysical > 0 ? Math.round((totalReserved / totalPhysical) * 100) : 0;

    return {
      costTotal,
      retailTotal,
      potentialGrossProfit,
      potentialMargin,
      totalPhysical,
      totalReserved,
      available,
      availablePct,
      reservedPct,
    };
  }, [products]);

  // 4. Ranking Curva ABC - Top 4 Produtos Mais Rentáveis
  const topProducts = useMemo(() => {
    return [...products]
      .map((p) => {
        const sellingPrice = p.promoPrice && p.promoPrice > 0 ? p.promoPrice : p.salePrice;
        const unitMargin = sellingPrice > 0 ? ((sellingPrice - p.costPrice) / sellingPrice) * 100 : 0;
        const totalStockValue = p.physicalStock * sellingPrice;
        return {
          ...p,
          sellingPrice,
          unitMargin: Number(unitMargin.toFixed(1)),
          totalStockValue,
        };
      })
      .sort((a, b) => b.totalStockValue - a.totalStockValue)
      .slice(0, 4);
  }, [products]);

  // 5. Mix de Canais com Share de Vendas (100% dinâmico a partir dos pedidos reais faturados)
  const channelPerformance = useMemo(() => {
    const activeStatuses = ["PAGO", "SEPARACAO", "ENVIADO", "CONCLUIDO"];
    const validOrders = orders.filter((o) => activeStatuses.includes(o.status));

    const revenueByChannel: Record<string, number> = {};
    validOrders.forEach((o) => {
      revenueByChannel[o.channel] = (revenueByChannel[o.channel] || 0) + o.totalAmount;
    });

    const total = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return channels.map((c) => {
      const rev = revenueByChannel[c.code] ?? 0;
      const share = total > 0 ? ((rev / total) * 100).toFixed(1) : "0.0";
      const shareNum = total > 0 ? (rev / total) * 100 : 0;
      return {
        ...c,
        revenue: rev,
        share,
        shareNum,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [channels, orders]);

  // 6. Central de Risco (Ruptura & ANVISA)
  const riskAlerts = useMemo(() => {
    const lowStock = products
      .filter((p) => p.physicalStock - p.reservedStock <= p.minStock)
      .map((p) => ({
        product: p,
        type: "rupture" as const,
        title: "Ruptura Iminente",
        desc: `Apenas ${p.physicalStock - p.reservedStock} un disponíveis (Mín: ${p.minStock} un)`,
        severity: "danger" as const,
      }));

    const expiring = products
      .filter((p) => {
        const days = getDaysUntil(p.expiryDate);
        return days >= 0 && days <= 90;
      })
      .map((p) => {
        const days = getDaysUntil(p.expiryDate);
        return {
          product: p,
          type: "anvisa" as const,
          title: "Vencimento Próximo (ANVISA)",
          desc: `Vence em ${days} dias (${formatDateShort(p.expiryDate)})`,
          severity: "warning" as const,
        };
      });

    return [...lowStock, ...expiring].slice(0, 4);
  }, [products]);

  // Performance comercial integrada ao financeiro real (com suporte aos períodos: 30 dias, 14 dias e 7 dias)
  const commercialPerformance = useMemo(() => {
    const activeStatuses = ["PAGO", "SEPARACAO", "ENVIADO", "CONCLUIDO"];
    const now = new Date();

    // Pedidos faturados válidos
    const validOrders = orders.filter((o) => activeStatuses.includes(o.status));

    interface ChartItem {
      label: string;
      gross: number;
      ordersCount: number;
      isToday?: boolean;
    }

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // 1. Visão 7 Dias (últimos 7 dias diários retroativos incluindo hoje)
    const last7DaysData: ChartItem[] = Array.from({ length: 7 }).map((_, idx) => {
      const dayOffset = 6 - idx; // 6 dias atrás até 0 (hoje)
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
      const startMs = targetDate.getTime();
      const endMs = startMs + 86400000;

      const dayOrders = validOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return !isNaN(t) && t >= startMs && t < endMs;
      });

      const dayGross = dayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
      const isToday = dayOffset === 0;

      return {
        label: isToday ? "Hoje" : dayNames[targetDate.getDay()],
        gross: Math.round(dayGross * 100) / 100,
        ordersCount: dayOrders.length,
        isToday,
      };
    });

    // 2. Visão 14 Dias (últimos 14 dias diários retroativos com data DD/MM)
    const last14DaysData: ChartItem[] = Array.from({ length: 14 }).map((_, idx) => {
      const dayOffset = 13 - idx;
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
      const startMs = targetDate.getTime();
      const endMs = startMs + 86400000;

      const dayOrders = validOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return !isNaN(t) && t >= startMs && t < endMs;
      });

      const dayGross = dayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
      const isToday = dayOffset === 0;
      const dateFormatted = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;

      return {
        label: isToday ? "Hoje" : dateFormatted,
        gross: Math.round(dayGross * 100) / 100,
        ordersCount: dayOrders.length,
        isToday,
      };
    });

    // 3. Visão 30 Dias (agrupados em 5 blocos de 6 dias para barras proporcionais e legíveis)
    const last30DaysData: ChartItem[] = [
      { label: "Sem 1", daysBackStart: 30, daysBackEnd: 24 },
      { label: "Sem 2", daysBackStart: 24, daysBackEnd: 18 },
      { label: "Sem 3", daysBackStart: 18, daysBackEnd: 12 },
      { label: "Sem 4", daysBackStart: 12, daysBackEnd: 6 },
      { label: "Sem 5", daysBackStart: 6, daysBackEnd: 0 },
    ].map((b) => {
      const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - b.daysBackStart).getTime();
      const endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - b.daysBackEnd).getTime();

      const blockOrders = validOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return !isNaN(t) && t >= startMs && (b.daysBackEnd === 0 ? t <= now.getTime() : t < endMs);
      });

      const gross = blockOrders.reduce((acc, o) => acc + o.totalAmount, 0);
      return {
        label: b.label,
        gross: Math.round(gross * 100) / 100,
        ordersCount: blockOrders.length,
      };
    });

    // Seção ativa
    let activeData: ChartItem[] = last7DaysData;
    let periodTitle = "Evolução Comercial (Últimos 7 Dias)";
    let periodSubtitle = "Acompanhamento diário com faturamento bruto real sincronizado ao financeiro.";

    if (chartPeriod === "30days") {
      activeData = last30DaysData;
      periodTitle = "Evolução Comercial (Últimos 30 Dias)";
      periodSubtitle = "Faturamento consolidado das últimas semanas refletindo as vendas ativas.";
    } else if (chartPeriod === "14days") {
      activeData = last14DaysData;
      periodTitle = "Evolução Comercial (Últimos 14 Dias)";
      periodSubtitle = "Tendência diária das duas últimas semanas sincronizada ao financeiro.";
    }

    const currentTotalGross = activeData.reduce((acc, d) => acc + d.gross, 0);
    const maxVal = Math.max(...activeData.map((d) => d.gross), 100);

    // Identificar pico
    let peakIndex = -1;
    let peakGross = 0;
    activeData.forEach((d, idx) => {
      if (d.gross > peakGross) {
        peakGross = d.gross;
        peakIndex = idx;
      }
    });

    const activeOrdersCount = activeData.reduce((acc, d) => acc + d.ordersCount, 0);
    const averageTicket = activeOrdersCount > 0 ? currentTotalGross / activeOrdersCount : 0;

    return {
      items: activeData,
      maxValue: maxVal,
      peakIndex,
      totalGross: currentTotalGross,
      averageTicket,
      periodTitle,
      periodSubtitle,
    };
  }, [orders, chartPeriod]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. HEADER COCKPIT + TERMÔMETRO DE META MENSAL INTEGRADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Lado Esquerdo: Saudação e Ações Rápidas (7 colunas) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0F4] text-[#7A3F51] text-xs font-bold border border-[#E9D9CD]">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>Operação Ativa • Multi-Armazém</span>
              </span>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500 font-medium">Bia Makes ERP v2.4</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#39313A] mt-2 tracking-tight">
              {greeting}, Equipe Bia Makes! 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#39313A]/70 mt-1 max-w-xl">
              Cockpit comercial consolidado: acompanhe a evolução das vendas diárias, a esteira logística de expedição e a saúde do inventário.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => onNavigateTab("products")}
              className="px-4 py-2 bg-[#7A3F51] hover:bg-[#5E303E] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Produto</span>
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("biamakes-open-spotlight"));
              }}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-[#E9D9CD] rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              title="Abrir Spotlight Command Palette"
            >
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span>Comandos</span>
              <kbd className="text-[10px] font-mono bg-[#FAF7F8] border border-[#E9D9CD] px-1.5 py-0.5 rounded text-gray-400">Ctrl+K</kbd>
            </button>
          </div>
        </div>

        {/* Lado Direito: Termômetro da Meta Mensal (5 colunas) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#7A3F51] via-[#8B485C] to-[#9C5B6F] text-white p-6 sm:p-7 rounded-3xl shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                Meta do Mês (Novembro/26)
              </span>
            </div>
            <span className="text-xs font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
              {targetMetrics.progressPct}% atingido
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formatCurrency(targetMetrics.currentGross)}
              </span>
              <span className="text-xs text-white/70">
                Meta: {formatCurrency(targetMetrics.monthlyGoal)}
              </span>
            </div>

            {/* Barra de Progresso com Brilho */}
            <div className="h-3 rounded-full bg-white/20 overflow-hidden mt-2 p-0.5 border border-white/20">
              <div
                style={{ width: `${targetMetrics.progressPct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-700 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/15 pt-3">
            <div>
              <span className="text-[10px] text-white/70 block uppercase font-medium">Falta Faturar:</span>
              <span className="font-extrabold text-sm">{formatCurrency(targetMetrics.remaining)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/70 block uppercase font-medium">Projeção de Fechamento:</span>
              <span className="font-extrabold text-sm text-emerald-300">{formatCurrency(targetMetrics.projectedClose)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. ESTEIRA DE EXPEDIÇÃO DO DIA (WORKFLOW / TO-DO OPERACIONAL) */}
      <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#9C5B6F]" />
            <h3 className="font-serif text-sm font-bold text-[#39313A] uppercase tracking-wider">
              Esteira de Expedição & Workflow Operacional
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("orders")}
            className="text-xs font-bold text-[#7A3F51] hover:text-[#9C5B6F] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Central de Pedidos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* 1. Aguardando Pagamento */}
          <button
            onClick={() => onNavigateTab("orders")}
            className="p-3.5 rounded-2xl bg-[#FAF7F8] hover:bg-[#FAF0F4] border border-[#E9D9CD] text-left transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">1. Pendente</span>
            <div className="text-xl font-extrabold text-[#39313A] mt-1">
              {workflowCounters.pending.count} pedidos
            </div>
            <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
              {formatCurrency(workflowCounters.pending.total)}
            </span>
          </button>

          {/* 2. Prontos para Embalar (PAGO) */}
          <button
            onClick={() => onNavigateTab("orders")}
            className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-300 text-left transition-all cursor-pointer relative group"
          >
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">2. Prontos p/ Embalar</span>
            <div className="text-xl font-extrabold text-amber-900 mt-1">
              {workflowCounters.paid.count} pagos
            </div>
            <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
              Ação Imediata ⚡
            </span>
          </button>

          {/* 3. Em Separação na Bancada */}
          <button
            onClick={() => onNavigateTab("orders")}
            className="p-3.5 rounded-2xl bg-purple-50/50 hover:bg-purple-100/50 border border-purple-200 text-left transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">3. Em Separação</span>
            <div className="text-xl font-extrabold text-purple-900 mt-1">
              {workflowCounters.separation.count} pedidos
            </div>
            <span className="text-[10px] text-purple-700 font-medium block mt-0.5">
              Na mesa de montagem
            </span>
          </button>

          {/* 4. Despachados / Em Trânsito */}
          <button
            onClick={() => onNavigateTab("orders")}
            className="p-3.5 rounded-2xl bg-blue-50/50 hover:bg-blue-100/50 border border-blue-200 text-left transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">4. Em Trânsito</span>
            <div className="text-xl font-extrabold text-blue-900 mt-1">
              {workflowCounters.shipped.count} envios
            </div>
            <span className="text-[10px] text-blue-700 font-medium block mt-0.5">
              Com rastreio ativo
            </span>
          </button>

          {/* 5. Entregues / Concluídos */}
          <button
            onClick={() => onNavigateTab("orders")}
            className="p-3.5 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/50 border border-emerald-200 text-left transition-all cursor-pointer col-span-2 sm:col-span-1 group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">5. Concluídos</span>
            <div className="text-xl font-extrabold text-emerald-900 mt-1">
              {workflowCounters.delivered.count} entregues
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
              Finalizados com sucesso
            </span>
          </button>

        </div>
      </div>

      {/* 3. BENTO GRID PRINCIPAL (GRÁFICO DE PERFORMANCE + VALUATION DO ESTOQUE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Coluna Esquerda: Gráfico de Performance Comercial Real (7 colunas) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg font-bold text-[#39313A] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#C69A76] shrink-0" />
                <span>{commercialPerformance.periodTitle}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {commercialPerformance.periodSubtitle}
              </p>
            </div>

            {/* Seletor de Período Solicitado: 30 Dias | 14 Dias | 7 Dias */}
            <div className="bg-[#FAF7F8] p-1 rounded-xl border border-[#E9D9CD] flex items-center gap-1 text-[11px] font-bold self-start sm:self-auto shrink-0 select-none">
              <button
                type="button"
                onClick={() => setChartPeriod("30days")}
                className={`w-[70px] py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                  chartPeriod === "30days"
                    ? "bg-[#7A3F51] text-white shadow-2xs font-extrabold"
                    : "text-gray-600 hover:text-[#7A3F51]"
                }`}
              >
                30 Dias
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod("14days")}
                className={`w-[70px] py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                  chartPeriod === "14days"
                    ? "bg-[#7A3F51] text-white shadow-2xs font-extrabold"
                    : "text-gray-600 hover:text-[#7A3F51]"
                }`}
              >
                14 Dias
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod("7days")}
                className={`w-[70px] py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                  chartPeriod === "7days"
                    ? "bg-[#7A3F51] text-white shadow-2xs font-extrabold"
                    : "text-gray-600 hover:text-[#7A3F51]"
                }`}
              >
                7 Dias
              </button>
            </div>
          </div>

          {/* Gráfico de Barras Estilizado sincronizado aos pedidos e dados financeiros */}
          <div className="pt-4 pb-2">
            <div className="flex items-end justify-between gap-3 h-48 border-b border-[#E9D9CD] pb-2">
              {commercialPerformance.items.map((d, i) => {
                const heightPct = commercialPerformance.maxValue > 0
                  ? Math.min(100, Math.max(d.gross > 0 ? 8 : 2, Math.round((d.gross / commercialPerformance.maxValue) * 100)))
                  : 4;
                const isPeak = i === commercialPerformance.peakIndex && d.gross > 0;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[10px] font-mono font-bold text-[#7A3F51] opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(d.gross)}
                    </span>
                    <div className="w-full bg-[#FAF0F4] rounded-t-xl overflow-hidden flex items-end h-36">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full transition-all duration-500 rounded-t-xl ${
                          isPeak
                            ? "bg-gradient-to-t from-[#7A3F51] to-[#9C5B6F] shadow-xs"
                            : d.gross > 0
                            ? "bg-[#C69A76]/80 group-hover:bg-[#C69A76]"
                            : "bg-[#E9D9CD]/40"
                        }`}
                      />
                    </div>
                    <span className={`text-[11px] font-bold ${d.label === "Hoje" ? "text-[#7A3F51]" : "text-gray-500"}`}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 text-gray-600 border-t border-[#E9D9CD]/50 gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7A3F51]" />
                <span>
                  Faturamento do Período: <strong>{formatCurrency(commercialPerformance.totalGross)}</strong>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>
                  Ticket Médio: <strong>{formatCurrency(commercialPerformance.averageTicket)}</strong>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Valuation & Patrimônio do Galpão (5 colunas) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#9C5B6F]" />
                <h3 className="font-serif text-lg font-bold text-[#39313A]">
                  Patrimônio & Valuation de Estoque
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("stock")}
                className="text-xs font-bold text-[#7A3F51] hover:underline"
              >
                Kardex
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Cálculo patrimonial ativo com base nas unidades físicas em prateleira.
            </p>
          </div>

          {/* Cards de Métricas de Valuation */}
          <div className="space-y-2.5">
            <div className="bg-[#FAF7F8] p-3 rounded-2xl border border-[#E9D9CD] flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Custo Imobilizado (Custo Médio):</span>
              <span className="text-sm font-extrabold text-[#7A3F51] text-right">
                {formatCurrency(warehouseValuation.costTotal)}
              </span>
            </div>
            <div className="bg-[#FAF7F8] p-3 rounded-2xl border border-[#E9D9CD] flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Potencial de Venda Bruta:</span>
              <span className="text-sm font-extrabold text-[#39313A] text-right">
                {formatCurrency(warehouseValuation.retailTotal)}
              </span>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-emerald-900 font-bold">Lucro Projetado do Estoque:</span>
                <span className="text-[10px] text-emerald-800 font-medium">
                  Margem: {warehouseValuation.potentialMargin}%
                </span>
              </div>
              <span className="text-sm font-extrabold text-emerald-700 text-right">
                {formatCurrency(warehouseValuation.potentialGrossProfit)}
              </span>
            </div>
          </div>

          {/* Barra de Ocupação: Disponível vs Reservado */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Disponível: {warehouseValuation.available} un ({warehouseValuation.availablePct}%)</span>
              <span className="text-amber-700">Reservado: {warehouseValuation.totalReserved} un ({warehouseValuation.reservedPct}%)</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex border border-[#E9D9CD]">
              <div
                style={{ width: `${warehouseValuation.availablePct}%` }}
                className="h-full bg-emerald-500"
              />
              <div
                style={{ width: `${warehouseValuation.reservedPct}%` }}
                className="h-full bg-amber-500"
              />
            </div>
          </div>

        </div>

      </div>

      {/* 4. RANKING CURVA ABC */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="font-serif text-lg font-bold text-[#39313A]">
              Top Produtos Mais Rentáveis (Curva ABC)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("products")}
            className="text-xs font-bold text-[#7A3F51] hover:underline"
          >
            Ver Catálogo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topProducts.map((p, idx) => (
            <div
              key={p.id}
              className="p-3 rounded-2xl bg-[#FAF7F8] hover:bg-[#FAF0F4] border border-[#E9D9CD] transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 h-5 rounded-full bg-white border border-[#E9D9CD] flex items-center justify-center text-[10px] font-extrabold text-[#7A3F51] shrink-0">
                  {idx + 1}
                </span>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-[#E9D9CD] shrink-0 relative">
                  <Image
                    src={p.images?.[0] || "/logo.jpg"}
                    alt={p.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-[#39313A] truncate block">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    SKU: {p.sku} • {p.physicalStock} un em estoque
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-extrabold text-xs text-[#7A3F51] block">
                  {formatCurrency(p.sellingPrice)}
                </span>
                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Margem: {p.unitMargin}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. CENTRAL UNIFICADA DE RISCO (RUPTURA DE ESTOQUE & ANVISA) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#39313A]">
                Central Unificada de Riscos (Estoque de Segurança & ANVISA)
              </h3>
              <p className="text-xs text-gray-500">
                Itens com estoque abaixo do limite de segurança ou prazo de validade inferior a 90 dias.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
            {riskAlerts.length} alertas prioritários
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {riskAlerts.length === 0 ? (
            <div className="col-span-4 p-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200 font-semibold">
              🎉 Nenhum risco operacional no momento. Todos os estoques e validades estão regulares!
            </div>
          ) : (
            riskAlerts.map((alt, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  alt.severity === "danger"
                    ? "bg-rose-50/50 border-rose-200"
                    : "bg-amber-50/50 border-amber-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      alt.severity === "danger"
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}>
                      {alt.title}
                    </span>
                    <AlertTriangle className={`w-3.5 h-3.5 ${
                      alt.severity === "danger" ? "text-rose-600" : "text-amber-600"
                    }`} />
                  </div>
                  <span className="font-bold text-xs text-[#39313A] line-clamp-1">
                    {alt.product.name}
                  </span>
                  <span className="text-[11px] text-gray-600 block mt-1">
                    {alt.desc}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateTab(alt.type === "rupture" ? "stock" : "products")}
                  className="w-full py-1.5 px-3 bg-white hover:bg-gray-50 text-[#7A3F51] border border-[#E9D9CD] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>Resolver Agora</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
