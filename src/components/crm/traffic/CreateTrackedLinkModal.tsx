'use client';

import React, { useState } from 'react';
import { X, Link as LinkIcon, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Product } from '@/types';

interface CreateTrackedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onCreated: () => void;
}

const PRESET_CHANNELS = [
  { id: 'insta_bio', label: 'Instagram — Link da Bio', source: 'instagram', medium: 'bio', codeSuffix: 'bio-insta' },
  { id: 'insta_stories', label: 'Instagram — Stories / Figurinha', source: 'instagram', medium: 'stories', codeSuffix: 'stories-insta' },
  { id: 'insta_direct', label: 'Instagram — Direct / Mensagens', source: 'instagram', medium: 'direct', codeSuffix: 'direct-insta' },
  { id: 'tiktok_bio', label: 'TikTok — Link da Bio', source: 'tiktok', medium: 'bio', codeSuffix: 'bio-tiktok' },
  { id: 'tiktok_video', label: 'TikTok — Vídeo / Parceria', source: 'tiktok', medium: 'video', codeSuffix: 'video-tiktok' },
  { id: 'wpp_status', label: 'WhatsApp — Status', source: 'whatsapp', medium: 'status', codeSuffix: 'status-zap' },
  { id: 'wpp_grupo', label: 'WhatsApp — Grupo VIP / Lista', source: 'whatsapp', medium: 'grupo', codeSuffix: 'grupo-zap' },
  { id: 'facebook', label: 'Facebook — Post / Página', source: 'facebook', medium: 'social', codeSuffix: 'post-fb' },
  { id: 'google_cpc', label: 'Google — Campanha Paga (Ads)', source: 'google', medium: 'cpc', codeSuffix: 'ads-google' },
  { id: 'outro', label: 'Outro Canal Personalizado', source: 'outros', medium: 'custom', codeSuffix: 'promo' },
];

