"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  DollarSign,
  Download,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  ShoppingBag,
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Check,
  X,
  CreditCard,
  Package,
  TrendingUp,
  RotateCcw,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Layers,
  TrendingDown,
  Truck,
} from "lucide-react";
import {
  ChannelType,
  FinancialMetric,
  MarketplaceChannel,
  Order,
  OrderStatus,
  Product,
} from "@/types";
import {
  formatCurrency,
  formatDate,
  resolveOrderCompanyShippingCost,
} from "@/lib/utils";
import { useBiaMakes } from "@/context/BiaMakesContext";

interface FinancialManagerProps {
  financial: FinancialMetric;
  channels: MarketplaceChannel[];
  orders?: Order[];
}

type PeriodType = "today" | "7days" | "current" | "12months" | "all";
type ExtractFilterType = "all" | "confirmed" | "pending" | "refunded";

const MONTHLY_OPEX_STORAGE_KEY = "biamakes_monthly_opex_v1";

const CONFIRMED_STATUSES: OrderStatus[] = [
  "PAGO",
  "SEPARACAO",
  "ENVIADO",
  "CONCLUIDO",
];

const REFUNDED_STATUSES: OrderStatus[] = ["DEVOLUCAO", "CANCELADO"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDENTE: "Aguardando Pagto",
  PAGO: "Pago (No Caixa)",
  SEPARACAO: "Em Separação",
  ENVIADO: "Enviado",
  CONCLUIDO: "Concluído",
  DEVOLUCAO: "Devolvido",
  CANCELADO: "Cancelado",
};

const CHANNEL_DEFAULTS: Record<
  string,
  { label: string; color: string; feePct: number; icon: string }
> = {
  SITE: {
    label: "Site Bia Makes (Loja Oficial)",
    color: "#7A3F51",
    feePct: 0,
    icon: "site",
  },
  INSTAGRAM: {
    label: "Instagram Shopping / Direct",
    color: "#E1306C",
    feePct: 3.5,
    icon: "instagram",
  },
  FACEBOOK: {
    label: "Facebook Loja / Meta",
    color: "#1877F2",
    feePct: 3.5,
    icon: "facebook",
  },
  WHATSAPP: {
    label: "WhatsApp Vendas VIP",
    color: "#25D366",
    feePct: 0,
    icon: "whatsapp",
  },
  MERCADO_LIVRE: {
    label: "Mercado Livre",
    color: "#EAB308",
    feePct: 16.0,
    icon: "mercadolivre",
  },
  SHOPEE: {
    label: "Shopee",
    color: "#F97316",
    feePct: 14.0,
    icon: "shopee",
  },
  AMAZON: {
    label: "Amazon Brasil",
    color: "#0284C7",
    feePct: 15.0,
    icon: "amazon",
  },
  TIKTOK: {
    label: "TikTok Shop",
    color: "#EC4899",
    feePct: 10.0,
    icon: "tiktok",
  },
  SHEIN: {
    label: "Shein Marketplace",
    color: "#6B7280",
    feePct: 12.0,
    icon: "shein",
  },
  BALCAO: {
    label: "Balcão / Loja Física",
    color: "#9C5B6F",
    feePct: 0,
    icon: "balcao",
  },
};

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getChannelDisplayName(code: string, channels: MarketplaceChannel[]): string {
  const found = channels.find((c) => c.code === code);
  if (found) return found.name;
  return CHANNEL_DEFAULTS[code]?.label || code;
}

function getChannelColor(code: string, channels: MarketplaceChannel[]): string {
  const found = channels.find((c) => c.code === code);
  if (found && found.color) return found.color;
  return CHANNEL_DEFAULTS[code]?.color || "#7A3F51";
}

function renderChannelIcon(code: string) {
  switch (code) {
    case "SITE":
      return <Globe className="w-4 h-4 text-[#7A3F51]" />;
    case "INSTAGRAM":
      return <Instagram className="w-4 h-4 text-[#E1306C]" />;
    case "FACEBOOK":
      return <Facebook className="w-4 h-4 text-[#1877F2]" />;
    case "WHATSAPP":
      return <MessageCircle className="w-4 h-4 text-[#25D366]" />;
    case "BALCAO":
      return <Store className="w-4 h-4 text-[#9C5B6F]" />;
    default:
      return <ShoppingBag className="w-4 h-4 text-[#C69A76]" />;
  }
}

function isOrderInPeriod(
  orderDateIso: string,
  period: PeriodType,
  now: Date
): boolean {
  if (period === "all") return true;
  const d = new Date(orderDateIso);
  if (isNaN(d.getTime())) return false;

  if (period === "today") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  if (period === "7days") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= sevenDaysAgo;
  }

  if (period === "current") {
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }

  if (period === "12months") {
    const twelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 11,
      1
    );
    return d >= twelveMonthsAgo;
  }

  return true;
}

function computeOrderBreakdown(
  order: Order,
  products: Product[],
  channelFeeMap: Record<string, number>
) {
  const feePct =
    channelFeeMap[order.channel] ??
    CHANNEL_DEFAULTS[order.channel]?.feePct ??
    0;
  const channelFee = roundCurrency(order.totalAmount * (feePct / 100));

  let cmv = 0;
  order.items.forEach((item) => {
    const prod = products.find(
      (p) =>
        p.id === item.productId ||
        p.sku === item.sku ||
        p.variations?.some((v) => v.sku === item.sku)
    );
    const unitCost =
      prod && typeof prod.costPrice === "number"
        ? prod.costPrice
        : roundCurrency(item.price * 0.38);
    cmv += unitCost * item.quantity;
  });
  cmv = roundCurrency(cmv);
  const shippingCost = resolveOrderCompanyShippingCost(order);

  const totalOrderCosts = roundCurrency(cmv + channelFee + shippingCost);
  const orderProfit = roundCurrency(order.totalAmount - totalOrderCosts);

  return {
    cmv,
    channelFee,
    shippingCost,
    totalOrderCosts,
    orderProfit,
  };
}

