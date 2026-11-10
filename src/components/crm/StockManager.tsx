"use client";

import React, { useState } from "react";
import { 
  Package, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  Sliders, 
  RotateCcw, 
  Check, 
  X, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { Product, StockMovement, MovementType } from "@/types";
import { formatDate } from "@/lib/utils";

interface StockManagerProps {
  products: Product[];
  movements: StockMovement[];
  onAddMovement: (movement: StockMovement) => void;
  onUpdateProductStock: (productId: string, newPhysical: number) => void;
}

export function StockManager({
  products,
  movements,
  onAddMovement,
  onUpdateProductStock,
}: StockManagerProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>("ENTRADA");
  const [quantityInput, setQuantityInput] = useState<number>(10);
  const [reasonInput, setReasonInput] = useState("");
  const [operatorInput, setOperatorInput] = useState("Bia Teixeira (Admin)");

  // Open adjustment modal
  const handleOpenAdjust = (p: Product) => {
    setSelectedProduct(p);
    setQuantityInput(10);
    setMovementType("ENTRADA");
    setReasonInput("Reposição de estoque");
    setIsAdjustModalOpen(true);
  };

  // Submit stock adjustment
  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const previousStock = selectedProduct.physicalStock;
    let delta = quantityInput;
    if (movementType === "SAIDA") {
      delta = -Math.abs(quantityInput);
    } else if (movementType === "AJUSTE") {
      delta = quantityInput - previousStock;
    }

    const currentStock = movementType === "AJUSTE" ? quantityInput : previousStock + delta;
    if (currentStock < 0) {
      alert("O estoque não pode ficar negativo.");
      return;
    }

    // Register movement in Kardex
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      type: movementType,
      quantity: delta,
      previousStock,
      currentStock,
      reason: reasonInput || "Ajuste manual de estoque",
      operator: operatorInput,
      date: new Date().toISOString()
    };

    onAddMovement(movement);
    onUpdateProductStock(selectedProduct.id, currentStock);
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#39313A]">
            Controle Central de Estoque
          </h2>
          <p className="text-xs text-[#39313A]/70 mt-0.5">
            Fonte oficial da verdade. Regras de concorrência, reservas atômicas e histórico imutável (Kardex).
          </p>
        </div>
      </div>

      {/* Stock Cards by Product */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm overflow-hidden">
        <div className="p-4 bg-[#FAF7F8] border-b border-[#E9D9CD] flex items-center justify-between">
          <span className="font-bold text-xs uppercase text-[#7A3F51] tracking-wider">
            Posição Consolidada do Armazém
          </span>
          <span className="text-[11px] text-gray-500">
            Total de Itens Monitorados: <strong>{products.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F8]/60 text-[#39313A]/70 uppercase tracking-wider text-[10px] border-b border-[#E9D9CD]">
              <tr>
                <th className="py-3 px-4">Item / SKU</th>
                <th className="py-3 px-4">Estoque Físico</th>
                <th className="py-3 px-4">Reservado (Pedidos)</th>
                <th className="py-3 px-4">Estoque Disponível</th>
                <th className="py-3 px-4">Segurança (Mín)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9D9CD]/40">
              {products.map((p) => {
                const available = p.physicalStock - p.reservedStock;
                const isCritical = available <= p.minStock;

                return (
                  <tr key={p.id} className="hover:bg-[#FAF7F8]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#39313A]">{p.name}</div>
                      <div className="font-mono text-[10px] text-[#7A3F51]">SKU: {p.sku}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#39313A]">
                      {p.physicalStock} un
                    </td>
                    <td className="py-3 px-4 text-amber-600 font-semibold">
                      {p.reservedStock} un
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {available} un
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {p.minStock} un
                    </td>
                    <td className="py-3 px-4">
                      {isCritical ? (
                        <span className="flex items-center gap-1 text-[10px] text-rose-600 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Reposição Necessária
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold">
                          Estoque Regular
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdjust(p)}
                        className="px-3 py-1.5 bg-[#FAF0F4] hover:bg-[#F5DDE5] text-[#7A3F51] border border-[#E9D9CD] rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#C69A76]" />
                        <span>Ajustar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KARDEX: MOVEMENTS AUDIT LOG */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C69A76]" />
            <h3 className="font-serif text-lg font-medium text-[#39313A]">
              Histórico & Auditoria de Movimentações (Kardex)
            </h3>
          </div>
          <span className="text-xs text-gray-500">
            Registro imutável de todas as baixas e entradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F8] text-[#39313A]/70 uppercase tracking-wider text-[10px] border-b border-[#E9D9CD]">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Qtd</th>
                <th className="py-3 px-4">Anterior &rarr; Atual</th>
                <th className="py-3 px-4">Motivo / Documento</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9D9CD]/40">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-[#FAF7F8]/40">
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {formatDate(m.date)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' :
                      m.type === 'SAIDA' ? 'bg-rose-100 text-rose-800' :
                      m.type === 'RESERVA' ? 'bg-amber-100 text-amber-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#39313A]">
                    {m.productName}
                  </td>
                  <td className="py-3 px-4 font-bold">
                    <span className={m.quantity > 0 ? "text-emerald-700" : "text-rose-700"}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} un
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono">
                    {m.previousStock} &rarr; <strong>{m.currentStock}</strong>
                  </td>
                  <td className="py-3 px-4 text-[#39313A] max-w-xs truncate">
                    {m.reason}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-[11px]">
                    {m.operator}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative shadow-2xl border border-[#E9D9CD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9D9CD]">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#39313A]">
                  Ajustar Estoque de Produto
                </h3>
                <p className="text-xs text-gray-500">{selectedProduct.name} ({selectedProduct.sku})</p>
              </div>
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-[#39313A] mb-1">Tipo de Movimentação</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["ENTRADA", "SAIDA", "AJUSTE", "DEVOLUCAO"] as MovementType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMovementType(t)}
                      className={`py-2 rounded-xl border text-center font-bold text-[10px] transition-all ${
                        movementType === t 
                          ? 'bg-[#9C5B6F] text-white border-[#9C5B6F] shadow-sm' 
                          : 'bg-[#FAF7F8] text-[#39313A] border-[#E9D9CD] hover:bg-[#F5DDE5]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  {movementType === "AJUSTE" ? "Novo Estoque Físico Absoluto" : "Quantidade a Movimentar"}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">Motivo / Documento de Referência</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: NF-e 8820 Compra Fornecedor ou Auditoria de Prateleira"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">Operador Responsável</label>
                <input
                  type="text"
                  value={operatorInput}
                  onChange={(e) => setOperatorInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E9D9CD]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E9D9CD] text-gray-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Movimentação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