export function CreateTrackedLinkModal({
  isOpen,
  onClose,
  products,
  onCreated,
}: CreateTrackedLinkModalProps) {
  const [name, setName] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(PRESET_CHANNELS[0].id);
  const [destinationType, setDestinationType] = useState<'home' | 'product'>('home');
  const [selectedSku, setSelectedSku] = useState(products[0]?.sku || '');
  const [campaign, setCampaign] = useState('');
  const [code, setCode] = useState('bio-insta');
  const [customSource, setCustomSource] = useState('');
  const [customMedium, setCustomMedium] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChannelChange = (channelId: string) => {
    setSelectedChannel(channelId);
    const preset = PRESET_CHANNELS.find((c) => c.id === channelId);
    if (preset) {
      if (destinationType === 'product' && selectedSku) {
        const cleanSku = selectedSku.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
        setCode(`${preset.codeSuffix}-${cleanSku}`);
      } else {
        setCode(preset.codeSuffix);
      }
    }
  };

  const handleDestinationTypeChange = (type: 'home' | 'product') => {
    setDestinationType(type);
    const preset = PRESET_CHANNELS.find((c) => c.id === selectedChannel);
    if (preset) {
      if (type === 'product' && selectedSku) {
        const cleanSku = selectedSku.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
        setCode(`${preset.codeSuffix}-${cleanSku}`);
      } else {
        setCode(preset.codeSuffix);
      }
    }
  };

  const handleProductChange = (sku: string) => {
    setSelectedSku(sku);
    const preset = PRESET_CHANNELS.find((c) => c.id === selectedChannel);
    if (preset) {
      const cleanSku = sku.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
      setCode(`${preset.codeSuffix}-${cleanSku}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const preset = PRESET_CHANNELS.find((c) => c.id === selectedChannel);
    const source = selectedChannel === 'outro' ? (customSource.trim() || 'outros') : preset?.source || 'direto';
    const medium = selectedChannel === 'outro' ? (customMedium.trim() || null) : preset?.medium || null;
    const destination = destinationType === 'home' ? '/' : `/p/${encodeURIComponent(selectedSku)}`;

    // Normalização do código
    const cleanCode = code
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

    if (cleanCode.length < 3 || cleanCode.length > 40) {
      setErrorMessage('O código do link deve ter entre 3 e 40 caracteres (apenas letras, números e hífens).');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Por favor, informe um nome para identificar este link.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          name: name.trim(),
          destination,
          utm_source: source,
          utm_medium: medium,
          utm_campaign: campaign.trim() || null,
          utm_content: cleanCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao criar link rastreável.');
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao salvar link rastreável.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E9D9CD] shadow-2xl overflow-hidden my-6 relative flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E9D9CD] bg-gradient-to-r from-[#FAF0F4] via-white to-[#FAF0F4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#7A3F51] text-white flex items-center justify-center shadow-md">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#39313A]">
                Novo Link Rastreável
              </h3>
              <p className="text-xs text-stone-500">
                Meça os cliques e descubra quantas vendas cada link gera
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nome do link */}
          <div>
            <label className="block font-bold text-[#39313A] mb-1">
              Nome do Link (para seu controle interno) *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Bio do Instagram Principal, Stories Base Matte, Status Zap Segunda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#7A3F51] bg-[#FAF7F8]"
            />
          </div>

          {/* Destino */}
          <div>
            <label className="block font-bold text-[#39313A] mb-1">
              Para onde a cliente deve ir ao clicar? *
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleDestinationTypeChange('home')}
                className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                  destinationType === 'home'
                    ? 'bg-[#7A3F51] text-white border-[#7A3F51] shadow-sm'
                    : 'bg-[#FAF7F8] border-[#E9D9CD] text-stone-600 hover:border-[#7A3F51]'
                }`}
              >
                Página Inicial da Loja (/)
              </button>
              <button
                type="button"
                onClick={() => handleDestinationTypeChange('product')}
                className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                  destinationType === 'product'
                    ? 'bg-[#7A3F51] text-white border-[#7A3F51] shadow-sm'
                    : 'bg-[#FAF7F8] border-[#E9D9CD] text-stone-600 hover:border-[#7A3F51]'
                }`}
              >
                Produto Específico (/p/...)
              </button>
            </div>

            {destinationType === 'product' && (
              <select
                value={selectedSku}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#7A3F51] bg-[#FAF7F8]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.sku}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Onde vai divulgar */}
          <div>
            <label className="block font-bold text-[#39313A] mb-1">
              Onde você vai divulgar esse link? *
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#7A3F51] bg-[#FAF7F8]"
            >
              {PRESET_CHANNELS.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>

          {selectedChannel === 'outro' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-stone-600 mb-1">Origem (Ex: twitter, telegram)</label>
                <input
                  type="text"
                  placeholder="origem"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9D9CD] bg-[#FAF7F8]"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-600 mb-1">Mídia (Ex: banner, email)</label>
                <input
                  type="text"
                  placeholder="midia"
                  value={customMedium}
                  onChange={(e) => setCustomMedium(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E9D9CD] bg-[#FAF7F8]"
                />
              </div>
            </div>
          )}

          {/* Campanha opcional */}
          <div>
            <label className="block font-bold text-[#39313A] mb-1">
              Nome da Campanha (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: black-friday, dia-das-maes, promo-base"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#7A3F51] bg-[#FAF7F8]"
            />
          </div>

          {/* Código final do link */}
          <div className="p-3.5 bg-[#FAF0F4] border border-[#E9D9CD] rounded-2xl space-y-1.5">
            <label className="block font-bold text-[#7A3F51]">
              Link curto gerado:
            </label>
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-stone-500">https://biamakes.com.br/r/</span>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 px-2 py-1 rounded-lg border border-[#C69A76] bg-white font-bold text-[#7A3F51] focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Esse é o link seguro que você cola na bio ou nos stories. Ele registra o clique e redireciona automaticamente com todas as UTMs.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9D9CD]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E9D9CD] text-stone-600 hover:bg-stone-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#7A3F51] hover:bg-[#683343] text-white font-bold transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando Link...' : 'Criar Link Rastreável'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