export function FinancialManager({
  financial,
  channels,
  orders: propOrders,
}: FinancialManagerProps) {
  const { products, orders: ctxOrders, setCrmActiveTab } = useBiaMakes();
  const orders = propOrders !== undefined ? propOrders : ctxOrders;

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("current");
  const [extractFilter, setExtractFilter] = useState<ExtractFilterType>("all");
  const [selectedChannelKey, setSelectedChannelKey] = useState<string | null>(
    null
  );
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(
    null
  );

  // Gastos Fixos Operacionais editáveis persistidos no localStorage
  const [monthlyOpex, setMonthlyOpex] = useState<number>(0);
  const [isEditingOpex, setIsEditingOpex] = useState(false);
  const [opexDraft, setOpexDraft] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MONTHLY_OPEX_STORAGE_KEY);
      if (saved !== null) {
        const parsed = Number(saved);
        if (Number.isFinite(parsed) && parsed >= 0) {
          setMonthlyOpex(parsed);
        }
      } else if (financial.operatingExpenses > 0) {
        setMonthlyOpex(financial.operatingExpenses);
      }
    } catch {
      // Ignora erro de localStorage
    }
  }, [financial.operatingExpenses]);

  const handleOpenEditOpex = () => {
    setOpexDraft(monthlyOpex > 0 ? String(monthlyOpex) : "");
    setIsEditingOpex(true);
  };

  const handleSaveOpex = () => {
    const raw = opexDraft.trim();
    const normalized = raw.includes(",")
      ? raw.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")
      : raw.replace(/[^\d.]/g, "");
    const parsed = Number(normalized);
    const validValue =
      Number.isFinite(parsed) && parsed >= 0 ? roundCurrency(parsed) : 0;
    setMonthlyOpex(validValue);
    try {
      localStorage.setItem(MONTHLY_OPEX_STORAGE_KEY, String(validValue));
    } catch {
      // Ignora erro de gravação
    }
    setIsEditingOpex(false);
  };

  const channelFeeMap = useMemo(() => {
    const map: Record<string, number> = {};
    channels.forEach((c) => {
      map[c.code] = typeof c.feePercentage === "number" ? c.feePercentage : 0;
    });
    return map;
  }, [channels]);

  // Resumo Financeiro Consolidado Reativo ao Período
  const summary = useMemo(() => {
    const now = new Date();
    const periodOrders = orders.filter((o) =>
      isOrderInPeriod(o.createdAt, selectedPeriod, now)
    );

    const confirmedOrders = periodOrders.filter((o) =>
      CONFIRMED_STATUSES.includes(o.status)
    );
    const pendingOrders = periodOrders.filter((o) => o.status === "PENDENTE");
    const refundedOrders = periodOrders.filter((o) =>
      REFUNDED_STATUSES.includes(o.status)
    );

    const allPendingCount = orders.filter((o) => o.status === "PENDENTE").length;
    const allPendingTotal = roundCurrency(
      orders
        .filter((o) => o.status === "PENDENTE")
        .reduce((acc, o) => acc + o.totalAmount, 0)
    );

    let gross = 0;
    let totalCmv = 0;
    let totalFees = 0;
    let totalShippingCost = 0;
    let freeShippingSubsidizedCount = 0;
    let subsidizedFreeShippingTotal = 0;

    const orderBreakdowns = new Map<
      string,
      ReturnType<typeof computeOrderBreakdown>
    >();

    periodOrders.forEach((o) => {
      orderBreakdowns.set(
        o.id,
        computeOrderBreakdown(o, products, channelFeeMap)
      );
    });

    confirmedOrders.forEach((o) => {
      const b = orderBreakdowns.get(o.id)!;
      gross += o.totalAmount;
      totalCmv += b.cmv;
      totalFees += b.channelFee;
      totalShippingCost += b.shippingCost;
      const customerShip = typeof o.shippingAmount === "number" ? o.shippingAmount : 0;
      if (customerShip === 0 || o.isFreeShippingSubsidized) {
        freeShippingSubsidizedCount += 1;
        subsidizedFreeShippingTotal += b.shippingCost;
      }
    });

    gross = roundCurrency(gross);
    totalCmv = roundCurrency(totalCmv);
    totalFees = roundCurrency(totalFees);
    totalShippingCost = roundCurrency(totalShippingCost);
    subsidizedFreeShippingTotal = roundCurrency(subsidizedFreeShippingTotal);
    const averageShippingPerOrder =
      confirmedOrders.length > 0
        ? roundCurrency(totalShippingCost / confirmedOrders.length)
        : 0;

    let periodOpex = 0;
    if (monthlyOpex > 0) {
      if (selectedPeriod === "today") {
        periodOpex = roundCurrency(monthlyOpex / 30);
      } else if (selectedPeriod === "7days") {
        periodOpex = roundCurrency((monthlyOpex * 7) / 30);
      } else if (selectedPeriod === "12months") {
        periodOpex = roundCurrency(monthlyOpex * 12);
      } else {
        periodOpex = roundCurrency(monthlyOpex);
      }
    }

    const totalCosts = roundCurrency(
      totalCmv + totalFees + totalShippingCost + periodOpex
    );
    const netProfit = roundCurrency(gross - totalCosts);
    const marginPct = gross > 0 ? roundCurrency((netProfit / gross) * 100) : 0;
    const cmvPct = gross > 0 ? roundCurrency((totalCmv / gross) * 100) : 0;
    const feesPct = gross > 0 ? roundCurrency((totalFees / gross) * 100) : 0;
    const shippingPct =
      gross > 0 ? roundCurrency((totalShippingCost / gross) * 100) : 0;
    const opexPct = gross > 0 ? roundCurrency((periodOpex / gross) * 100) : 0;
    const costsPct = gross > 0 ? roundCurrency((totalCosts / gross) * 100) : 0;
    const ticketAverage =
      confirmedOrders.length > 0
        ? roundCurrency(gross / confirmedOrders.length)
        : 0;

    const pendingTotal = roundCurrency(
      pendingOrders.reduce((acc, o) => acc + o.totalAmount, 0)
    );
    const refundedTotal = roundCurrency(
      refundedOrders.reduce((acc, o) => acc + o.totalAmount, 0)
    );

    return {
      periodOrders,
      confirmedOrders,
      pendingOrders,
      refundedOrders,
      orderBreakdowns,
      gross,
      totalCmv,
      totalFees,
      totalShippingCost,
      averageShippingPerOrder,
      freeShippingSubsidizedCount,
      subsidizedFreeShippingTotal,
      periodOpex,
      totalCosts,
      netProfit,
      marginPct,
      cmvPct,
      feesPct,
      shippingPct,
      opexPct,
      costsPct,
      ticketAverage,
      pendingTotal,
      refundedTotal,
      allPendingCount,
      allPendingTotal,
    };
  }, [orders, products, channelFeeMap, selectedPeriod, monthlyOpex]);

  // Breakdown por Canal (Origem das Vendas & Marketplaces)
  const channelBreakdown = useMemo(() => {
    const byChannel = new Map<
      string,
      {
        count: number;
        revenue: number;
        fees: number;
        cmv: number;
        profit: number;
      }
    >();

    summary.confirmedOrders.forEach((o) => {
      const b = summary.orderBreakdowns.get(o.id)!;
      const key = o.channel;
      const existing = byChannel.get(key) || {
        count: 0,
        revenue: 0,
        fees: 0,
        cmv: 0,
        profit: 0,
      };
      byChannel.set(key, {
        count: existing.count + 1,
        revenue: roundCurrency(existing.revenue + o.totalAmount),
        fees: roundCurrency(existing.fees + b.channelFee),
        cmv: roundCurrency(existing.cmv + b.cmv),
        profit: roundCurrency(existing.profit + b.orderProfit),
      });
    });

    const list: Array<{
      code: string;
      name: string;
      color: string;
      feePct: number;
      count: number;
      revenue: number;
      fees: number;
      cmv: number;
      profit: number;
      sharePct: number;
    }> = [];

    // Lista canais conhecidos e garante presença visual de canais com vendas
    const knownKeys = new Set(channels.map((c) => c.code));
    Object.keys(CHANNEL_DEFAULTS).forEach((k) => knownKeys.add(k as ChannelType));

    knownKeys.forEach((code) => {
      const stats = byChannel.get(code) || {
        count: 0,
        revenue: 0,
        fees: 0,
        cmv: 0,
        profit: 0,
      };
      const fee =
        channelFeeMap[code] ?? CHANNEL_DEFAULTS[code]?.feePct ?? 0;
      const name = getChannelDisplayName(code, channels);
      const color = getChannelColor(code, channels);

      list.push({
        code,
        name,
        color,
        feePct: fee,
        ...stats,
        sharePct:
          summary.gross > 0
            ? roundCurrency((stats.revenue / summary.gross) * 100)
            : 0,
      });
    });

    return list.sort((a, b) => b.revenue - a.revenue);
  }, [channels, channelFeeMap, summary]);

  // Canal atualmente selecionado para detalhamento no gráfico de pizza
  const activeSelectedChannel = useMemo(() => {
    if (selectedChannelKey) {
      const found = channelBreakdown.find((c) => c.code === selectedChannelKey);
      if (found) return found;
    }
    // Fallback: canal com maior faturamento ou primeiro da lista
    return channelBreakdown[0] || null;
  }, [channelBreakdown, selectedChannelKey]);

  // Fatias do Gráfico Donut SVG
  const donutSlices = useMemo(() => {
    const total = summary.gross;
    const radius = 64;
    const circumference = 2 * Math.PI * radius; // ~402.12
    let accumulatedAngle = 0;

    const activeChannels = channelBreakdown.filter((c) => c.revenue > 0);

    if (total <= 0 || activeChannels.length === 0) {
      return {
        circumference,
        radius,
        slices: [] as Array<{
          code: string;
          strokeDasharray: string;
          strokeDashoffset: number;
          color: string;
          name: string;
          sharePct: number;
          revenue: number;
        }>,
      };
    }

    const slices = activeChannels.map((ch) => {
      const fraction = ch.revenue / total;
      const strokeLength = fraction * circumference;
      const offset = -accumulatedAngle;
      accumulatedAngle += strokeLength;

      return {
        code: ch.code,
        strokeDasharray: `${strokeLength.toFixed(2)} ${circumference.toFixed(2)}`,
        strokeDashoffset: offset,
        color: ch.color,
        name: ch.name,
        sharePct: ch.sharePct,
        revenue: ch.revenue,
      };
    });

    return { circumference, radius, slices };
  }, [summary.gross, channelBreakdown]);

  // Relatório Histórico de Desempenho dos Últimos 12 Meses
  const monthlyHistory = useMemo(() => {
    const now = new Date();
    const months: Array<{
      key: string;
      label: string;
      year: number;
      month: number;
      gross: number;
      cmv: number;
      fees: number;
      netProfit: number;
      ordersCount: number;
      marginPct: number;
    }> = [];

    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    // Gera os últimos 12 meses cronologicamente (do mais antigo ao mês atual)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const label = `${monthNames[m]}/${String(y).slice(2)}`;

      months.push({
        key,
        label,
        year: y,
        month: m,
        gross: 0,
        cmv: 0,
        fees: 0,
        netProfit: 0,
        ordersCount: 0,
        marginPct: 0,
      });
    }

    // Aloca pedidos confirmados da loja aos seus respectivos meses
    orders.forEach((o) => {
      if (!CONFIRMED_STATUSES.includes(o.status)) return;
      const od = new Date(o.createdAt);
      if (isNaN(od.getTime())) return;
      const oKey = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, "0")}`;
      const target = months.find((m) => m.key === oKey);
      if (target) {
        const b = computeOrderBreakdown(o, products, channelFeeMap);
        target.gross += o.totalAmount;
        target.cmv += b.cmv;
        target.fees += b.channelFee;
        target.netProfit += b.orderProfit;
        target.ordersCount += 1;
      }
    });

    // Subtrai despesa fixa mensal estimada se houver faturamento no mês
    months.forEach((m) => {
      m.gross = roundCurrency(m.gross);
      m.cmv = roundCurrency(m.cmv);
      m.fees = roundCurrency(m.fees);
      if (monthlyOpex > 0 && m.gross > 0) {
        m.netProfit = roundCurrency(m.netProfit - monthlyOpex);
      } else {
        m.netProfit = roundCurrency(m.netProfit);
      }
      m.marginPct =
        m.gross > 0 ? roundCurrency((m.netProfit / m.gross) * 100) : 0;
    });

    const maxMonthGross = Math.max(1, ...months.map((m) => m.gross));
    const total12MonthsGross = roundCurrency(
      months.reduce((acc, m) => acc + m.gross, 0)
    );
    const total12MonthsNet = roundCurrency(
      months.reduce((acc, m) => acc + m.netProfit, 0)
    );
    const total12MonthsOrders = months.reduce((acc, m) => acc + m.ordersCount, 0);

    return {
      months,
      maxMonthGross,
      total12MonthsGross,
      total12MonthsNet,
      total12MonthsOrders,
    };
  }, [orders, products, channelFeeMap, monthlyOpex]);

  // Pedidos Filtrados para a Tabela de Auditoria (Extrato)
  const extractOrders = useMemo(() => {
    return summary.periodOrders.filter((o) => {
      if (extractFilter === "confirmed")
        return CONFIRMED_STATUSES.includes(o.status);
      if (extractFilter === "pending") return o.status === "PENDENTE";
      if (extractFilter === "refunded")
        return REFUNDED_STATUSES.includes(o.status);
      return true;
    });
  }, [summary.periodOrders, extractFilter]);

  // Totais do Rodapé da Tabela de Auditoria
  const extractFooterTotals = useMemo(() => {
    const confirmedInView = extractOrders.filter((o) =>
      CONFIRMED_STATUSES.includes(o.status)
    );
    let revenue = 0;
    let cmvAndFees = 0;
    let shipping = 0;
    let costs = 0;
    let profitBeforeOpex = 0;

    confirmedInView.forEach((o) => {
      const b = summary.orderBreakdowns.get(o.id)!;
      revenue += o.totalAmount;
      cmvAndFees += b.cmv + b.channelFee;
      shipping += b.shippingCost;
      costs += b.totalOrderCosts;
      profitBeforeOpex += b.orderProfit;
    });

    revenue = roundCurrency(revenue);
    cmvAndFees = roundCurrency(cmvAndFees);
    shipping = roundCurrency(shipping);
    costs = roundCurrency(costs);
    profitBeforeOpex = roundCurrency(profitBeforeOpex);

    const includesOpex =
      (extractFilter === "all" || extractFilter === "confirmed") &&
      summary.periodOpex > 0;
    const totalCostsWithOpex = includesOpex
      ? roundCurrency(costs + summary.periodOpex)
      : costs;
    const finalProfit = includesOpex
      ? roundCurrency(profitBeforeOpex - summary.periodOpex)
      : profitBeforeOpex;

    return {
      confirmedCount: confirmedInView.length,
      revenue,
      cmvAndFees,
      shipping,
      costs,
      totalCostsWithOpex,
      profitBeforeOpex,
      finalProfit,
      includesOpex,
    };
  }, [extractOrders, extractFilter, summary]);

  // Exportar Relatório em CSV / Excel
  const handleDownloadCsv = () => {
    const periodLabelMap: Record<PeriodType, string> = {
      today: "Hoje",
      "7days": "Ultimos 7 Dias",
      current: "Este Mes",
      "12months": "Ultimos 12 Meses",
      all: "Todo o Periodo",
    };

    const rows: string[][] = [
      ["RELATORIO FINANCEIRO BIA MAKES - DRE E ANALISE GERENCIAL", periodLabelMap[selectedPeriod], ""],
      ["Data de Emissao", new Date().toLocaleString("pt-BR"), ""],
      [],
      ["INDICADOR", "VALOR (R$)", "PARTICIPACAO (%)"],
      ["Faturamento Bruto (Entrou)", summary.gross.toFixed(2).replace(".", ","), "100,00%"],
      ["(-) Custo de Mercadorias Vendidas (CMV)", (-summary.totalCmv).toFixed(2).replace(".", ","), `${summary.cmvPct.toFixed(2).replace(".", ",")}%`],
      ["(-) Comissoes & Taxas dos Canais", (-summary.totalFees).toFixed(2).replace(".", ","), `${summary.feesPct.toFixed(2).replace(".", ",")}%`],
      ["(-) Frete das Encomendas (Pago pela Loja)", (-summary.totalShippingCost).toFixed(2).replace(".", ","), `${summary.shippingPct.toFixed(2).replace(".", ",")}%`],
      ["(=) Margem de Contribuicao", (summary.gross - summary.totalCmv - summary.totalFees - summary.totalShippingCost).toFixed(2).replace(".", ","), ""],
      ["(-) Despesas Operacionais Fixas", (-summary.periodOpex).toFixed(2).replace(".", ","), `${summary.opexPct.toFixed(2).replace(".", ",")}%`],
      ["(=) Lucro Liquido Real (Sobrou)", summary.netProfit.toFixed(2).replace(".", ","), `${summary.marginPct.toFixed(2).replace(".", ",")}%`],
      [],
      ["ORIGEM / CANAL DE VENDA", "PEDIDOS", "RECEITA (R$)", "TAXA (%)", "LUCRO LIQUIDO (R$)"],
      ...channelBreakdown.map((ch) => [
        `"${ch.name}"`,
        String(ch.count),
        ch.revenue.toFixed(2).replace(".", ","),
        `${ch.feePct.toFixed(1).replace(".", ",")}%`,
        ch.profit.toFixed(2).replace(".", ","),
      ]),
      [],
      ["PEDIDO", "DATA", "CLIENTE", "CANAL", "TRANSPORTADORA", "STATUS", "VALOR PAGO (R$)", "CMV + TAXAS (R$)", "FRETE LOJA (R$)", "LUCRO (R$)"],
      ...summary.periodOrders.map((o) => {
        const b = summary.orderBreakdowns.get(o.id)!;
        const isConfirmed = CONFIRMED_STATUSES.includes(o.status);
        return [
          o.orderNumber,
          formatDate(o.createdAt),
          `"${o.customerName.replace(/"/g, '""')}"`,
          getChannelDisplayName(o.channel, channels),
          `"${(o.shippingCarrier || "Correios PAC").replace(/"/g, '""')}"`,
          STATUS_LABELS[o.status] || o.status,
          o.totalAmount.toFixed(2).replace(".", ","),
          roundCurrency(b.cmv + b.channelFee).toFixed(2).replace(".", ","),
          b.shippingCost.toFixed(2).replace(".", ","),
          isConfirmed ? b.orderProfit.toFixed(2).replace(".", ",") : "0,00",
        ];
      }),
    ];

    const csvString = "\uFEFF" + rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Financeiro_BiaMakes_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Alturas Proporcionais para o Gráfico de Torres
  const towerScale = Math.max(summary.gross, summary.totalCosts, 1);
  const grossHeightPct = summary.gross > 0 ? (summary.gross / towerScale) * 100 : 0;
  const cmvHeightPct = summary.gross > 0 ? (summary.totalCmv / towerScale) * 100 : 0;
  const feesHeightPct = summary.gross > 0 ? (summary.totalFees / towerScale) * 100 : 0;
  const shippingHeightPct =
    summary.gross > 0 ? (summary.totalShippingCost / towerScale) * 100 : 0;
  const opexHeightPct = summary.gross > 0 ? (summary.periodOpex / towerScale) * 100 : 0;
  const netHeightPct =
    summary.netProfit > 0 ? (summary.netProfit / towerScale) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ================================================================= */}
      {/* 1. CABEÇALHO EXECUTIVO + SELETOR DE PERÍODO                       */}
      {/* ================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-[11px] font-extrabold text-[#7A3F51] uppercase tracking-wider">
              Controladoria & BI
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Sincronização em Tempo Real
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#39313A] tracking-tight mt-1.5">
            Gestão Financeira & DRE Gerencial
          </h2>
          <p className="text-xs sm:text-sm text-[#39313A]/75 mt-0.5">
            Acompanhamento profissional de faturamento bruto, custos de produtos (CMV), taxas de canais e lucro líquido real no caixa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#FAF7F8] border border-[#E9D9CD]">
            {[
              { id: "today" as const, label: "Hoje" },
              { id: "7days" as const, label: "7 Dias" },
              { id: "current" as const, label: "Este Mês" },
              { id: "12months" as const, label: "Últimos 12 Meses" },
              { id: "all" as const, label: "Todo o Período" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === p.id
                    ? "bg-[#7A3F51] text-white shadow-sm"
                    : "text-[#39313A] hover:bg-[#F5DDE5]/60"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-full bg-[#FAF0F4] hover:bg-[#F5DDE5] text-[#7A3F51] border border-[#E9D9CD] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>

      {/* BANNER INFORMATIVO SE HOUVER PEDIDOS PENDENTES AGUARDANDO APROVAÇÃO */}
      {summary.allPendingCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-950">
                {summary.allPendingCount}{" "}
                {summary.allPendingCount === 1
                  ? "pedido aguardando confirmação de pagamento"
                  : "pedidos aguardando confirmação de pagamento"}{" "}
                ({formatCurrency(summary.allPendingTotal)})
              </h3>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                Esses pedidos estão na fila com status <strong>PENDENTE</strong>. Assim que marcados como <strong>PAGO</strong> na aba Pedidos, os valores e lucros entram automaticamente nos gráficos e no DRE abaixo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCrmActiveTab("orders")}
            className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors shadow-xs"
          >
            Ver Pedidos Pendentes
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. CARDS EXECUTIVOS PRINCIPAIS (3 PILARES FINANCEIROS)             */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: FATURAMENTO BRUTO */}
        <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FAF0F4] rounded-bl-full -z-0 opacity-60" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A3F51]">
                Faturamento Bruto
              </span>
              <div className="w-9 h-9 rounded-2xl bg-[#FAF0F4] border border-[#E9D9CD] flex items-center justify-center text-[#7A3F51]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#7A3F51] tracking-tight">
              {formatCurrency(summary.gross)}
            </div>
          </div>
          <div className="relative z-10 pt-4 mt-4 border-t border-[#E9D9CD]/70 flex items-center justify-between text-xs text-[#39313A]/75 font-semibold">
            <span>
              {summary.confirmedOrders.length}{" "}
              {summary.confirmedOrders.length === 1 ? "venda paga" : "vendas pagas"}
            </span>
            <span>Ticket Médio: {formatCurrency(summary.ticketAverage)}</span>
          </div>
        </div>

        {/* CARD 2: CUSTOS TOTAIS & DEDUÇÕES */}
        <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-0 opacity-60" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
                Custos & Deduções Totais
              </span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
              - {formatCurrency(summary.totalCosts)}
            </div>
          </div>
          <div className="relative z-10 pt-4 mt-4 border-t border-rose-100 flex items-center justify-between gap-2 text-xs text-[#39313A]/75 font-semibold">
            <span className="truncate">
              CMV: {formatCurrency(summary.totalCmv)} · Taxas: {formatCurrency(summary.totalFees)} · Frete: {formatCurrency(summary.totalShippingCost)}
            </span>
            <span className="font-bold text-rose-600 shrink-0">
              {summary.costsPct.toFixed(1).replace(".", ",")}% da receita
            </span>
          </div>
        </div>

        {/* CARD 3: LUCRO LÍQUIDO REAL NO BOLSO */}
        <div
          className={`p-6 rounded-3xl border-2 shadow-sm relative overflow-hidden flex flex-col justify-between ${
            summary.netProfit >= 0
              ? "bg-emerald-50/70 border-emerald-400"
              : "bg-rose-50/80 border-rose-400"
          }`}
        >
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  summary.netProfit >= 0 ? "text-emerald-800" : "text-rose-700"
                }`}
              >
                Lucro Líquido Real (No Bolso)
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                  summary.netProfit >= 0
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-rose-100 text-rose-800 border-rose-300"
                }`}
              >
                Margem: {summary.marginPct.toFixed(1).replace(".", ",")}%
              </span>
            </div>
            <div
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                summary.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {summary.netProfit < 0
                ? `- ${formatCurrency(Math.abs(summary.netProfit))}`
                : formatCurrency(summary.netProfit)}
            </div>
          </div>
          <div
            className={`relative z-10 pt-4 mt-4 border-t text-xs font-bold ${
              summary.netProfit >= 0
                ? "text-emerald-900 border-emerald-200"
                : "text-rose-900 border-rose-200"
            }`}
          >
            {summary.gross > 0
              ? summary.netProfit >= 0
                ? `De cada R$ 100 vendidos, ${formatCurrency(summary.marginPct)} ficam limpos no caixa da empresa.`
                : `Prejuízo de ${formatCurrency(Math.abs(summary.marginPct))} a cada R$ 100 vendidos neste período.`
              : "Aguardando primeiras vendas confirmadas no período para apurar lucro."}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. GRÁFICOS VISUAIS DE INTELIGÊNCIA FINANCEIRA                     */}
      {/*    A) Gráfico de Torres / Colunas: Desempenho e Estrutura         */}
      {/*    B) Gráfico de Pizza / Rosca Interativo: Origem das Vendas      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO DE TORRES / COLUNAS (7 COLUNAS) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7A3F51]" />
                <h3 className="font-display text-lg font-extrabold text-[#39313A]">
                  Gráfico Comparativo de Desempenho
                </h3>
              </div>
              <p className="text-xs text-[#39313A]/70 mt-0.5">
                Visualização em torres comparando Faturamento Bruto vs Lucro Líquido e a absorção de cada custo.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#FAF7F8] border border-[#E9D9CD] text-[11px] font-bold text-[#7A3F51] shrink-0">
              Escala Proporcional
            </span>
          </div>

          {/* ÁREA DO GRÁFICO DE BARRAS / TORRES */}
          <div className="bg-[#FAF7F8]/70 border border-[#E9D9CD]/80 rounded-2xl p-5 pt-8 min-h-[260px] flex flex-col justify-end">
            <div className="grid grid-cols-6 items-end gap-2 sm:gap-3 h-48 border-b-2 border-[#E9D9CD] pb-2">
              {/* TORRE 1: FATURAMENTO BRUTO */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] sm:text-[11px] font-extrabold text-[#7A3F51] mb-1.5 opacity-90 group-hover:scale-105 transition-transform text-center whitespace-nowrap">
                  {summary.gross > 0 ? formatCurrency(summary.gross) : "R$ 0,00"}
                </div>
                <div className="w-full max-w-[52px] bg-gray-200/50 rounded-t-xl h-full flex items-end">
                  <div
                    style={{ height: `${Math.max(grossHeightPct, 6)}%` }}
                    className="w-full rounded-t-xl bg-gradient-to-t from-[#5a2c3b] to-[#7A3F51] transition-all duration-700 shadow-sm"
                  />
                </div>
                <div className="text-center mt-2.5">
                  <span className="block text-[10px] sm:text-[11px] font-extrabold text-[#7A3F51] truncate max-w-[64px]">
                    Faturamento
                  </span>
                  <span className="block text-[10px] font-bold text-[#7A3F51]/70">
                    100%
                  </span>
                </div>
              </div>

              {/* TORRE 2: CMV (PRODUTOS) */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] sm:text-[11px] font-extrabold text-rose-600 mb-1.5 opacity-90 group-hover:scale-105 transition-transform text-center whitespace-nowrap">
                  {summary.totalCmv > 0 ? formatCurrency(summary.totalCmv) : "R$ 0,00"}
                </div>
                <div className="w-full max-w-[52px] bg-gray-200/50 rounded-t-xl h-full flex items-end">
                  <div
                    style={{ height: `${Math.max(cmvHeightPct, summary.totalCmv > 0 ? 6 : 2)}%` }}
                    className="w-full rounded-t-xl bg-gradient-to-t from-rose-500 to-rose-400 transition-all duration-700 shadow-sm"
                  />
                </div>
                <div className="text-center mt-2.5">
                  <span className="block text-[10px] sm:text-[11px] font-extrabold text-rose-700 truncate max-w-[64px]">
                    Produtos
                  </span>
                  <span className="block text-[10px] font-bold text-rose-600/80">
                    {summary.cmvPct.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
              </div>

              {/* TORRE 3: FRETE PAGO PELA LOJA */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] sm:text-[11px] font-extrabold text-orange-600 mb-1.5 opacity-90 group-hover:scale-105 transition-transform text-center whitespace-nowrap">
                  {summary.totalShippingCost > 0 ? formatCurrency(summary.totalShippingCost) : "R$ 0,00"}
                </div>
                <div className="w-full max-w-[52px] bg-gray-200/50 rounded-t-xl h-full flex items-end">
                  <div
                    style={{ height: `${Math.max(shippingHeightPct, summary.totalShippingCost > 0 ? 6 : 2)}%` }}
                    className="w-full rounded-t-xl bg-gradient-to-t from-orange-500 to-orange-400 transition-all duration-700 shadow-sm"
                  />
                </div>
                <div className="text-center mt-2.5">
                  <span className="block text-[10px] sm:text-[11px] font-extrabold text-orange-700 truncate max-w-[64px]">
                    Frete Loja
                  </span>
                  <span className="block text-[10px] font-bold text-orange-600/80">
                    {summary.shippingPct.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
              </div>

              {/* TORRE 4: TAXAS DE CANAIS */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 mb-1.5 opacity-90 group-hover:scale-105 transition-transform text-center whitespace-nowrap">
                  {summary.totalFees > 0 ? formatCurrency(summary.totalFees) : "R$ 0,00"}
                </div>
                <div className="w-full max-w-[52px] bg-gray-200/50 rounded-t-xl h-full flex items-end">
                  <div
                    style={{ height: `${Math.max(feesHeightPct, summary.totalFees > 0 ? 6 : 2)}%` }}
                    className="w-full rounded-t-xl bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-700 shadow-sm"
                  />
                </div>
                <div className="text-center mt-2.5">
                  <span className="block text-[10px] sm:text-[11px] font-extrabold text-amber-800 truncate max-w-[64px]">
                    Taxas
                  </span>
                  <span className="block text-[10px] font-bold text-amber-600/80">
                    {summary.feesPct.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
              </div>

              {/* TORRE 5: GASTOS FIXOS */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] sm:text-[11px] font-extrabold text-[#9C5B6F] mb-1.5 opacity-90 group-hover:scale-105 transition-transform text-center whitespace-nowrap">
                  {summary.periodOpex > 0 ? formatCurrency(summary.periodOpex) : "R$ 0,00"}
                </div>
                <div className="w-full max-w-[52px] bg-gray-200/50 rounded-t-xl h-full flex items-end">
                  <div
                    style={{ height: `${Math.max(opexHeightPct, summary.periodOpex > 0 ? 6 : 2)}%` }}
                    className="w-full rounded-t-xl bg-gradient-to-t from-[#9C5B6F] to-[#C69A76] transition-all duration-700 shadow-sm"
                  />
                </div>
                <div className="text-center mt-2.5">
                  <span className="block text-[10px] sm:text-[11px] font-extrabold text-[#9C5B6F] truncate max-w-[64px]">
                    Fixos
                  </span>
                  <span className="block text-[10px] font-bold text-[#9C5B6F]/80">
                    {summary.opexPct.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
              </div>

              {/* TORRE 6: LUCRO LÍQUIDO REAL */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 mb-1.5 opacity-90 group-hover:scale-105 transition-transform text-center whitespace-nowrap">
                  {summary.netProfit > 0 ? formatCurrency(summary.netProfit) : "R$ 0,00"}
                </div>
                <div className="w-full max-w-[52px] bg-gray-200/50 rounded-t-xl h-full flex items-end">
                  <div
                    style={{ height: `${Math.max(netHeightPct, summary.netProfit > 0 ? 6 : 2)}%` }}
                    className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700 shadow-sm"
                  />
                </div>
                <div className="text-center mt-2.5">
                  <span className="block text-[10px] sm:text-[11px] font-extrabold text-emerald-800 truncate max-w-[64px]">
                    Lucro Real
                  </span>
                  <span className="block text-[10px] font-bold text-emerald-600/90">
                    {summary.marginPct.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LEGENDA HORIZONTAL DA ESTRUTURA DE RESULTADO */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-[#FAF0F4] border border-[#E9D9CD]/70 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#7A3F51] shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Faturamento</span>
                <span className="font-extrabold text-[#7A3F51]">{formatCurrency(summary.gross)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Produtos (CMV)</span>
                <span className="font-extrabold text-rose-700">{formatCurrency(summary.totalCmv)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200/70 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-orange-800 uppercase block">Frete Loja</span>
                <span className="font-extrabold text-orange-800">{formatCurrency(summary.totalShippingCost)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Taxas Canais</span>
                <span className="font-extrabold text-amber-800">{formatCurrency(summary.totalFees)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center gap-2 col-span-2 sm:col-span-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Real</span>
                <span className="font-extrabold text-emerald-800">{formatCurrency(summary.netProfit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICO DE PIZZA / ROSCA INTERATIVO (5 COLUNAS) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#7A3F51]" />
                <h3 className="font-display text-lg font-extrabold text-[#39313A]">
                  Origem das Vendas & Canais
                </h3>
              </div>
              <p className="text-xs text-[#39313A]/70 mt-0.5">
                Clique nos canais para inspecionar faturamento, taxas e lucro individual.
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-[10px] font-bold text-[#7A3F51] shrink-0">
              Interativo
            </span>
          </div>

          {/* VISUALIZAÇÃO DO DONUT SVG */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Círculo de fundo */}
                <circle
                  cx="80"
                  cy="80"
                  r={donutSlices.radius}
                  fill="transparent"
                  stroke="#FAF7F8"
                  strokeWidth="24"
                />

                {donutSlices.slices.length > 0 ? (
                  donutSlices.slices.map((slice) => {
                    const isSelected = activeSelectedChannel?.code === slice.code;
                    return (
                      <circle
                        key={slice.code}
                        cx="80"
                        cy="80"
                        r={donutSlices.radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isSelected ? "28" : "24"}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="cursor-pointer transition-all duration-300 hover:opacity-80"
                        onClick={() => setSelectedChannelKey(slice.code)}
                      />
                    );
                  })
                ) : (
                  <circle
                    cx="80"
                    cy="80"
                    r={donutSlices.radius}
                    fill="transparent"
                    stroke="#E9D9CD"
                    strokeWidth="24"
                    strokeDasharray="6 6"
                  />
                )}
              </svg>

              {/* Informação central do Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  {donutSlices.slices.length > 0 ? "Faturado" : "Pronto"}
                </span>
                <span className="text-sm font-extrabold text-[#7A3F51] leading-tight">
                  {formatCurrency(summary.gross)}
                </span>
                <span className="text-[10px] font-bold text-gray-600 mt-0.5">
                  {summary.confirmedOrders.length} {summary.confirmedOrders.length === 1 ? "venda" : "vendas"}
                </span>
              </div>
            </div>

            {/* CARD DETALHADO DO CANAL SELECIONADO */}
            {activeSelectedChannel && (
              <div className="flex-1 w-full bg-[#FAF7F8] p-4 rounded-2xl border border-[#E9D9CD]/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#E9D9CD] flex items-center justify-center shrink-0">
                      {renderChannelIcon(activeSelectedChannel.code)}
                    </div>
                    <span className="text-xs font-extrabold text-[#39313A] truncate max-w-[130px]">
                      {activeSelectedChannel.name}
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white shrink-0"
                    style={{ backgroundColor: activeSelectedChannel.color }}
                  >
                    {activeSelectedChannel.sharePct.toFixed(1).replace(".", ",")}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E9D9CD]/60 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block font-medium">Faturamento:</span>
                    <span className="font-extrabold text-[#7A3F51]">
                      {formatCurrency(activeSelectedChannel.revenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block font-medium">Taxa do Canal:</span>
                    <span className="font-extrabold text-amber-700">
                      {activeSelectedChannel.feePct.toFixed(1).replace(".", ",")}% ({formatCurrency(activeSelectedChannel.fees)})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block font-medium">Lucro do Canal:</span>
                    <span
                      className={`font-extrabold ${
                        activeSelectedChannel.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {formatCurrency(activeSelectedChannel.profit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block font-medium">Vendas:</span>
                    <span className="font-extrabold text-[#39313A]">
                      {activeSelectedChannel.count} {activeSelectedChannel.count === 1 ? "pedido" : "pedidos"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LISTA / SELETOR RÁPIDO DE CANAIS */}
          <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
            {channelBreakdown.slice(0, 7).map((ch) => {
              const isSelected = activeSelectedChannel?.code === ch.code;
              return (
                <button
                  key={ch.code}
                  type="button"
                  onClick={() => setSelectedChannelKey(ch.code)}
                  className={`w-full p-2.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#FAF0F4] border-[#7A3F51] shadow-xs"
                      : "bg-[#FAF7F8] border-[#E9D9CD]/70 hover:bg-[#F5DDE5]/40"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ch.color }}
                    />
                    <span className="text-xs font-bold text-[#39313A] truncate">
                      {ch.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-extrabold text-[#7A3F51]">
                      {formatCurrency(ch.revenue)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {ch.count} ped.
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. EVOLUÇÃO HISTÓRICA DOS ÚLTIMOS 12 MESES (BARRAS + TABELA)      */}
      {/* ================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7A3F51]" />
              <h3 className="font-display text-lg font-extrabold text-[#39313A]">
                Evolução Histórica dos Últimos 12 Meses
              </h3>
            </div>
            <p className="text-xs text-[#39313A]/70 mt-0.5">
              Acompanhamento mensal comparando Faturamento Bruto vs Lucro Líquido Real para tomada de decisão estratégica.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-[#7A3F51]">
              <span className="w-3 h-3 rounded-sm bg-[#7A3F51]" />
              Faturamento
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              Lucro Líquido
            </span>
          </div>
        </div>

        {/* GRÁFICO HISTÓRICO DE BARRAS VERTICAIS MÊS A MÊS */}
        <div className="bg-[#FAF7F8]/80 p-5 rounded-2xl border border-[#E9D9CD]/80">
          <div className="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-48 border-b-2 border-[#E9D9CD] pb-2">
            {monthlyHistory.months.map((m, idx) => {
              const grossBarPct =
                monthlyHistory.maxMonthGross > 0
                  ? (m.gross / monthlyHistory.maxMonthGross) * 100
                  : 0;
              const netBarPct =
                monthlyHistory.maxMonthGross > 0 && m.netProfit > 0
                  ? (m.netProfit / monthlyHistory.maxMonthGross) * 100
                  : 0;
              const isHovered = hoveredMonthIndex === idx;

              return (
                <div
                  key={m.key}
                  onMouseEnter={() => setHoveredMonthIndex(idx)}
                  onMouseLeave={() => setHoveredMonthIndex(null)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip ao passar o mouse */}
                  {isHovered && (
                    <div className="absolute -top-20 z-30 p-2.5 rounded-xl bg-[#39313A] text-white text-[11px] font-medium shadow-xl pointer-events-none whitespace-nowrap">
                      <div className="font-extrabold text-[#C69A76]">{m.label}</div>
                      <div>Faturado: {formatCurrency(m.gross)}</div>
                      <div className="text-emerald-400">Lucro: {formatCurrency(m.netProfit)} ({m.marginPct.toFixed(1).replace(".", ",")}%)</div>
                      <div className="text-gray-300">{m.ordersCount} pedidos</div>
                    </div>
                  )}

                  {/* Barras Lado a Lado (Faturamento vs Lucro) */}
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                    {/* Barra Faturamento */}
                    <div
                      style={{ height: `${Math.max(grossBarPct, m.gross > 0 ? 8 : 2)}%` }}
                      className={`w-1/2 rounded-t-md transition-all duration-300 ${
                        m.gross > 0
                          ? "bg-[#7A3F51] group-hover:bg-[#9C5B6F]"
                          : "bg-gray-300/40"
                      }`}
                    />
                    {/* Barra Lucro */}
                    <div
                      style={{ height: `${Math.max(netBarPct, m.netProfit > 0 ? 8 : 2)}%` }}
                      className={`w-1/2 rounded-t-md transition-all duration-300 ${
                        m.netProfit > 0
                          ? "bg-emerald-500 group-hover:bg-emerald-400"
                          : "bg-gray-300/40"
                      }`}
                    />
                  </div>

                  <span className="text-[10px] sm:text-[11px] font-bold text-[#39313A] mt-2 block truncate">
                    {m.label.split("/")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2 font-medium">
            <span>
              Total acumulado em 12 meses:{" "}
              <strong className="text-[#7A3F51] font-extrabold">
                {formatCurrency(monthlyHistory.total12MonthsGross)}
              </strong>{" "}
              ({monthlyHistory.total12MonthsOrders} pedidos)
            </span>
            <span>
              Lucro líquido acumulado:{" "}
              <strong className="text-emerald-700 font-extrabold">
                {formatCurrency(monthlyHistory.total12MonthsNet)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. DRE GERENCIAL ESTRUTURADO (PASSO A PASSO CONTÁBIL)             */}
      {/* ================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7A3F51]" />
              <h3 className="font-display text-lg font-extrabold text-[#39313A]">
                Demonstrativo do Resultado do Exercício (DRE Gerencial)
              </h3>
            </div>
            <p className="text-xs text-[#39313A]/70 mt-0.5">
              Cálculo auditável deduzindo CMV, taxas de canais e despesas fixas para apuração do lucro líquido real.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-[11px] font-bold text-[#7A3F51] shrink-0 self-start sm:self-auto">
            Padrão Contábil B2C / E-commerce
          </span>
        </div>

        <div className="space-y-3">
          {/* 1. RECEITA BRUTA DE VENDAS */}
          <div className="p-4 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/80 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FAF0F4] text-[#7A3F51] shrink-0 mt-0.5">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#39313A]">
                  (+) Faturamento Bruto de Vendas
                </div>
                <div className="text-xs text-[#39313A]/70">
                  Total de pedidos confirmados e pagos pelos clientes no período.
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-extrabold text-[#7A3F51]">
                + {formatCurrency(summary.gross)}
              </div>
              <div className="text-[11px] font-semibold text-gray-500">
                100,0%
              </div>
            </div>
          </div>

          {/* 2. CUSTO DAS MERCADORIAS VENDIDAS (CMV) */}
          <div className="p-4 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/80 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#39313A]">
                  (-) Custo de Mercadorias Vendidas (CMV)
                </div>
                <div className="text-xs text-[#39313A]/70">
                  Valor pago aos fornecedores e fabricantes pelos produtos que saíram do estoque.
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-extrabold text-rose-600">
                - {formatCurrency(summary.totalCmv)}
              </div>
              <div className="text-[11px] font-semibold text-rose-600">
                {summary.cmvPct.toFixed(1).replace(".", ",")}%
              </div>
            </div>
          </div>

          {/* 3. TAXAS DE MARKETPLACES E CANAIS */}
          <div className="p-4 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/80 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#39313A]">
                  (-) Comissões & Taxas dos Canais de Venda
                </div>
                <div className="text-xs text-[#39313A]/70">
                  Comissões de Mercado Livre, Shopee, intermediadores e gateways de pagamento.
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-extrabold text-amber-700">
                - {formatCurrency(summary.totalFees)}
              </div>
              <div className="text-[11px] font-semibold text-amber-700">
                {summary.feesPct.toFixed(1).replace(".", ",")}%
              </div>
            </div>
          </div>

          {/* 3.5. FRETE DAS ENCOMENDAS (PAGO PELA LOJA ÀS TRANSPORTADORAS) */}
          <div className="p-4 rounded-2xl bg-orange-50/70 border-2 border-orange-200 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-orange-100 text-orange-700 shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#39313A]">
                  (-) Frete das Encomendas (Pago pela Loja às Transportadoras)
                </div>
                <div className="text-xs text-[#39313A]/80 mt-0.5">
                  Total pago pela Bia Makes para enviar {summary.confirmedOrders.length}{" "}
                  {summary.confirmedOrders.length === 1 ? "encomenda" : "encomendas"} (Média de{" "}
                  <strong>{formatCurrency(summary.averageShippingPerOrder)}</strong> de frete por encomenda ·{" "}
                  <strong>{summary.freeShippingSubsidizedCount}</strong>{" "}
                  {summary.freeShippingSubsidizedCount === 1
                    ? "pedido com Frete Grátis bancado pela loja"
                    : "pedidos com Frete Grátis bancado pela loja"}
                  ).
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-extrabold text-orange-700">
                - {formatCurrency(summary.totalShippingCost)}
              </div>
              <div className="text-[11px] font-semibold text-orange-700">
                {summary.shippingPct.toFixed(1).replace(".", ",")}%
              </div>
            </div>
          </div>

          {/* 4. MARGEM DE CONTRIBUIÇÃO / LUCRO BRUTO */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4 font-semibold text-xs text-[#39313A]">
            <span>(=) Margem de Contribuição / Lucro Bruto Operacional</span>
            <span className="font-extrabold text-[#7A3F51]">
              {formatCurrency(
                summary.gross - summary.totalCmv - summary.totalFees - summary.totalShippingCost
              )}
            </span>
          </div>

          {/* 5. GASTOS FIXOS OPERACIONAIS (EDITÁVEL INLINE) */}
          <div className="p-4 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/80 space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#E9D9CD] text-[#7A3F51] shrink-0 mt-0.5">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#39313A] flex flex-wrap items-center gap-2">
                    <span>(-) Despesas Fixas da Loja (Embalagens, Internet, Aluguel, Outros)</span>
                    {!isEditingOpex && (
                      <button
                        type="button"
                        onClick={handleOpenEditOpex}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#E9D9CD] text-[#7A3F51] text-[11px] font-bold hover:bg-[#FAF0F4] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Definir valor mensal</span>
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-[#39313A]/70">
                    Base mensal: {formatCurrency(monthlyOpex)}
                    {selectedPeriod === "today" && monthlyOpex > 0 && " (dividido por 30)"}
                    {selectedPeriod === "7days" && monthlyOpex > 0 && " (proporcional a 7 dias)"}
                    {selectedPeriod === "12months" && monthlyOpex > 0 && " (multiplicado por 12)"}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-extrabold text-[#9C5B6F]">
                  - {formatCurrency(summary.periodOpex)}
                </div>
                <div className="text-[11px] font-semibold text-[#9C5B6F]">
                  {summary.opexPct.toFixed(1).replace(".", ",")}%
                </div>
              </div>
            </div>

            {isEditingOpex && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E9D9CD]/70">
                <span className="text-xs font-bold text-[#7A3F51]">
                  Gasto fixo mensal da Bia Makes (R$):
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 450,00"
                  value={opexDraft}
                  onChange={(e) => setOpexDraft(e.target.value)}
                  className="w-36 px-3 py-1.5 text-xs bg-white rounded-xl border border-[#9C5B6F] focus:outline-none font-bold text-[#39313A]"
                />
                <button
                  type="button"
                  onClick={handleSaveOpex}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingOpex(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E9D9CD] text-gray-600 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>

          {/* 6. LUCRO LÍQUIDO REAL NO CAIXA */}
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 ${
              summary.netProfit >= 0
                ? "bg-emerald-50/70 border-emerald-400"
                : "bg-rose-50/80 border-rose-400"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  summary.netProfit >= 0
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div
                  className={`text-base font-extrabold ${
                    summary.netProfit >= 0 ? "text-emerald-900" : "text-rose-900"
                  }`}
                >
                  (=) Lucro Líquido Real Final (No Bolso)
                </div>
                <div
                  className={`text-xs ${
                    summary.netProfit >= 0 ? "text-emerald-800" : "text-rose-800"
                  }`}
                >
                  Resultado real final disponível após cobrir produtos, intermediadores e custos da loja.
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-xl font-extrabold ${
                  summary.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                ={" "}
                {summary.netProfit < 0
                  ? `- ${formatCurrency(Math.abs(summary.netProfit))}`
                  : formatCurrency(summary.netProfit)}
              </div>
              <div
                className={`text-xs font-bold ${
                  summary.netProfit >= 0 ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                Margem Líquida: {summary.marginPct.toFixed(1).replace(".", ",")}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 6. EXTRATO RECONCILIADO DE PEDIDOS (AUDITORIA PEDIDO A PEDIDO)     */}
      {/* ================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-extrabold text-[#39313A]">
              Extrato de Pedidos do Período (Composição Detalhada)
            </h3>
            <p className="text-xs text-[#39313A]/70 mt-0.5">
              Auditoria pedido por pedido: valor faturado, custos e lucro apurado no caixa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all" as const, label: `Todos (${summary.periodOrders.length})` },
              {
                id: "confirmed" as const,
                label: `Confirmados (${summary.confirmedOrders.length})`,
              },
              {
                id: "pending" as const,
                label: `Pendentes (${summary.pendingOrders.length})`,
              },
              {
                id: "refunded" as const,
                label: `Cancelados/Devolvidos (${summary.refundedOrders.length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setExtractFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  extractFilter === f.id
                    ? "bg-[#7A3F51] text-white border-[#7A3F51] shadow-xs"
                    : "bg-[#FAF7F8] text-[#39313A] border-[#E9D9CD] hover:bg-[#FAF0F4]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E9D9CD] text-[11px] font-extrabold uppercase tracking-wider text-[#7A3F51]/80 bg-[#FAF7F8]">
                <th className="py-3 px-4 rounded-tl-2xl">Pedido & Data</th>
                <th className="py-3 px-4">Cliente & Canal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Valor Pago pela Cliente</th>
                <th className="py-3 px-4 text-right">Custo Produtos + Taxa Canal</th>
                <th className="py-3 px-4 text-right">Frete Pago pela Loja</th>
                <th className="py-3 px-4 text-right rounded-tr-2xl">Lucro Limpo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9D9CD]/60 text-xs">
              {extractOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#39313A]/70">
                    Nenhum pedido encontrado neste filtro e período.
                  </td>
                </tr>
              ) : (
                extractOrders.map((order) => {
                  const b = summary.orderBreakdowns.get(order.id) || {
                    cmv: 0,
                    channelFee: 0,
                    shippingCost: resolveOrderCompanyShippingCost(order),
                    totalOrderCosts: 0,
                    orderProfit: 0,
                  };
                  const cmvAndFee = roundCurrency(b.cmv + b.channelFee);
                  const carrierName = order.shippingCarrier || "Correios PAC";
                  const isFreeShip =
                    (typeof order.shippingAmount === "number" ? order.shippingAmount : 0) === 0 ||
                    Boolean(order.isFreeShippingSubsidized);
                  const isConfirmed = CONFIRMED_STATUSES.includes(order.status);
                  const isPending = order.status === "PENDENTE";
                  const isRefunded = REFUNDED_STATUSES.includes(order.status);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#FAF7F8]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#7A3F51]">
                          #{order.orderNumber}
                        </div>
                        <div className="text-[11px] text-[#39313A]/70">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#39313A]">
                          {order.customerName}
                        </div>
                        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-[10px] font-bold text-[#7A3F51]">
                          {getChannelDisplayName(order.channel, channels)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>No Caixa ({STATUS_LABELS[order.status]})</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Aguardando Pagto</span>
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                            <RotateCcw className="w-3 h-3" />
                            <span>Estornado ({STATUS_LABELS[order.status]})</span>
                          </span>
                        )}
                      </td>

                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          isRefunded
                            ? "text-gray-400 line-through"
                            : isPending
                            ? "text-amber-800"
                            : "text-[#39313A]"
                        }`}
                      >
                        + {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-rose-600/90">
                        {isRefunded ? (
                          <span className="text-gray-400 line-through">
                            - {formatCurrency(cmvAndFee)}
                          </span>
                        ) : (
                          <div>
                            <span>- {formatCurrency(cmvAndFee)}</span>
                            <div className="text-[10px] text-gray-500 font-normal">
                              CMV {formatCurrency(b.cmv)} · Taxa {formatCurrency(b.channelFee)}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-orange-700">
                        {isRefunded ? (
                          <span className="text-gray-400 line-through">
                            - {formatCurrency(b.shippingCost)}
                          </span>
                        ) : (
                          <div>
                            <span>- {formatCurrency(b.shippingCost)}</span>
                            <div className="text-[10px] text-gray-500 font-normal">
                              {carrierName}
                              {isFreeShip ? " (Frete Grátis)" : ""}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isConfirmed && (
                          <span
                            className={`font-extrabold ${
                              b.orderProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            = {formatCurrency(b.orderProfit)}
                          </span>
                        )}
                        {isPending && (
                          <span className="text-amber-700 font-bold text-[11px] inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Aguardando
                          </span>
                        )}
                        {isRefunded && (
                          <span className="text-gray-400 line-through font-semibold">
                            = {formatCurrency(b.orderProfit)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* RODAPÉ DO EXTRATO BATENDO COM O DRE */}
            <tfoot className="border-t-2 border-[#E9D9CD] bg-[#FAF7F8] text-xs">
              {extractFooterTotals.includesOpex && (
                <tr className="text-[#39313A]/80 border-b border-[#E9D9CD]/60">
                  <td colSpan={3} className="py-2.5 px-4 font-semibold">
                    Despesas Fixas da Loja no período (DRE Gerencial)
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-[#39313A]/60">
                    —
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                    - {formatCurrency(summary.periodOpex)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-[#39313A]/60">
                    —
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-600">
                    - {formatCurrency(summary.periodOpex)}
                  </td>
                </tr>
              )}
              <tr className="font-extrabold text-[#39313A]">
                <td colSpan={3} className="py-4 px-4 rounded-bl-2xl">
                  SOMA TOTAL ({extractFooterTotals.confirmedCount}{" "}
                  {extractFooterTotals.confirmedCount === 1
                    ? "pedido confirmado no caixa"
                    : "pedidos confirmados no caixa"}
                  )
                </td>
                <td className="py-4 px-4 text-right text-[#7A3F51] text-sm">
                  + {formatCurrency(extractFooterTotals.revenue)}
                </td>
                <td className="py-4 px-4 text-right text-rose-600 text-sm">
                  - {formatCurrency(
                    extractFooterTotals.includesOpex
                      ? roundCurrency(extractFooterTotals.cmvAndFees + summary.periodOpex)
                      : extractFooterTotals.cmvAndFees
                  )}
                </td>
                <td className="py-4 px-4 text-right text-orange-700 text-sm">
                  - {formatCurrency(extractFooterTotals.shipping)}
                </td>
                <td
                  className={`py-4 px-4 text-right text-sm rounded-br-2xl ${
                    extractFooterTotals.finalProfit >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  ={" "}
                  {extractFooterTotals.finalProfit < 0
                    ? `- ${formatCurrency(Math.abs(extractFooterTotals.finalProfit))}`
                    : formatCurrency(extractFooterTotals.finalProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
