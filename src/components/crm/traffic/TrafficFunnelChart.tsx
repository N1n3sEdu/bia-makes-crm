'use client';

import React from 'react';
import { FunnelStep } from '@/types/analytics';
import { Eye, ShoppingBag, CreditCard, MessageCircle, Globe, AlertTriangle, ArrowRight } from 'lucide-react';

interface TrafficFunnelChartProps {
  steps: FunnelStep[];
}

const STEP_ICONS = {
  visit: Globe,
  product_view: Eye,
  add_to_cart: ShoppingBag,
  begin_checkout: CreditCard,
  whatsapp_order: MessageCircle,
};

export function TrafficFunnelChart({ steps }: TrafficFunnelChartProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const Icon = STEP_ICONS[step.key] || Globe;
          const isBottleneck = step.isBiggestDropoff;
          const dropText = idx > 0 ? `-${step.dropoffRate}% vs etapa anterior` : 'Entrada';

          return (
            <div
              key={step.key}
              className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                isBottleneck
                  ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40'
                  : 'bg-white border-[#E9D9CD]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isBottleneck
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-[#FAF0F4] text-[#7A3F51]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Etapa {idx + 1}
                  </span>
                </div>

                <div className="text-xs font-semibold text-stone-600 line-clamp-1">
                  {step.label}
                </div>

                <div className="text-2xl font-extrabold text-[#39313A] mt-1">
                  {step.sessions.toLocaleString('pt-BR')}
                </div>
                <div className="text-[11px] text-stone-500 font-medium">
                  {step.conversionFromFirst}% do tráfego total
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E9D9CD]/60 flex items-center justify-between text-[11px]">
                <span
                  className={`font-semibold ${
                    idx === 0
                      ? 'text-stone-400'
                      : isBottleneck
                      ? 'text-amber-800 font-bold flex items-center gap-1'
                      : 'text-stone-500'
                  }`}
                >
                  {isBottleneck && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  {dropText}
                </span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-stone-300 hidden md:block" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerta de maior gargalo */}
      {steps.some((s) => s.isBiggestDropoff) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <strong>Ponto de Atenção no Funil:</strong>{' '}
            {(() => {
              const b = steps.find((s) => s.isBiggestDropoff);
              if (!b) return '';
              return `A maior perda acontece em "${b.label}", onde ${b.dropoffRate}% das clientes desistem. Recomendamos revisar fotos dos produtos, valores de frete e opções de pagamento.`;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
