"use client";

import React from "react";
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle,
  Percent,
  FileSpreadsheet
} from "lucide-react";
import { FinancialMetric, MarketplaceChannel } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface FinancialManagerProps {
  financial: FinancialMetric;
  channels: MarketplaceChannel[];
}

export function FinancialManager({
  financial,
  channels,
}: FinancialManagerProps) {
  // Gross Profit calculation
  const grossProfit = financial.grossRevenue - financial.marketplaceFees - financial.cmv;
  const grossMargin = ((grossProfit / financial.grossRevenue) * 100).toFixed(1);

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

      {/* Top 3 High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            Faturamento Bruto
          </div>
          <div className="text-3xl font-bold text-[#7A3F51] mt-2">
            {formatCurrency(financial.grossRevenue)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {financial.ordersCount} pedidos faturados
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
          
          <div className="flex justify-between py-2 border-b border-gray-100 font-bold text-sm text-[#39313A]">
            <span>(+) Receita Operacional Bruta</span>
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
