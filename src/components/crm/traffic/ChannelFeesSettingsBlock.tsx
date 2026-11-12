'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sliders, Check } from 'lucide-react';
import { MarketplaceChannel } from '@/types';

interface ChannelFeesSettingsBlockProps {
  channels: MarketplaceChannel[];
  onUpdateChannel: (channel: MarketplaceChannel) => void;
}

export function ChannelFeesSettingsBlock({
  channels,
  onUpdateChannel,
}: ChannelFeesSettingsBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState<number>(0);
  const [editShipping, setEditShipping] = useState<number>(0);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const handleStartEdit = (channel: MarketplaceChannel) => {
    setEditingId(channel.id);
    setEditFee(channel.feePercentage);
    setEditShipping(channel.defaultShippingValue || 0);
  };

  const handleSave = (channel: MarketplaceChannel) => {
    onUpdateChannel({
      ...channel,
      feePercentage: Number(editFee) || 0,
      defaultShippingValue: Number(editShipping) || 0,
    });
    setEditingId(null);
    setSavedSuccess(channel.id);
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-[#FAF7F8] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAF0F4] text-[#7A3F51] flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-[#39313A]">
              Configurações dos canais de venda (taxas usadas no Financeiro)
            </h4>
            <p className="text-[11px] text-stone-500">
              Essas porcentagens são utilizadas pelo DRE e módulo Financeiro para deduzir comissões e frete por canal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#7A3F51]">
          <span>{isOpen ? 'Ocultar configurações' : 'Expandir taxas'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-[#E9D9CD] bg-[#FAF7F8]/40 space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map((channel) => {
              const isEditing = editingId === channel.id;

              return (
                <div
                  key={channel.id}
                  className="p-3.5 bg-white rounded-2xl border border-[#E9D9CD] shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#39313A]">{channel.name}</span>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: channel.color || '#C69A76' }}
                    />
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-stone-500 font-bold block mb-0.5">
                          Taxa de Comissão (%):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editFee}
                          onChange={(e) => setEditFee(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#C69A76] font-bold text-[#7A3F51] bg-[#FAF7F8] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 font-bold block mb-0.5">
                          Frete Base Padrão (R$):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={editShipping}
                          onChange={(e) => setEditShipping(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#C69A76] font-bold text-[#7A3F51] bg-[#FAF7F8] focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => handleSave(channel)}
                          className="flex-1 py-1.5 bg-[#7A3F51] hover:bg-[#683343] text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1.5 border border-[#E9D9CD] text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-[#E9D9CD]/50">
                      <div>
                        <div className="text-[11px] text-stone-500">
                          Comissão:{' '}
                          <strong className="text-[#7A3F51] font-bold">
                            {channel.feePercentage}%
                          </strong>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Frete Padrão:{' '}
                          <strong className="text-[#39313A] font-bold">
                            R$ {(channel.defaultShippingValue || 0).toFixed(2).replace('.', ',')}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {savedSuccess === channel.id && (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Salvo
                          </span>
                        )}
                        <button
                          onClick={() => handleStartEdit(channel)}
                          className="px-2.5 py-1 rounded-lg border border-[#E9D9CD] hover:border-[#7A3F51] text-[11px] font-semibold text-[#7A3F51] hover:bg-[#FAF0F4] transition-all"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
