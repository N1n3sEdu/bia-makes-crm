"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { 
  Search, 
  X,
  RotateCcw,
  PackageCheck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  MessageCircle,
  Copy,
  Printer,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Layers,
  ShoppingBag,
  Store,
  Instagram,
  Filter,
  Check,
  ArrowUpRight
} from "lucide-react";
import { Order, OrderStatus, ChannelType } from "@/types";
import { formatCurrency, formatDate, resolveOrderCompanyShippingCost } from "@/lib/utils";

interface OrdersManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  products?: any[];
  channels?: any[];
}

type PeriodFilterType = "all" | "today" | "week" | "month";

export function OrdersManager({
  orders,
  onUpdateOrderStatus,
  products = [],
  channels = [],
}: OrdersManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [refundModalOrder, setRefundModalOrder] = useState<{
    order: Order;
    newStatus: OrderStatus;
  } | null>(null);

  // Spotlight listener
  useEffect(() => {
    const onSpotlightFilterOrder = (e: Event) => {
      const customEv = e as CustomEvent<string>;
      if (customEv.detail) {
        setSearchTerm(customEv.detail);
        const found = orders.find((o) => o.orderNumber === customEv.detail);
        if (found) {
          setViewingOrder(found);
        }
      }
    };
    window.addEventListener("spotlight-filter-order", onSpotlightFilterOrder);
    return () =>
      window.removeEventListener("spotlight-filter-order", onSpotlightFilterOrder);
  }, [orders]);

  // Tecla '/' para foco rápido na barra de pesquisa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        const searchInput = document.getElementById("order-search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    const wasRefunded = order.status === "DEVOLUCAO" || order.status === "CANCELADO";
    const isNowRefunded = newStatus === "DEVOLUCAO" || newStatus === "CANCELADO";

    onUpdateOrderStatus(order.id, newStatus);

    if (!wasRefunded && isNowRefunded) {
      setRefundModalOrder({
        order: { ...order, status: newStatus },
        newStatus,
      });
    }
  };

  // 1. Contadores Rápidos do Funil (Status Counters)
  const statusCounts = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDENTE" || o.status === "PAGO").length;
    const separation = orders.filter((o) => o.status === "SEPARACAO").length;
    const shipped = orders.filter((o) => o.status === "ENVIADO" || o.status === "CONCLUIDO").length;
    const refunded = orders.filter((o) => o.status === "DEVOLUCAO" || o.status === "CANCELADO").length;

    return { total, pending, separation, shipped, refunded };
  }, [orders]);

  // Filtragem composta dos pedidos
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return orders.filter((o) => {
      const matchSearch = 
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone.includes(searchTerm);

      const matchChannel = channelFilter === "ALL" || o.channel === channelFilter;

      let matchStatus = true;
      if (statusFilter === "PENDING_GROUP") {
        matchStatus = o.status === "PENDENTE" || o.status === "PAGO";
      } else if (statusFilter === "SEPARATION_GROUP") {
        matchStatus = o.status === "SEPARACAO";
      } else if (statusFilter === "SHIPPED_GROUP") {
        matchStatus = o.status === "ENVIADO" || o.status === "CONCLUIDO";
      } else if (statusFilter === "REFUND_GROUP") {
        matchStatus = o.status === "DEVOLUCAO" || o.status === "CANCELADO";
      } else if (statusFilter !== "ALL") {
        matchStatus = o.status === statusFilter;
      }

      let matchPeriod = true;
      const orderDate = new Date(o.createdAt);
      if (periodFilter === "today") {
        matchPeriod = o.createdAt.slice(0, 10) === todayStr;
      } else if (periodFilter === "week") {
        matchPeriod = orderDate >= sevenDaysAgo;
      } else if (periodFilter === "month") {
        matchPeriod = orderDate >= thirtyDaysAgo;
      }

      return matchSearch && matchChannel && matchStatus && matchPeriod;
    });
  }, [orders, searchTerm, channelFilter, statusFilter, periodFilter]);

  // Funções de Seleção Múltipla & Ações em Cadeia
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (filteredOrders.length === 0) return;
    const allFilteredIds = filteredOrders.map((o) => o.id);
    const areAllSelected = allFilteredIds.every((id) => selectedOrderIds.includes(id));

    if (areAllSelected) {
      // Desmarca os pedidos atualmente filtrados
      setSelectedOrderIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      // Seleciona todos os pedidos atualmente filtrados
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleBulkStatusChange = (newStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;

    if (newStatus === "CANCELADO" || newStatus === "DEVOLUCAO") {
      const confirmCancel = window.confirm(
        `Atenção: Deseja realmente marcar ${selectedOrderIds.length} pedido(s) selecionado(s) como ${newStatus}?\n\nIsso estornará os lançamentos financeiros no DRE e devolverá automaticamente os itens ao estoque no Kardex.`
      );
      if (!confirmCancel) return;
    }

    selectedOrderIds.forEach((orderId) => {
      const order = orders.find((o) => o.id === orderId);
      if (order && order.status !== newStatus) {
        handleStatusChange(order, newStatus);
      }
    });

    setSelectedOrderIds([]);
  };

  const isAllSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  const isSomeSelected =
    filteredOrders.some((o) => selectedOrderIds.includes(o.id)) && !isAllSelected;

  // WhatsApp Link Helper
  const getWhatsAppLink = (phone: string, customerName: string, orderNumber: string, status: OrderStatus) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(
      `Olá ${customerName}! Aqui é da Bia Makes 💕 Informamos que o seu pedido #${orderNumber} está com status: ${status}. Se precisar de qualquer ajuda, estamos à disposição!`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  // Helper de badge e ícone de canais
  const renderChannelBadge = (ch: ChannelType) => {
    switch (ch) {
      case "SITE":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#7A3F51]/10 text-[#7A3F51] border border-[#7A3F51]/20"><Store className="w-3 h-3" /> Site Oficial</span>;
      case "INSTAGRAM":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-50 text-[#E1306C] border border-pink-200"><Instagram className="w-3 h-3" /> Instagram Direct</span>;
      case "MERCADO_LIVRE":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Mercado Livre</span>;
      case "SHOPEE":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Shopee</span>;
      case "WHATSAPP":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><MessageCircle className="w-3 h-3" /> WhatsApp VIP</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">{ch}</span>;
    }
  };

  // Copiar endereço
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Copiar rastreio
  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Imprimir ficha de separação
  const handlePrintPackingSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#39313A] tracking-tight">
            Central de Pedidos & Expedição Multicanal
          </h2>
          <p className="text-xs text-[#39313A]/70 mt-0.5">
            Gestão operacional em tempo real de separação, postagem, rastreamento e estornos de vendas.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white px-3.5 py-2 rounded-2xl border border-[#E9D9CD] shadow-sm">
          <ShoppingBag className="w-4 h-4 text-[#9C5B6F]" />
          <span>Total: <strong>{orders.length} pedidos registrados</strong></span>
        </div>
      </div>

      {/* 1. CABEÇALHO COM CONTADORES DE FUNIL EM FORMA DE CARDS RÁPIDOS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Card: Todos */}
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-[#7A3F51] text-white border-[#7A3F51] shadow-md scale-[1.02]"
              : "bg-white hover:bg-[#FAF0F4] text-[#39313A] border-[#E9D9CD]"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "ALL" ? "text-white/80" : "text-gray-400"}`}>
            Todos os Pedidos
          </span>
          <span className="text-2xl font-extrabold mt-1 block tracking-tight">
            {statusCounts.total}
          </span>
          <span className={`text-[10px] mt-0.5 block ${statusFilter === "ALL" ? "text-white/80" : "text-gray-500"}`}>
            Base geral consolidada
          </span>
        </button>

        {/* Card: Aguardando / Pendentes */}
        <button
          onClick={() => setStatusFilter("PENDING_GROUP")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            statusFilter === "PENDING_GROUP"
              ? "bg-purple-700 text-white border-purple-700 shadow-md scale-[1.02]"
              : "bg-white hover:bg-purple-50/50 text-[#39313A] border-[#E9D9CD]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "PENDING_GROUP" ? "text-white/80" : "text-purple-600"}`}>
              Aguardando / Pagos
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          </div>
          <span className="text-2xl font-extrabold mt-1 block tracking-tight text-purple-700" style={{ color: statusFilter === "PENDING_GROUP" ? "#fff" : undefined }}>
            {statusCounts.pending}
          </span>
          <span className={`text-[10px] mt-0.5 block ${statusFilter === "PENDING_GROUP" ? "text-white/80" : "text-gray-500"}`}>
            Prontos para faturar
          </span>
        </button>

        {/* Card: Em Separação / Montagem */}
        <button
          onClick={() => setStatusFilter("SEPARATION_GROUP")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            statusFilter === "SEPARATION_GROUP"
              ? "bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]"
              : "bg-white hover:bg-amber-50/50 text-[#39313A] border-[#E9D9CD]"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "SEPARATION_GROUP" ? "text-white/80" : "text-amber-600"}`}>
            Em Separação
          </span>
          <span className="text-2xl font-extrabold mt-1 block tracking-tight text-amber-700" style={{ color: statusFilter === "SEPARATION_GROUP" ? "#fff" : undefined }}>
            {statusCounts.separation}
          </span>
          <span className={`text-[10px] mt-0.5 block ${statusFilter === "SEPARATION_GROUP" ? "text-white/80" : "text-gray-500"}`}>
            Na bancada de montagem
          </span>
        </button>

        {/* Card: Enviados / Concluídos */}
        <button
          onClick={() => setStatusFilter("SHIPPED_GROUP")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
            statusFilter === "SHIPPED_GROUP"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-md scale-[1.02]"
              : "bg-white hover:bg-emerald-50/50 text-[#39313A] border-[#E9D9CD]"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "SHIPPED_GROUP" ? "text-white/80" : "text-emerald-700"}`}>
            Enviados / Concluídos
          </span>
          <span className="text-2xl font-extrabold mt-1 block tracking-tight text-emerald-700" style={{ color: statusFilter === "SHIPPED_GROUP" ? "#fff" : undefined }}>
            {statusCounts.shipped}
          </span>
          <span className={`text-[10px] mt-0.5 block ${statusFilter === "SHIPPED_GROUP" ? "text-white/80" : "text-gray-500"}`}>
            Despachados / Entregues
          </span>
        </button>

        {/* Card: Devoluções / Cancelados */}
        <button
          onClick={() => setStatusFilter("REFUND_GROUP")}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === "REFUND_GROUP"
              ? "bg-rose-700 text-white border-rose-700 shadow-md scale-[1.02]"
              : "bg-white hover:bg-rose-50/50 text-[#39313A] border-[#E9D9CD]"
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${statusFilter === "REFUND_GROUP" ? "text-white/80" : "text-rose-600"}`}>
            Devoluções / Cancelados
          </span>
          <span className="text-2xl font-extrabold mt-1 block tracking-tight text-rose-700" style={{ color: statusFilter === "REFUND_GROUP" ? "#fff" : undefined }}>
            {statusCounts.refunded}
          </span>
          <span className={`text-[10px] mt-0.5 block ${statusFilter === "REFUND_GROUP" ? "text-white/80" : "text-gray-500"}`}>
            Estornados no DRE
          </span>
        </button>

      </div>

      {/* 2. BARRA DE FILTROS & AÇÕES RÁPIDAS MODERNA */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-3.5">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Campo de Busca Expandido com atalho '/' */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="order-search-input"
              type="text"
              placeholder="Buscar Nº do Pedido, Cliente, WhatsApp ou E-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 py-2 text-xs bg-[#FAF7F8] rounded-2xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-semibold"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-white border border-[#E9D9CD] px-1.5 py-0.5 rounded-md shadow-2xs">
              /
            </kbd>
          </div>

          {/* Seletor de Período Rápido */}
          <div className="flex items-center gap-1 bg-[#FAF7F8] p-1 rounded-2xl border border-[#E9D9CD] self-stretch md:self-auto justify-center">
            <span className="text-[10px] font-bold text-gray-400 px-2 uppercase">Período:</span>
            {(
              [
                { id: "all", label: "Tudo" },
                { id: "today", label: "Hoje" },
                { id: "week", label: "7 Dias" },
                { id: "month", label: "30 Dias" },
              ] as { id: PeriodFilterType; label: string }[]
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === p.id
                    ? "bg-[#7A3F51] text-white shadow-sm"
                    : "text-gray-600 hover:text-[#7A3F51]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

        </div>

        {/* Pílulas de Seleção por Canal de Venda */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-[#E9D9CD]/50">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#C69A76]" />
            Canais:
          </span>
          
          <button
            onClick={() => setChannelFilter("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              channelFilter === "ALL"
                ? "bg-[#7A3F51] text-white shadow-sm"
                : "bg-[#FAF7F8] text-gray-600 border border-[#E9D9CD] hover:bg-white"
            }`}
          >
            Todos os Canais
          </button>

          {(
            [
              { code: "SITE", label: "Loja Virtual (Site)", icon: "site" },
              { code: "INSTAGRAM", label: "Instagram", icon: "instagram" },
              { code: "MERCADO_LIVRE", label: "Mercado Livre", icon: "mercadolivre" },
              { code: "SHOPEE", label: "Shopee", icon: "shopee" },
              { code: "WHATSAPP", label: "WhatsApp VIP", icon: "whatsapp" },
            ] as { code: ChannelType; label: string; icon: string }[]
          ).map((c) => (
            <button
              key={c.code}
              onClick={() => setChannelFilter(c.code)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                channelFilter === c.code
                  ? "bg-[#9C5B6F] text-white shadow-sm"
                  : "bg-[#FAF7F8] text-gray-700 border border-[#E9D9CD] hover:bg-white"
              }`}
            >
              <span>{c.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* 3. BARRA DE AÇÕES EM CADEIA & SELEÇÃO MÚLTIPLA */}
      {selectedOrderIds.length > 0 ? (
        <div className="bg-[#FAF0F4] border-2 border-[#7A3F51]/30 rounded-2xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-[#7A3F51] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-5 h-5 rounded-lg border-2 border-[#7A3F51] bg-[#7A3F51] text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>
                <strong>{selectedOrderIds.length}</strong> de {filteredOrders.length} {selectedOrderIds.length === 1 ? "pedido selecionado" : "pedidos selecionados"}
              </span>
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer font-medium"
            >
              Desmarcar todos
            </button>
          </div>

          {/* Botões de Ação em Lote */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden sm:inline mr-1">
              Ações em Cadeia:
            </span>

            {/* Aprovar Pagamento */}
            <button
              type="button"
              onClick={() => handleBulkStatusChange("PAGO")}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Aprovar pagamento de todos os pedidos selecionados"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprovar Pagamento</span>
            </button>

            {/* Em Separação */}
            <button
              type="button"
              onClick={() => handleBulkStatusChange("SEPARACAO")}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Mover pedidos selecionados para separação"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Em Separação</span>
            </button>

            {/* Marcar Enviado */}
            <button
              type="button"
              onClick={() => handleBulkStatusChange("ENVIADO")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Marcar pedidos selecionados como enviados"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Marcar Enviado</span>
            </button>

            {/* Concluir */}
            <button
              type="button"
              onClick={() => handleBulkStatusChange("CONCLUIDO")}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Concluir pedidos selecionados"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </button>

            {/* Cancelar em Cadeia */}
            <button
              type="button"
              onClick={() => handleBulkStatusChange("CANCELADO")}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Cancelar pedidos selecionados em lote (estorna estoque e DRE)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cancelar em Cadeia</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={filteredOrders.length === 0}
              className="inline-flex items-center gap-2 font-bold text-gray-600 hover:text-[#7A3F51] cursor-pointer disabled:opacity-40 transition-colors"
              title="Marcar todos os pedidos visíveis"
            >
              <div className="w-4 h-4 rounded border border-gray-300 bg-white flex items-center justify-center">
                {isSomeSelected && <div className="w-2 h-2 bg-[#7A3F51] rounded-xs" />}
              </div>
              <span>Selecionar Todos ({filteredOrders.length})</span>
            </button>
          </div>
          <span className="text-[11px] text-gray-400">
            Dica: Marque os balões para cancelar ou aprovar vários pedidos em cadeia
          </span>
        </div>
      )}

      {/* 4. TABELA DE PEDIDOS COM VISUAL DE ROW-CARDS */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          /* Empty State Elegante */
          <div className="bg-white rounded-3xl border border-[#E9D9CD] p-12 text-center shadow-sm space-y-3 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-[#FAF0F4] text-[#9C5B6F] flex items-center justify-center mx-auto border border-[#E9D9CD]">
              <Search className="w-6 h-6 text-[#9C5B6F]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#39313A]">
              Nenhum pedido encontrado
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Não encontramos pedidos para os filtros selecionados ou o termo pesquisado.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setChannelFilter("ALL");
                setPeriodFilter("all");
              }}
              className="px-4 py-2 bg-[#7A3F51] text-white text-xs font-bold rounded-full shadow-sm hover:bg-[#5E303E] transition-all cursor-pointer"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = selectedOrderIds.includes(order.id);
            const isRefunded = order.status === "DEVOLUCAO" || order.status === "CANCELADO";
            const firstItem = order.items[0];
            const matchedProduct = products.find((p) => p.id === firstItem?.productId || p.sku === firstItem?.sku);
            const totalUnits = order.items.reduce((sum, it) => sum + it.quantity, 0);
            const customerShip = typeof order.shippingAmount === "number" ? order.shippingAmount : 0;
            const companyShip = resolveOrderCompanyShippingCost(order);
            const isFreeForCustomer = customerShip === 0 || Boolean(order.isFreeShippingSubsidized);
            const cepMatch = order.shippingAddress?.match(/\d{5}-\d{3}/)?.[0];
            const displayCep = order.shippingCep || cepMatch;
            const carrierLabel = order.shippingCarrier || "Correios PAC";

            return (
              <div
                key={order.id}
                onClick={() => setViewingOrder(order)}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 hover:shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer group ${
                  isSelected
                    ? "border-[#7A3F51] bg-[#FAF0F4]/40 ring-2 ring-[#7A3F51]/30 shadow-xs"
                    : isRefunded
                    ? "border-rose-200 bg-rose-50/20 hover:border-rose-300"
                    : "border-[#E9D9CD] hover:border-[#9C5B6F]"
                }`}
                title="Clique em qualquer parte do pedido para abrir a ficha completa"
              >
                
                {/* Coluna 1: Pedido & Canal */}
                <div className="min-w-[190px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-[#7A3F51] text-sm group-hover:text-[#9C5B6F] transition-colors">
                      {order.orderNumber}
                    </span>
                    {renderChannelBadge(order.channel)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                {/* Coluna 2: Cliente & WhatsApp */}
                <div className="min-w-[180px]">
                  <span className="font-bold text-[#39313A] text-xs block group-hover:text-[#7A3F51] transition-colors">
                    {order.customerName}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-500 font-mono">
                      {order.customerPhone}
                    </span>
                    <a
                      href={getWhatsAppLink(order.customerPhone, order.customerName, order.orderNumber, order.status)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      title="Enviar mensagem no WhatsApp com status do pedido"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                    </a>
                  </div>
                </div>

                {/* Coluna 3: Resumo dos Produtos com Miniatura */}
                <div className="flex items-center gap-3 min-w-[240px] flex-1">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#FAF7F8] border border-[#E9D9CD] shrink-0 relative">
                    <Image
                      src={matchedProduct?.images?.[0] || "/logo.jpg"}
                      alt={firstItem?.productName || "Produto"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-[#39313A] line-clamp-1">
                      {firstItem?.productName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-[#9C5B6F] bg-[#FAF0F4] px-1.5 py-0.2 rounded border border-[#E9D9CD]">
                        {totalUnits} un{totalUnits > 1 ? "s" : ""}
                      </span>
                      {firstItem?.variationName && (
                        <span className="text-[10px] text-gray-500 truncate max-w-[140px]">
                          {firstItem.variationName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coluna 4: Frete / Logística da Encomenda */}
                <div className="min-w-[190px] text-left space-y-1">
                  <div className="text-[11px] font-bold text-[#39313A] flex items-center gap-1 flex-wrap">
                    <span>📦 {carrierLabel}</span>
                    {displayCep && (
                      <span className="font-mono text-[10px] text-gray-500">· {displayCep}</span>
                    )}
                  </div>
                  {isFreeForCustomer ? (
                    <div className="space-y-0.5">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        Cliente: Grátis
                      </span>
                      <div className="text-[11px] font-extrabold text-rose-700">
                        Custo Frete Loja: -{formatCurrency(companyShip)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] space-y-0.5">
                      <div className="text-gray-600 font-semibold">
                        Cliente pagou: {formatCurrency(customerShip)}
                      </div>
                      <div className="font-bold text-rose-700">
                        Custo Transportadora: -{formatCurrency(companyShip)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coluna 5: Total & Meio de Pagamento */}
                <div className="min-w-[130px] text-left lg:text-right">
                  <div className={`text-base font-extrabold ${
                    isRefunded ? "line-through decoration-2 decoration-rose-600 text-rose-600" : "text-[#7A3F51]"
                  }`}>
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                    {order.paymentMethod}
                  </span>
                  {isRefunded && (
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight block">
                      Estornado do DRE
                    </span>
                  )}
                </div>

                {/* Coluna 6: Balão de Seleção (Antes do Status) & Status Separado */}
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className="flex items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-[#E9D9CD]/50"
                >
                  {/* Balão de Seleção Múltipla (Antes do Status) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectOrder(order.id);
                    }}
                    className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? "bg-[#7A3F51] border-[#7A3F51] text-white shadow-xs scale-105"
                        : "bg-white border-[#E9D9CD] hover:border-[#9C5B6F] text-transparent hover:bg-[#FAF0F4]"
                    }`}
                    title={isSelected ? "Desmarcar este pedido" : "Marcar pedido para selecionar em cadeia"}
                    aria-label="Selecionar pedido"
                  >
                    <Check className={`w-4 h-4 stroke-[3] transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`} />
                  </button>

                  {/* Informação de Status Separada */}
                  <div className="relative inline-flex items-center">
                    <select
                      value={order.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(order, e.target.value as OrderStatus);
                      }}
                      className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border focus:outline-none cursor-pointer transition-colors shadow-2xs ${
                        isRefunded
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : order.status === "CONCLUIDO"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : order.status === "ENVIADO"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : order.status === "SEPARACAO"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-purple-100 text-purple-800 border-purple-300"
                      }`}
                      title="Alterar status deste pedido individualmente"
                    >
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="PAGO">PAGO</option>
                      <option value="SEPARACAO">EM SEPARAÇÃO</option>
                      <option value="ENVIADO">ENVIADO</option>
                      <option value="CONCLUIDO">CONCLUÍDO</option>
                      <option value="DEVOLUCAO">DEVOLUÇÃO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 4. MODAL DE DETALHES DO PEDIDO EXPANDIDO (FICHA DE EXPEDIÇÃO & ROMANEIO) */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full relative shadow-2xl border border-[#E9D9CD] max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Header Fixo com Status e Impressão */}
            <div className="flex items-start justify-between p-6 sm:px-7 pb-4 border-b border-[#E9D9CD] bg-white shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-xl text-[#7A3F51]">
                    {viewingOrder.orderNumber}
                  </span>
                  {renderChannelBadge(viewingOrder.channel)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Registrado em {formatDate(viewingOrder.createdAt)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPackingSlip}
                  className="px-3 py-1.5 bg-[#FAF7F8] hover:bg-[#FAF0F4] text-[#7A3F51] border border-[#E9D9CD] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Imprimir Ficha de Separação"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ficha</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer transition-colors"
                  title="Fechar Ficha"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo Rolável Elegante com Scrollbar Customizada */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-5 modal-content-scroll">

            {/* Timeline Visual do Pedido */}
            <div className="bg-[#FAF7F8] p-4 rounded-2xl border border-[#E9D9CD]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Linha do Tempo da Expedição
              </span>
              <div className="flex items-center justify-between text-xs">
                {(
                  [
                    { label: "Criado", active: true },
                    { label: "Pago", active: viewingOrder.status !== "PENDENTE" },
                    { label: "Separação", active: ["SEPARACAO", "ENVIADO", "CONCLUIDO"].includes(viewingOrder.status) },
                    { label: "Enviado", active: ["ENVIADO", "CONCLUIDO"].includes(viewingOrder.status) },
                    { label: "Entregue", active: viewingOrder.status === "CONCLUIDO" },
                  ]
                ).map((step, idx, arr) => (
                  <div key={idx} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.active ? "bg-[#7A3F51] text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[10px] mt-1 font-bold ${step.active ? "text-[#7A3F51]" : "text-gray-400"}`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full ${
                        arr[idx + 1].active ? "bg-[#7A3F51]" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dados do Cliente e Endereço de Entrega */}
            <div className="bg-white p-4 rounded-2xl border border-[#E9D9CD] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A3F51] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#9C5B6F]" />
                  <span>Destinatário & Endereço de Entrega</span>
                </span>
                <button
                  onClick={() => handleCopyAddress(viewingOrder.shippingAddress)}
                  className="px-2.5 py-1 bg-[#FAF7F8] text-[#7A3F51] hover:bg-[#FAF0F4] border border-[#E9D9CD] rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAddress ? "Copiado!" : "Copiar Endereço"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] block">Nome do Cliente</span>
                  <span className="font-bold text-[#39313A]">{viewingOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Contato</span>
                  <span className="font-mono text-gray-700">{viewingOrder.customerPhone} • {viewingOrder.customerEmail}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-400 text-[10px] block">Endereço Completo</span>
                  <span className="font-semibold text-gray-800">{viewingOrder.shippingAddress}</span>
                </div>
              </div>

              {viewingOrder.trackingCode && (
                <div className="pt-2 border-t border-[#E9D9CD]/50 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 text-[10px] block">Código de Rastreamento</span>
                    <span className="font-mono font-bold text-[#7A3F51]">{viewingOrder.trackingCode}</span>
                  </div>
                  <button
                    onClick={() => handleCopyTracking(viewingOrder.trackingCode!)}
                    className="px-2.5 py-1 bg-white text-[#7A3F51] border border-[#E9D9CD] rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTracking ? "Rastreio Copiado!" : "Copiar Rastreio"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Lista dos Itens do Pedido */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                Itens para Separação
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {viewingOrder.items.map((it, idx) => {
                  const prod = products.find((p) => p.id === it.productId || p.sku === it.sku);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-[#E9D9CD] bg-[#FAF7F8]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-[#E9D9CD] shrink-0 relative">
                          <Image
                            src={prod?.images?.[0] || "/logo.jpg"}
                            alt={it.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-[#39313A]">{it.productName}</div>
                          {it.variationName && (
                            <div className="text-[10px] text-[#9C5B6F] font-semibold">{it.variationName}</div>
                          )}
                          <div className="text-[10px] font-mono text-gray-400">SKU: {it.sku}</div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-extrabold text-[#7A3F51]">{formatCurrency(it.price * it.quantity)}</span>
                        <div className="text-[10px] text-gray-500">{it.quantity}x {formatCurrency(it.price)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raio-X de Frete & Lucro desta Encomenda */}
            {(() => {
              const channelInfo = channels.find((c: any) => c.code === viewingOrder.channel);
              const feePct = channelInfo ? channelInfo.feePercentage : 0;
              const estFee = viewingOrder.totalAmount * (feePct / 100);
              
              let orderCmv = 0;
              viewingOrder.items.forEach((it) => {
                const prod = products.find((p: any) => p.id === it.productId || p.sku === it.sku);
                const cost = prod && typeof prod.costPrice === "number" ? prod.costPrice : it.price * 0.38;
                orderCmv += cost * it.quantity;
              });

              const customerShip =
                typeof viewingOrder.shippingAmount === "number" ? viewingOrder.shippingAmount : 0;
              const companyShip = resolveOrderCompanyShippingCost(viewingOrder);
              const productsTotal = Math.max(0, viewingOrder.totalAmount - customerShip);
              const isFreeForCustomer =
                customerShip === 0 || Boolean(viewingOrder.isFreeShippingSubsidized);
              const cepMatch = viewingOrder.shippingAddress?.match(/\d{5}-\d{3}/)?.[0];
              const displayCep = viewingOrder.shippingCep || cepMatch;
              const carrierName = viewingOrder.shippingCarrier || "Correios PAC";
              const totalCmvPlusFee = orderCmv + estFee;
              const orderNetProfit =
                viewingOrder.totalAmount - estFee - orderCmv - companyShip;

              return (
                <div className="p-4 rounded-2xl bg-[#FAF0F4]/50 border border-[#E9D9CD] space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E9D9CD]/70">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7A3F51] flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#9C5B6F]" />
                        <span>Raio-X de Frete & Lucro desta Encomenda</span>
                      </span>
                      <div className="text-[11px] text-gray-600 mt-0.5">
                        Transportadora: <strong className="text-[#39313A]">{carrierName}</strong>
                        {viewingOrder.shippingServiceDays ? ` (${viewingOrder.shippingServiceDays})` : ""}
                        {displayCep ? ` · CEP ${displayCep}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 text-[10px] block">Valor Total Pago pelo Cliente</span>
                      <span className={`text-lg font-extrabold ${
                        viewingOrder.status === "DEVOLUCAO" || viewingOrder.status === "CANCELADO"
                          ? "line-through text-rose-600"
                          : "text-[#7A3F51]"
                      }`}>
                        {formatCurrency(viewingOrder.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-[#E9D9CD]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Valor dos Produtos:</span>
                      <span className="font-bold text-[#39313A]">+ {formatCurrency(productsTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Frete cobrado do cliente:</span>
                      {isFreeForCustomer ? (
                        <span className="font-bold text-emerald-700">
                          R$ 0,00 (Frete Grátis concedido)
                        </span>
                      ) : (
                        <span className="font-bold text-[#39313A]">
                          + {formatCurrency(customerShip)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100">
                      <span className="font-bold text-rose-700">
                        (-) Custo do Frete pago pela Bia Makes à transportadora:
                      </span>
                      <span className="font-extrabold text-rose-700">
                        - {formatCurrency(companyShip)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-rose-700">
                        (-) Custo dos Produtos (CMV {formatCurrency(orderCmv)}) + Taxa Canal ({feePct}% · {formatCurrency(estFee)}):
                      </span>
                      <span className="font-bold text-rose-700">
                        - {formatCurrency(totalCmvPlusFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-[#E9D9CD]">
                      <span className="font-extrabold text-[#39313A]">
                        (=) Lucro Líquido Real desta Encomenda:
                      </span>
                      <span className={`font-extrabold ${orderNetProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {orderNetProfit < 0
                          ? `- ${formatCurrency(Math.abs(orderNetProfit))}`
                          : formatCurrency(orderNetProfit)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-gray-500">
                    <span>Pagamento: <strong className="text-[#39313A]">{viewingOrder.paymentMethod}</strong></span>
                    {isFreeForCustomer && (
                      <span className="text-amber-700 font-semibold">
                        Frete Grátis subsidiado pela loja (-{formatCurrency(companyShip)})
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            </div>

            {/* Rodapé Fixo do Modal de Pedidos */}
            <div className="flex justify-end items-center gap-3 px-6 py-3.5 border-t border-[#E9D9CD] bg-[#FAF7F8] shrink-0">
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="px-5 py-2 rounded-full bg-white border border-[#E9D9CD] text-[#7A3F51] hover:bg-[#FAF0F4] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                Fechar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL DE ESTORNO TRANSPARENTE E EDUCATIVO */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border-2 border-rose-300 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wider">
                  {refundModalOrder.newStatus === "DEVOLUCAO" ? "Devolução Confirmada" : "Cancelamento Confirmado"}
                </span>
                <h3 className="font-serif text-base font-bold text-[#39313A] mt-0.5">
                  Estorno & Retorno ao Estoque
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <p>
                O pedido <strong>#{refundModalOrder.order.orderNumber}</strong> foi atualizado para{" "}
                <span className="font-bold text-rose-700">{refundModalOrder.newStatus}</span>.
              </p>

              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>Itens retornados ao estoque físico:</span>
                  <span className="text-emerald-700">
                    +{refundModalOrder.order.items.reduce((sum, it) => sum + it.quantity, 0)} unidades
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Valor abatido do Faturamento/DRE:</span>
                  <span className="text-rose-600 line-through">
                    {formatCurrency(refundModalOrder.order.totalAmount)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500">
                O Kardex foi atualizado com a movimentação de estorno e o saldo financeiro agora reflete os valores reais no DRE.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setRefundModalOrder(null)}
                className="px-5 py-2 rounded-full bg-[#7A3F51] text-white text-xs font-bold hover:bg-[#5E303E] transition-all shadow-md cursor-pointer"
              >
                Entendido / Concluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
