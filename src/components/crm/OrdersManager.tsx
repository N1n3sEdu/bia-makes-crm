"use client";

import React, { useState } from "react";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  CheckCircle, 
  Truck, 
  Clock, 
  PackageCheck, 
  ExternalLink,
  Eye,
  X
} from "lucide-react";
import { Order, OrderStatus, ChannelType } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrdersManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export function OrdersManager({
  orders,
  onUpdateOrderStatus,
}: OrdersManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchSearch = 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchChannel = channelFilter === "ALL" || o.channel === channelFilter;
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchChannel && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#39313A]">
            Central de Pedidos & Vendas Multicanal
          </h2>
          <p className="text-xs text-[#39313A]/70 mt-0.5">
            Gerenciamento consolidado de pedidos vindos do Site, Mercado Livre, Shopee, TikTok Shop e Balcão.
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Nº do Pedido ou Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF7F8] rounded-full border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Canal */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs bg-[#FAF7F8] border border-[#E9D9CD] rounded-full px-3 py-1.5 focus:outline-none focus:border-[#9C5B6F]"
          >
            <option value="ALL">Todos os Canais</option>
            <option value="SITE">Loja Virtual (B2C)</option>
            <option value="MERCADO_LIVRE">Mercado Livre</option>
            <option value="SHOPEE">Shopee</option>
            <option value="TIKTOK">TikTok Shop</option>
            <option value="BALCAO">Balcão / Loja Física</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#FAF7F8] border border-[#E9D9CD] rounded-full px-3 py-1.5 focus:outline-none focus:border-[#9C5B6F]"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="SEPARACAO">Em Separação</option>
            <option value="ENVIADO">Enviado</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-[#39313A]/70 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Pedido / Data</th>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9D9CD]/40">
              {filteredOrders.map((order) => {
                const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0);

                return (
                  <tr key={order.id} className="hover:bg-[#FAF7F8]/50 transition-colors">
                    
                    {/* Order Number & Date */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#7A3F51]">
                        {order.orderNumber}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0F4] text-[#9C5B6F] border border-[#E9D9CD]">
                        {order.channel.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#39313A]">{order.customerName}</div>
                      <div className="text-[10px] text-gray-400">{order.customerPhone}</div>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#39313A]">{totalItems} un</span>
                      <div className="text-[10px] text-gray-500 line-clamp-1">
                        {order.items.map(i => i.productName).join(', ')}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 font-bold text-[#39313A]">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    {/* Status with Quick Toggle */}
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border focus:outline-none cursor-pointer ${
                          order.status === 'CONCLUIDO' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : order.status === 'ENVIADO'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : order.status === 'SEPARACAO'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-purple-100 text-purple-800 border-purple-300'
                        }`}
                      >
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="PAGO">PAGO</option>
                        <option value="SEPARACAO">EM SEPARAÇÃO</option>
                        <option value="ENVIADO">ENVIADO</option>
                        <option value="CONCLUIDO">CONCLUÍDO</option>
                        <option value="CANCELADO">CANCELADO</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="p-1.5 text-gray-500 hover:text-[#9C5B6F] hover:bg-[#F5DDE5] rounded-lg transition-colors"
                        title="Ver Detalhes do Pedido"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative shadow-2xl border border-[#E9D9CD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9D9CD]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C69A76]">
                  {viewingOrder.channel.replace('_', ' ')}
                </span>
                <h3 className="font-serif text-xl font-medium text-[#39313A]">
                  Pedido {viewingOrder.orderNumber}
                </h3>
              </div>
              <button 
                onClick={() => setViewingOrder(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              
              {/* Customer info */}
              <div className="bg-[#FAF7F8] p-3.5 rounded-2xl border border-[#E9D9CD]/70 space-y-1">
                <div className="font-bold text-[#39313A]">{viewingOrder.customerName}</div>
                <div className="text-gray-500">{viewingOrder.customerEmail} • {viewingOrder.customerPhone}</div>
                <div className="text-gray-600 text-[11px] pt-1">
                  <strong>Entrega:</strong> {viewingOrder.shippingAddress}
                </div>
                {viewingOrder.trackingCode && (
                  <div className="text-[#9C5B6F] font-mono font-bold text-[11px] pt-1">
                    Rastreio: {viewingOrder.trackingCode}
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="font-bold text-[#39313A] mb-2 uppercase text-[10px] tracking-wider">
                  Itens Comprados
                </h4>
                <div className="space-y-2">
                  {viewingOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl border border-[#E9D9CD] bg-white">
                      <div>
                        <div className="font-semibold text-[#39313A]">{it.productName}</div>
                        {it.variationName && (
                          <div className="text-[10px] text-[#9C5B6F]">{it.variationName}</div>
                        )}
                        <div className="text-[10px] text-gray-400 font-mono">SKU: {it.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#39313A]">{formatCurrency(it.price * it.quantity)}</div>
                        <div className="text-[10px] text-gray-500">{it.quantity}x {formatCurrency(it.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Total */}
              <div className="pt-2 border-t border-[#E9D9CD] flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-gray-500 block">Forma de Pagamento</span>
                  <span className="font-semibold text-[#39313A]">{viewingOrder.paymentMethod}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Total do Pedido</span>
                  <span className="text-xl font-bold text-[#7A3F51]">
                    {formatCurrency(viewingOrder.totalAmount)}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
