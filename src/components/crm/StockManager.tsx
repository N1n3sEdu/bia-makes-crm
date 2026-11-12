"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { 
  Package, 
  Sliders, 
  RotateCcw, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  ShieldAlert, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Plus, 
  Minus, 
  Wrench
} from "lucide-react";
import { Product, StockMovement, MovementType } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useBiaMakes } from "@/context/BiaMakesContext";

interface StockManagerProps {
  products: Product[];
  movements: StockMovement[];
  onAddMovement: (movement: StockMovement) => void;
  onUpdateProductStock: (productId: string, newPhysical: number, variationId?: string) => void;
}

type StockTabType = "inventory" | "kardex";
type KardexFilterType = "ALL" | MovementType;

export function StockManager({
  products,
  movements,
  onAddMovement,
  onUpdateProductStock,
}: StockManagerProps) {
  const { adminUser, orders } = useBiaMakes();

  const [activeTab, setActiveTab] = useState<StockTabType>("inventory");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string>("ALL");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>("ENTRADA");
  const [quantityInput, setQuantityInput] = useState<number>(10);
  const [reasonInput, setReasonInput] = useState("");

  // Filtros da Aba 1 (Armazém)
  const [inventorySearch, setInventorySearch] = useState("");
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);
  const [onlyAlerts, setOnlyAlerts] = useState(false);

  // Filtros da Aba 2 (Kardex)
  const [kardexSearch, setKardexSearch] = useState("");
  const [kardexTypeFilter, setKardexTypeFilter] = useState<KardexFilterType>("ALL");

  // Sugestões rápidas de justificativas
  const QUICK_REASONS = [
    "Nota Fiscal de Fornecedor",
    "Ajuste de Avaria",
    "Perda / Quebra no Transporte",
    "Inventário Periódico",
    "Consumo Próprio / Provador",
    "Reposição de Mostruário",
  ];

  // Helper para calcular total vendido de um produto específico
  const getProductSoldUnits = (p: Product) => {
    return (orders || [])
      .filter((o) => o.status !== "CANCELADO" && o.status !== "DEVOLUCAO")
      .flatMap((o) => o.items || [])
      .filter(
        (it) =>
          it.productId === p.id ||
          it.sku === p.sku ||
          p.variations?.some((v) => v.sku === it.sku)
      )
      .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  };

  // 1. HERO BANNER DE SAÚDE DO INVENTÁRIO (3 CARDS DE TOPO: APENAS VENDIDOS E DISPONÍVEIS)
  const inventoryHealth = useMemo(() => {
    let totalValue = 0;
    let totalAvailablePieces = 0;
    let ruptureCount = 0;

    products.forEach((p) => {
      const physical = Number(p.physicalStock) || 0;
      const cost = Number(p.costPrice) || 0;

      totalAvailablePieces += physical;
      totalValue += physical * cost;

      if (physical <= p.minStock) {
        ruptureCount++;
      }
    });

    const totalSoldPieces = (orders || [])
      .filter((o) => o.status !== "CANCELADO" && o.status !== "DEVOLUCAO")
      .flatMap((o) => o.items || [])
      .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

    return {
      totalValue,
      totalAvailablePieces,
      totalSoldPieces,
      ruptureCount,
    };
  }, [products, orders]);

  // Alternar Accordion de Variações
  const toggleAccordion = (productId: string) => {
    setExpandedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Abrir modal de movimentação de estoque
  const handleOpenAdjust = (p: Product, varId?: string) => {
    setSelectedProduct(p);
    if (p.variations && p.variations.length > 0) {
      setSelectedVariationId(varId || p.variations[0].id);
    } else {
      setSelectedVariationId("ALL");
    }
    setQuantityInput(10);
    setMovementType("ENTRADA");
    setReasonInput("Nota Fiscal de Fornecedor");
    setIsAdjustModalOpen(true);
  };

  // Lógica de cálculo prévio em tempo real para a modal
  const adjustmentPreview = useMemo(() => {
    if (!selectedProduct) return { current: 0, next: 0, delta: 0, nextCentral: 0, isValid: true };

    const hasVars = selectedProduct.variations && selectedProduct.variations.length > 0;
    const targetVar = hasVars && selectedVariationId !== "ALL"
      ? selectedProduct.variations?.find((v) => v.id === selectedVariationId)
      : null;

    const current = targetVar ? targetVar.stock : selectedProduct.physicalStock;
    let delta = quantityInput;

    if (movementType === "SAIDA") {
      delta = -Math.abs(quantityInput);
    } else if (movementType === "AJUSTE") {
      delta = quantityInput - current;
    }

    const next = movementType === "AJUSTE" ? quantityInput : current + delta;
    const nextCentral = targetVar
      ? selectedProduct.physicalStock + delta
      : next;

    const isValid = next >= 0 && nextCentral >= 0;

    return { current, next, delta, nextCentral, isValid };
  }, [selectedProduct, selectedVariationId, movementType, quantityInput]);

  // Submissão da Movimentação
  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (quantityInput < 0) {
      alert("A quantidade informada não pode ser negativa.");
      return;
    }

    if (!adjustmentPreview.isValid) {
      if (adjustmentPreview.next < 0 || adjustmentPreview.nextCentral < 0) {
        alert("O estoque não pode ficar negativo.");
        return;
      }
    }

    const targetVar = selectedProduct.variations?.find((v) => v.id === selectedVariationId);

    // Registro no Kardex
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: selectedProduct.id,
      productName: targetVar 
        ? `${selectedProduct.name} (${targetVar.name})` 
        : selectedProduct.name,
      sku: targetVar ? targetVar.sku : selectedProduct.sku,
      type: movementType,
      quantity: adjustmentPreview.delta,
      previousStock: adjustmentPreview.current,
      currentStock: adjustmentPreview.next,
      reason: reasonInput.trim() || "Ajuste manual de estoque",
      operator: adminUser?.name ? `${adminUser.name} (${adminUser.role})` : "Admin Master",
      date: new Date().toISOString(),
    };

    onAddMovement(movement);

    if (targetVar) {
      onUpdateProductStock(selectedProduct.id, adjustmentPreview.next, targetVar.id);
    } else {
      onUpdateProductStock(selectedProduct.id, adjustmentPreview.nextCentral);
    }

    setIsAdjustModalOpen(false);
  };

  // Filtragem da Aba 1 (Armazém)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.variations?.some((v) => v.name.toLowerCase().includes(inventorySearch.toLowerCase()) || v.sku.toLowerCase().includes(inventorySearch.toLowerCase()));

      const available = p.physicalStock - p.reservedStock;
      const isRupture = available <= p.minStock;

      if (onlyAlerts) {
        return matchSearch && isRupture;
      }
      return matchSearch;
    });
  }, [products, inventorySearch, onlyAlerts]);

  // Filtragem da Aba 2 (Kardex)
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        m.productName.toLowerCase().includes(kardexSearch.toLowerCase()) ||
        m.sku.toLowerCase().includes(kardexSearch.toLowerCase()) ||
        m.reason.toLowerCase().includes(kardexSearch.toLowerCase()) ||
        m.operator.toLowerCase().includes(kardexSearch.toLowerCase());

      const matchType = kardexTypeFilter === "ALL" || m.type === kardexTypeFilter;

      return matchSearch && matchType;
    });
  }, [movements, kardexSearch, kardexTypeFilter]);

  // Exportar Kardex para CSV
  const handleExportKardexCSV = () => {
    const csvRows = [
      ["DATA / HORA", "TIPO", "PRODUTO / VARIACAO", "SKU", "SALDO ANTERIOR", "MOVIMENTACAO", "SALDO ATUAL", "MOTIVO / DOCUMENTO", "OPERADOR"],
      ...filteredMovements.map((m) => [
        formatDate(m.date),
        m.type,
        `"${m.productName.replace(/"/g, '""')}"`,
        m.sku,
        m.previousStock.toString(),
        (m.quantity > 0 ? `+${m.quantity}` : m.quantity.toString()),
        m.currentStock.toString(),
        `"${m.reason.replace(/"/g, '""')}"`,
        `"${m.operator.replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent = "\uFEFF" + csvRows.map((e) => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", blobUrl);
    link.setAttribute("download", `Kardex_BiaMakes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#39313A] tracking-tight">
            Controle de Estoque Central & Kardex
          </h2>
          <p className="text-xs text-[#39313A]/70 mt-0.5">
            Almoxarifado em tempo real, capacidade física por variação e trilha de auditoria completa.
          </p>
        </div>
      </div>

      {/* 1. HERO BANNER DE SAÚDE DO INVENTÁRIO (3 CARDS DE TOPO) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Valor Total em Reais */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Valor do Inventário (Custo)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF0F4] text-[#7A3F51] flex items-center justify-center border border-[#E9D9CD]">
              <DollarSign className="w-4 h-4 text-[#9C5B6F]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#7A3F51] tracking-tight">
              {formatCurrency(inventoryHealth.totalValue)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Patrimônio imobilizado em mercadorias a preço de custo.
            </p>
          </div>
        </div>

        {/* Card 2: Volume Total de Peças */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Volume Físico no Armazém
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#39313A] tracking-tight">
              {inventoryHealth.totalAvailablePieces} un
            </div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
              <span className="text-emerald-700 font-semibold">Disponíveis: {inventoryHealth.totalAvailablePieces} un</span>
              <span>•</span>
              <span className="text-[#7A3F51] font-semibold">Vendidos: {inventoryHealth.totalSoldPieces} un</span>
            </div>
          </div>
        </div>

        {/* Card 3: Nível de Alerta & Ruptura */}
        <div className={`p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all ${
          inventoryHealth.ruptureCount > 0 ? "bg-amber-50/50 border-amber-300" : "bg-white border-[#E9D9CD]"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Nível de Alerta & Ruptura
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              inventoryHealth.ruptureCount > 0 ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              inventoryHealth.ruptureCount > 0 ? "text-amber-800" : "text-emerald-700"
            }`}>
              {inventoryHealth.ruptureCount} {inventoryHealth.ruptureCount === 1 ? "produto crítico" : "produtos críticos"}
            </div>
            <p className="text-[11px] text-gray-600 mt-1">
              {inventoryHealth.ruptureCount > 0 
                ? "Itens com saldo disponível abaixo do estoque de segurança." 
                : "Todos os produtos estão com níveis saudáveis de estoque."}
            </p>
          </div>
        </div>

      </div>

      {/* 2. SISTEMA DE DUAS ABAS PRINCIPAIS */}
      <div className="space-y-4">
        
        <div className="bg-white p-1.5 rounded-2xl border border-[#E9D9CD] shadow-sm flex items-center gap-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "inventory"
                ? "bg-[#7A3F51] text-white shadow-md"
                : "text-gray-600 hover:text-[#7A3F51] hover:bg-[#FAF0F4]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Posição Atual do Catálogo (Armazém)</span>
          </button>

          <button
            onClick={() => setActiveTab("kardex")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "kardex"
                ? "bg-[#7A3F51] text-white shadow-md"
                : "text-gray-600 hover:text-[#7A3F51] hover:bg-[#FAF0F4]"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Auditoria & Histórico de Movimentações (Kardex)</span>
          </button>
        </div>

        {/* 3. ABA 1: TABELA DE ESTOQUE COM RÉGUA DE CAPACIDADE VISUAL */}
        {activeTab === "inventory" && (
          <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm overflow-hidden animate-in fade-in duration-300">
            
            {/* Barra de Filtros da Aba 1 */}
            <div className="p-4 border-b border-[#E9D9CD] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF7F8]/50">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto, SKU ou variação..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyAlerts((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    onlyAlerts
                      ? "bg-amber-100 text-amber-900 border-amber-300 shadow-sm"
                      : "bg-white text-gray-600 border-[#E9D9CD] hover:bg-gray-50"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ver apenas Rupturas ({inventoryHealth.ruptureCount})</span>
                </button>
              </div>
            </div>

            {/* Listagem de Estoque */}
            <div className="divide-y divide-[#E9D9CD]/40">
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500">
                  Nenhum produto encontrado no estoque com os filtros aplicados.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const soldUnits = getProductSoldUnits(p);
                  const available = p.physicalStock;
                  const isRupture = available <= p.minStock;
                  const hasVars = p.variations && p.variations.length > 0;
                  const isExpanded = expandedProductIds.includes(p.id);

                  // Capacidade percentual da barra de disponível
                  const maxCap = Math.max(available + soldUnits, p.minStock * 2, 20);
                  const availablePct = Math.min(100, Math.round((available / maxCap) * 100));
                  const minPct = Math.min(100, Math.round((p.minStock / maxCap) * 100));

                  return (
                    <div key={p.id} className="p-4 sm:p-5 hover:bg-[#FAF7F8]/40 transition-colors">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        
                        {/* Identificação do Produto */}
                        <div className="flex items-center gap-3.5 min-w-[280px]">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-[#E9D9CD] shrink-0 relative shadow-sm">
                            <Image
                              src={p.images?.[0] || "/logo.jpg"}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#39313A] line-clamp-1">
                                {p.name}
                              </span>
                              {isRupture && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shrink-0">
                                  Comprar / Repor
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                              <span className="font-mono text-[#7A3F51] font-semibold">{p.sku}</span>
                              <span>•</span>
                              <span>{p.category}</span>
                              {hasVars && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#9C5B6F] font-bold">
                                    {p.variations.length} variações de tom
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Régua de Capacidade Visual de Estoque */}
                        <div className="flex-1 w-full lg:max-w-md space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 font-semibold">
                              <span className="text-[#7A3F51]">Vendidos: <strong>{soldUnits} un</strong></span>
                              <span className="text-emerald-700 font-extrabold">Disponível: {available} un</span>
                            </div>
                            <span className="text-[10px] text-gray-400">Mínimo: {p.minStock} un</span>
                          </div>

                          {/* Barra Horizontal Colorida */}
                          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex relative border border-[#E9D9CD]/60">
                            {/* Marcador de Estoque Mínimo */}
                            <div
                              style={{ left: `${minPct}%` }}
                              className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                              title={`Estoque de Segurança: ${p.minStock} un`}
                            />
                            {/* Disponível */}
                            <div
                              style={{ width: `${availablePct}%` }}
                              className={`h-full transition-all duration-300 ${
                                isRupture ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                          {hasVars && (
                            <button
                              onClick={() => toggleAccordion(p.id)}
                              className="px-3 py-1.5 bg-[#FAF7F8] hover:bg-[#FAF0F4] border border-[#E9D9CD] text-[#7A3F51] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? "Ocultar Tons" : "Ver Tons"}</span>
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="px-4 py-1.5 bg-[#9C5B6F] hover:bg-[#7A3F51] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Movimentar / Ajustar</span>
                          </button>
                        </div>

                      </div>

                      {/* Accordion de Variações de Tons */}
                      {hasVars && isExpanded && (
                        <div className="mt-4 pt-3 border-t border-[#E9D9CD]/40 bg-[#FAF7F8]/80 p-3.5 rounded-2xl space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                            Estoque Detalhado por Tonalidade
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {p.variations.map((v) => (
                              <div
                                key={v.id}
                                className="bg-white p-2.5 rounded-xl border border-[#E9D9CD] flex items-center justify-between shadow-2xs"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                                    style={{ backgroundColor: v.colorHex }}
                                  />
                                  <div>
                                    <span className="font-bold text-xs text-[#39313A] block">{v.name}</span>
                                    <span className="font-mono text-[10px] text-gray-400">SKU: {v.sku}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-[#7A3F51] bg-[#FAF0F4] px-2 py-0.5 rounded-md border border-[#E9D9CD]">
                                    {v.stock} un
                                  </span>
                                  <button
                                    onClick={() => handleOpenAdjust(p, v.id)}
                                    className="p-1 text-gray-400 hover:text-[#9C5B6F] rounded"
                                    title={`Ajustar ${v.name}`}
                                  >
                                    <Sliders className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* 4. ABA 2: KARDEX VISUAL REFORMULADO COM FILTROS AVANÇADOS */}
        {activeTab === "kardex" && (
          <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm overflow-hidden animate-in fade-in duration-300 space-y-4 p-5">
            
            {/* Header e Filtros do Kardex */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#E9D9CD]">
              
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrar por produto, SKU, motivo ou operador..."
                  value={kardexSearch}
                  onChange={(e) => setKardexSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF7F8] rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                {/* Pílulas de Tipo */}
                <div className="flex items-center gap-1 bg-[#FAF7F8] p-1 rounded-2xl border border-[#E9D9CD]">
                  {(
                    [
                      { id: "ALL", label: "Todos" },
                      { id: "ENTRADA", label: "+ Entradas" },
                      { id: "SAIDA", label: "- Saídas" },
                      { id: "DEVOLUCAO", label: "↺ Devoluções" },
                      { id: "AJUSTE", label: "⚙ Ajustes" },
                    ] as { id: KardexFilterType; label: string }[]
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setKardexTypeFilter(t.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        kardexTypeFilter === t.id
                          ? "bg-[#7A3F51] text-white shadow-sm"
                          : "text-gray-600 hover:text-[#7A3F51]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportKardexCSV}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#FAF0F4] text-[#7A3F51] border border-[#E9D9CD] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Exportar trilha do Kardex em CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#9C5B6F]" />
                  <span>Exportar CSV</span>
                </button>
              </div>

            </div>

            {/* Timeline de Auditoria do Kardex */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Produto & Variação</th>
                    <th className="py-3 px-4 text-center">Evolução do Saldo</th>
                    <th className="py-3 px-4">Justificativa / Motivo</th>
                    <th className="py-3 px-4">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9D9CD]/40">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Nenhum registro de movimentação encontrado no Kardex.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-[#FAF7F8]/50 transition-colors">
                        
                        {/* Data */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {formatDate(m.date)}
                        </td>

                        {/* Badge de Tipo */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            m.type === "ENTRADA"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : m.type === "SAIDA"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : m.type === "DEVOLUCAO"
                              ? "bg-purple-100 text-purple-800 border border-purple-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}>
                            {m.type === "ENTRADA" && <Plus className="w-3 h-3" />}
                            {m.type === "SAIDA" && <Minus className="w-3 h-3" />}
                            {m.type === "DEVOLUCAO" && <RotateCcw className="w-3 h-3" />}
                            {m.type === "AJUSTE" && <Wrench className="w-3 h-3" />}
                            <span>{m.type}</span>
                          </span>
                        </td>

                        {/* Produto e SKU */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#39313A] block">{m.productName}</span>
                          <span className="font-mono text-[10px] text-gray-400">{m.sku}</span>
                        </td>

                        {/* Evolução de Saldo */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-[#FAF7F8] px-3 py-1 rounded-xl border border-[#E9D9CD]">
                            <span className="text-gray-500">{m.previousStock} un</span>
                            <span>&rarr;</span>
                            <span className={`font-extrabold ${m.quantity > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity} un
                            </span>
                            <span>&rarr;</span>
                            <span className="font-bold text-[#7A3F51]">{m.currentStock} un</span>
                          </div>
                        </td>

                        {/* Justificativa */}
                        <td className="py-3.5 px-4 text-gray-700 max-w-xs truncate">
                          {m.reason}
                        </td>

                        {/* Operador */}
                        <td className="py-3.5 px-4 text-gray-500 text-[11px] font-medium">
                          {m.operator}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* 5. MODAL DE MOVIMENTAÇÃO DE ESTOQUE INTUITIVO E SEGURO */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 relative shadow-2xl border border-[#E9D9CD] space-y-4">
            
            <div className="flex items-start justify-between pb-3 border-b border-[#E9D9CD]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C5B6F]">
                  Almoxarifado & Kardex
                </span>
                <h3 className="font-serif text-lg font-bold text-[#39313A]">
                  Lançar Movimentação de Estoque
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedProduct.name} ({selectedProduct.sku})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              
              {/* Botões Grandes para Escolha de Tipo */}
              <div>
                <label className="block font-bold text-[#39313A] mb-1.5">
                  Tipo de Operação *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType("ENTRADA")}
                    className={`py-2.5 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      movementType === "ENTRADA"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                        : "bg-[#FAF7F8] text-gray-700 border-[#E9D9CD] hover:bg-emerald-50"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Entrada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementType("SAIDA")}
                    className={`py-2.5 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      movementType === "SAIDA"
                        ? "bg-rose-600 text-white border-rose-600 shadow-md"
                        : "bg-[#FAF7F8] text-gray-700 border-[#E9D9CD] hover:bg-rose-50"
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    <span>- Baixa / Saída</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovementType("AJUSTE")}
                    className={`py-2.5 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      movementType === "AJUSTE"
                        ? "bg-amber-600 text-white border-amber-600 shadow-md"
                        : "bg-[#FAF7F8] text-gray-700 border-[#E9D9CD] hover:bg-amber-50"
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>⚙ Balanço</span>
                  </button>
                </div>
              </div>

              {/* Seletor de Variação de Tom Obrigatório se houver variações */}
              {selectedProduct.variations && selectedProduct.variations.length > 0 && (
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">
                    Tonalidade / Variação a Movimentar *
                  </label>
                  <select
                    value={selectedVariationId}
                    onChange={(e) => setSelectedVariationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] font-bold focus:outline-none focus:border-[#9C5B6F]"
                  >
                    {selectedProduct.variations.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (SKU: {v.sku}) — Saldo Atual: {v.stock} un
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantidade */}
              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  {movementType === "AJUSTE" ? "Novo Saldo Absoluto da Contagem" : "Quantidade de Peças"}
                </label>
                <input
                  type="number"
                  min={movementType === "AJUSTE" ? 0 : 1}
                  required
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] text-base font-extrabold text-[#7A3F51] focus:outline-none focus:border-[#9C5B6F]"
                />
              </div>

              {/* Justificativa com Tags Clicáveis */}
              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Motivo / Justificativa Documentada *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: NF-e 99120 Compra Fornecedor"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReasonInput(r)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#FAF7F8] hover:bg-[#FAF0F4] border border-[#E9D9CD] text-gray-600 transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cálculo Prévio em Tempo Real */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                adjustmentPreview.isValid ? "bg-[#FAF7F8] border-[#E9D9CD]" : "bg-rose-50 border-rose-300"
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Cálculo Prévio em Tempo Real
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">{adjustmentPreview.current} un</span>
                    <span>&rarr;</span>
                    <span className={`font-extrabold text-sm ${adjustmentPreview.delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {adjustmentPreview.delta >= 0 ? `+${adjustmentPreview.delta}` : adjustmentPreview.delta} un
                    </span>
                    <span>&rarr;</span>
                    <span className="font-extrabold text-base text-[#7A3F51]">
                      {adjustmentPreview.next} un
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Operador</span>
                  <span className="text-xs font-bold text-[#39313A]">
                    {adminUser?.name || "Bia Teixeira"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E9D9CD]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E9D9CD] text-gray-600 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!adjustmentPreview.isValid}
                  className="px-5 py-2.5 rounded-full bg-[#7A3F51] hover:bg-[#5E303E] disabled:opacity-50 text-white font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar no Kardex</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
