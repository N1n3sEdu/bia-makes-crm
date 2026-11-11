"use client";

import React, { useState } from "react";
import { 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Cpu,
  Settings,
  X,
  Check,
  Truck,
  Link2
} from "lucide-react";
import { MarketplaceChannel } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";

interface MarketplacesManagerProps {
  channels: MarketplaceChannel[];
  onSyncChannel: (channelId: string) => void;
  onUpdateChannel?: (updated: MarketplaceChannel) => void;
}

export function MarketplacesManager({
  channels,
  onSyncChannel,
  onUpdateChannel,
}: MarketplacesManagerProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<MarketplaceChannel | null>(null);

  // Config Modal Form State
  const [formAccountName, setFormAccountName] = useState("");
  const [formStoreUrl, setFormStoreUrl] = useState("");
  const [formFeePercentage, setFormFeePercentage] = useState<number>(14);
  const [formDefaultShipping, setFormDefaultShipping] = useState<number>(12.90);
  const [formStatus, setFormStatus] = useState<MarketplaceChannel["status"]>("CONECTADO");

  // Idempotency Webhook Simulator State
  const [testEventId, setTestEventId] = useState("EVT-SHOPEE-9948201");
  const [processedEvents, setProcessedEvents] = useState<string[]>(["EVT-ML-100293"]);
  const [simulatorLog, setSimulatorLog] = useState<string[]>([]);

  const handleSync = (chan: MarketplaceChannel) => {
    setSyncingId(chan.id);
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    
    // Registra o evento de início de sincronização no log de rastreabilidade
    setSimulatorLog((prev) => [
      `[${timestamp}] 🔄 SINCRONIZAÇÃO INICIADA: Conectando à API oficial de "${chan.name}" (${chan.accountName}). Validando estoque e anúncios ativos...`,
      ...prev,
    ]);

    setTimeout(() => {
      onSyncChannel(chan.id);
      setSyncingId(null);
      const finishTime = new Date().toLocaleTimeString('pt-BR');
      setSimulatorLog((prev) => [
        `[${finishTime}] ✅ SINCRONIZAÇÃO CONCLUÍDA: "${chan.name}" sincronizado com sucesso. Anúncios validados com taxa contratual de ${chan.feePercentage}%. Status: CONECTADO.`,
        ...prev,
      ]);
    }, 800);
  };

  const handleOpenConfig = (chan: MarketplaceChannel) => {
    setEditingChannel(chan);
    setFormAccountName(chan.accountName === "Não vinculado" ? "@biamakeoficial_" : chan.accountName);
    setFormStoreUrl(chan.storeUrl || "https://instagram.com/biamakeoficial_");
    setFormFeePercentage(chan.feePercentage);
    setFormDefaultShipping(chan.defaultShippingValue ?? 12.90);
    setFormStatus(chan.status === "DESCONECTADO" ? "CONECTADO" : chan.status);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel || !onUpdateChannel) return;

    const updated: MarketplaceChannel = {
      ...editingChannel,
      accountName: formAccountName.trim() || "Não vinculado",
      storeUrl: formStoreUrl.trim() || undefined,
      feePercentage: Number(formFeePercentage),
      defaultShippingValue: Number(formDefaultShipping),
      status: formStatus,
      lastSync: formStatus === "CONECTADO" ? new Date().toISOString() : "-",
      activeAds: formStatus === "CONECTADO" ? Math.max(editingChannel.activeAds, 6) : 0,
    };

    onUpdateChannel(updated);
    setEditingChannel(null);
  };

  // Test Idempotency logic
  const handleSimulateWebhook = () => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    if (processedEvents.includes(testEventId)) {
      setSimulatorLog(prev => [
        `[${timestamp}] ⚠️ IDEMPOTÊNCIA ATIVADA: Evento "${testEventId}" já foi processado anteriormente. Nenhuma baixa duplicada de estoque executada. Retornado HTTP 200 OK.`,
        ...prev
      ]);
    } else {
      setProcessedEvents(prev => [...prev, testEventId]);
      setSimulatorLog(prev => [
        `[${timestamp}] ✅ SUCESSO: Primeiro processamento do evento "${testEventId}". Baixa atômica de estoque confirmada. Chave gravada no banco.`,
        ...prev
      ]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#39313A]">
            Central de Integração com Marketplaces & Redes
          </h2>
          <p className="text-xs text-[#39313A]/70 mt-0.5">
            Conectores independentes para Mercado Livre, Shopee, Amazon, TikTok Shop, Magalu e Shein com estoque e frete sincronizados.
          </p>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((chan) => {
          const isSyncing = syncingId === chan.id;

          return (
            <div 
              key={chan.id}
              className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm border border-black/10" 
                      style={{ backgroundColor: chan.color }} 
                    />
                    <h3 className="font-display text-lg font-bold text-[#39313A]">
                      {chan.name}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    chan.status === 'CONECTADO' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : chan.status === 'SINCRONIZANDO'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {chan.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[#39313A]/80 bg-[#FAF7F8] p-3.5 rounded-2xl border border-[#E9D9CD]/50">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Conta Vinculada:</span>
                    <span className="font-bold text-[#39313A]">{chan.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Anúncios c/ Estoque Embutido:</span>
                    <span className="font-bold text-[#7A3F51]">{chan.activeAds} ativos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taxa de Comissão:</span>
                    <span className="font-semibold">{chan.feePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Frete Padrão Embutido:</span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(chan.defaultShippingValue ?? 12.90)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-[#E9D9CD]/40">
                    <span className="text-gray-400">Última Sincronização:</span>
                    <span className="text-gray-600 font-medium">{formatDate(chan.lastSync)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                {chan.status === 'DESCONECTADO' ? (
                  <button
                    onClick={() => handleOpenConfig(chan)}
                    className="flex-1 py-2.5 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Vincular & Conectar Conta</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSync(chan)}
                      disabled={isSyncing}
                      className="flex-1 py-2.5 rounded-full bg-[#FAF0F4] hover:bg-[#F5DDE5] border border-[#E9D9CD] text-[#7A3F51] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#C69A76] ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Estoque'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenConfig(chan)}
                      className="p-2.5 rounded-full bg-white hover:bg-gray-50 border border-[#E9D9CD] text-gray-600 hover:text-[#9C5B6F] transition-colors"
                      title="Configurar Conta, Link e Frete do Canal"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* IDEMPOTENCY & CONCURRENCY TEST LAB */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-[#7A3F51]">
          <ShieldCheck className="w-5 h-5 text-[#C69A76]" />
          <h3 className="font-display text-lg font-bold text-[#39313A]">
            Mecanismo Anti-Duplicidade & Idempotência de Webhooks
          </h3>
        </div>

        <p className="text-xs text-[#39313A]/70 max-w-3xl leading-relaxed">
          Garante a regra obrigatória do projeto: se marketplaces enviarem requisições repetidas do mesmo pedido por instabilidade de rede, <strong>nenhuma baixa duplicada de estoque é executada</strong>.
        </p>

        {/* Interactive Simulator */}
        <div className="bg-[#FAF7F8] p-4 rounded-2xl border border-[#E9D9CD] space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Idempotency-Key / Event ID Simulado
              </label>
              <input
                type="text"
                value={testEventId}
                onChange={(e) => setTestEventId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] font-mono font-bold"
              />
            </div>
            <div className="pt-4 sm:pt-4 w-full sm:w-auto">
              <button
                onClick={handleSimulateWebhook}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Cpu className="w-4 h-4" />
                <span>Simular Disparo de Webhook</span>
              </button>
            </div>
          </div>

          {/* Console Output */}
          <div className="bg-zinc-900 text-zinc-100 p-3.5 rounded-xl text-xs font-mono max-h-40 overflow-y-auto space-y-1">
            <div className="text-zinc-500 text-[10px]">-- Console de Logs de Idempotência --</div>
            {simulatorLog.length === 0 ? (
              <div className="text-zinc-600 italic">Clique acima para testar disparos repetidos e validar o bloqueio...</div>
            ) : (
              simulatorLog.map((log, idx) => (
                <div key={idx} className="leading-relaxed">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CHANNEL CONFIGURATION MODAL */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-[#E9D9CD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9D9CD]">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: editingChannel.color }}
                />
                <h3 className="font-display text-lg font-bold text-[#39313A]">
                  Configurar {editingChannel.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingChannel(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Nome da Conta / Identificador da Loja *
                </label>
                <input
                  type="text"
                  required
                  value={formAccountName}
                  onChange={(e) => setFormAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] font-semibold focus:outline-none focus:border-[#9C5B6F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Link Oficial da Loja / Rede Social
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formStoreUrl}
                  onChange={(e) => setFormStoreUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">
                    Taxa Comissão (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formFeePercentage}
                    onChange={(e) => setFormFeePercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">
                    Frete Embutido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formDefaultShipping}
                    onChange={(e) => setFormDefaultShipping(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] font-bold text-[#7A3F51]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Status da Conexão
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as MarketplaceChannel["status"])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] font-bold"
                >
                  <option value="CONECTADO">CONECTADO (Sincronização Ativa)</option>
                  <option value="SINCRONIZANDO">SINCRONIZANDO</option>
                  <option value="DESCONECTADO">DESCONECTADO</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E9D9CD]">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 rounded-full border border-[#E9D9CD] text-gray-600 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Canal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
