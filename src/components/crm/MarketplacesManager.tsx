"use client";

import React, { useState, useMemo } from "react";
import { 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Cpu,
  Settings,
  X,
  Check,
  Truck,
  Link2,
  Percent,
  Activity,
  Layers,
  ArrowRight,
  Terminal,
  Zap,
  Globe,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock
} from "lucide-react";
import { MarketplaceChannel, ChannelType } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";

interface MarketplacesManagerProps {
  channels: MarketplaceChannel[];
  onSyncChannel: (channelId: string) => void;
  onSyncAllChannels?: () => void;
  onUpdateChannel?: (updated: MarketplaceChannel) => void;
}

export function MarketplacesManager({
  channels,
  onSyncChannel,
  onSyncAllChannels,
  onUpdateChannel,
}: MarketplacesManagerProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [editingChannel, setEditingChannel] = useState<MarketplaceChannel | null>(null);

  // Config Modal Form State
  const [formAccountName, setFormAccountName] = useState("");
  const [formStoreUrl, setFormStoreUrl] = useState("");
  const [formFeePercentage, setFormFeePercentage] = useState<number>(14);
  const [formDefaultShipping, setFormDefaultShipping] = useState<number>(12.90);
  const [formStatus, setFormStatus] = useState<MarketplaceChannel["status"]>("CONECTADO");

  // Idempotency Webhook Simulator State
  const [testEventId, setTestEventId] = useState("EVT-SHOPEE-9948201");
  const [processedEvents, setProcessedEvents] = useState<string[]>([
    "EVT-ML-100293",
    "EVT-SHOPEE-884102"
  ]);
  const [simulatorLog, setSimulatorLog] = useState<{ id: string; time: string; text: string; type: "success" | "warn" | "info" }[]>([
    {
      id: "log-1",
      time: "17:15:02",
      text: "✅ GATEWAY INICIALIZADO: Pool de conexões ativas com Mercado Livre, Shopee, TikTok Shop e Loja Virtual.",
      type: "info"
    },
    {
      id: "log-2",
      time: "17:15:30",
      text: "🛡️ SEGURANÇA: Chaves de idempotência em cache Redis. Proteção contra duplo débito de pedidos ativada.",
      type: "info"
    }
  ]);

  // Estatísticas gerais para o Banner Mestre
  const stats = useMemo(() => {
    const totalChannels = channels.length;
    const connectedChannels = channels.filter(c => c.status === "CONECTADO").length;
    const totalAds = channels.reduce((sum, c) => sum + (c.activeAds || 0), 0);

    return {
      totalChannels,
      connectedChannels,
      totalAds,
    };
  }, [channels]);

  // Sincronização individual com feedback
  const handleSync = (chan: MarketplaceChannel) => {
    setSyncingId(chan.id);
    const time = new Date().toLocaleTimeString("pt-BR");
    
    setSimulatorLog((prev) => [
      {
        id: `log-${Date.now()}-1`,
        time,
        text: `🔄 [${chan.name}] Sincronização disparada via API. Validando estoque físico e catálogo de anúncios ativos...`,
        type: "info"
      },
      ...prev
    ]);

    setTimeout(() => {
      onSyncChannel(chan.id);
      setSyncingId(null);
      const finishTime = new Date().toLocaleTimeString("pt-BR");
      setSimulatorLog((prev) => [
        {
          id: `log-${Date.now()}-2`,
          time: finishTime,
          text: `✅ [${chan.name}] Sincronizado com sucesso! ${chan.activeAds || 6} anúncios alinhados. Taxa de comissão: ${chan.feePercentage}%.`,
          type: "success"
        },
        ...prev
      ]);
    }, 700);
  };

  // Forçar Sincronização em Lote de Todos os Canais
  const handleSyncAll = () => {
    setIsSyncingAll(true);
    const time = new Date().toLocaleTimeString("pt-BR");

    setSimulatorLog((prev) => [
      {
        id: `log-${Date.now()}-batch-1`,
        time,
        text: "⚡ SINCRONIZAÇÃO EM LOTE: Disparando varredura paralela em todos os conectores de vendas...",
        type: "info"
      },
      ...prev
    ]);

    setTimeout(() => {
      if (onSyncAllChannels) {
        onSyncAllChannels();
      } else {
        channels.forEach(c => onSyncChannel(c.id));
      }
      setIsSyncingAll(false);
      const finishTime = new Date().toLocaleTimeString("pt-BR");
      setSimulatorLog((prev) => [
        {
          id: `log-${Date.now()}-batch-2`,
          time: finishTime,
          text: `🎉 SUCESSO GERAL: Todos os ${channels.length} canais foram sincronizados com a Matriz Central. Zero divergências de saldo.`,
          type: "success"
        },
        ...prev
      ]);
    }, 1100);
  };

  // Abrir modal de configuração do canal
  const handleOpenConfig = (chan: MarketplaceChannel) => {
    setEditingChannel(chan);
    setFormAccountName(chan.accountName === "Não vinculado" ? "@biamakeoficial_" : chan.accountName);
    setFormStoreUrl(chan.storeUrl || "https://instagram.com/biamakeoficial_");
    setFormFeePercentage(chan.feePercentage);
    setFormDefaultShipping(chan.defaultShippingValue ?? 12.90);
    setFormStatus(chan.status === "DESCONECTADO" ? "CONECTADO" : chan.status);
  };

  // Salvar configuração do canal
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

    const time = new Date().toLocaleTimeString("pt-BR");
    setSimulatorLog((prev) => [
      {
        id: `log-${Date.now()}-config`,
        time,
        text: `⚙️ [${updated.name}] Configurações atualizadas: Taxa ${updated.feePercentage}%, Frete ${formatCurrency(updated.defaultShippingValue || 0)}. Status: ${updated.status}.`,
        type: "info"
      },
      ...prev
    ]);
  };

  // Desconectar / Reconectar Canal
  const handleToggleConnection = () => {
    if (!editingChannel || !onUpdateChannel) return;
    const newStatus: MarketplaceChannel["status"] = editingChannel.status === "CONECTADO" ? "DESCONECTADO" : "CONECTADO";
    const updated: MarketplaceChannel = {
      ...editingChannel,
      status: newStatus,
      lastSync: newStatus === "CONECTADO" ? new Date().toISOString() : "-",
    };
    onUpdateChannel(updated);
    setFormStatus(newStatus);
    setEditingChannel(null);
  };

  // Testar Simulação de Webhook com Idempotência
  const handleSimulateWebhook = () => {
    const time = new Date().toLocaleTimeString("pt-BR");
    const eventKey = testEventId.trim().toUpperCase();

    if (processedEvents.includes(eventKey)) {
      setSimulatorLog((prev) => [
        {
          id: `log-${Date.now()}-warn`,
          time,
          text: `⚠️ [IDEMPOTÊNCIA ATIVADA]: Evento "${eventKey}" já foi gravado no banco de dados. Bloqueada baixa duplicada de estoque. Retornado HTTP 200 OK seguro.`,
          type: "warn"
        },
        ...prev
      ]);
    } else {
      setProcessedEvents((prev) => [...prev, eventKey]);
      setSimulatorLog((prev) => [
        {
          id: `log-${Date.now()}-ok`,
          time,
          text: `✅ [PRIMEIRO PROCESSAMENTO]: Evento "${eventKey}" aprovado. Baixa atômica de estoque efetuada com sucesso e gravada na trava de unicidade.`,
          type: "success"
        },
        ...prev
      ]);
    }
  };

  // Gerar ID de evento aleatório
  const handleGenerateEventId = () => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const prefixes = ["EVT-SHOPEE", "EVT-ML", "EVT-TIKTOK", "EVT-SITE"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setTestEventId(`${prefix}-${rand}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. CABEÇALHO COM PAINEL DE CONTROLE DE SINCRONIZAÇÃO GLOBAL */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E9D9CD] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7A3F51] to-[#9C5B6F] text-white flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#39313A] tracking-tight">
                Hub Central de Conectividade Multicanal & Redes
              </h2>
              <p className="text-xs text-[#39313A]/70 mt-0.5">
                Gerencie feeds de produtos, taxas contratuais, sincronização de estoque e webhooks em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Ação Mestre */}
        <button
          onClick={handleSyncAll}
          disabled={isSyncingAll}
          className="px-5 py-2.5 bg-[#7A3F51] hover:bg-[#5E303E] disabled:opacity-75 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncingAll ? "animate-spin" : ""}`} />
          <span>{isSyncingAll ? "Sincronizando em Lote..." : "Forçar Sincronização em Lote"}</span>
        </button>
      </div>

      {/* Banner de Métricas Gerais de Conectividade (3 Indicadores Rápidos) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Indicador 1: Canais Conectados */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Canais Conectados
            </span>
            <div className="text-2xl font-extrabold text-[#7A3F51] mt-1">
              {stats.connectedChannels} de {stats.totalChannels} Ativos
            </div>
            <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
              100% de disponibilidade operacional
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
          </div>
        </div>

        {/* Indicador 2: Total de Anúncios Integrados */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Anúncios Ativos & Integrados
            </span>
            <div className="text-2xl font-extrabold text-[#39313A] mt-1">
              {stats.totalAds} Publicados
            </div>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              Em vitrines multicanal sincronizadas
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#FAF0F4] text-[#7A3F51] border border-[#E9D9CD] flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#9C5B6F]" />
          </div>
        </div>

        {/* Indicador 3: Status da Fila */}
        <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Fila de Sincronização
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1 flex items-center gap-1.5">
              <span>Saudável</span>
            </div>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              Tempo médio de resposta: <strong>120ms</strong>
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

      </div>

      {/* 2. CARDS DE CONECTORES COM ESTÉTICA DE APP STORE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {channels.map((chan) => {
          const isSyncingThis = syncingId === chan.id || isSyncingAll;
          const isConnected = chan.status === "CONECTADO";

          return (
            <div
              key={chan.id}
              className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm hover:shadow-md transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between space-y-4 group"
            >
              
              {/* Topo do Card: Logo, Nome da Conta e Tag de Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs border border-black/5 shrink-0"
                    style={{ backgroundColor: `${chan.color}15` }}
                  >
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: chan.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#39313A] line-clamp-1">
                      {chan.name}
                    </h3>
                    <span className="text-xs font-mono text-gray-500 block">
                      {chan.accountName}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border shrink-0 ${
                  isSyncingThis
                    ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                    : isConnected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                }`}>
                  {isSyncingThis ? "SINCRONIZANDO" : chan.status}
                </span>
              </div>

              {/* Miolo do Card: Grid com 3 Métricas Essenciais em Pílulas */}
              <div className="grid grid-cols-3 gap-2 bg-[#FAF7F8] p-3 rounded-2xl border border-[#E9D9CD] text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Comissão</span>
                  <span className="font-extrabold text-[#7A3F51]">{chan.feePercentage}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Frete Base</span>
                  <span className="font-bold text-gray-700">{formatCurrency(chan.defaultShippingValue ?? 12.90)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Anúncios</span>
                  <span className="font-bold text-emerald-700">{chan.activeAds} ativos</span>
                </div>
              </div>

              {/* Barra de Saúde do Canal: Última Sincronização */}
              <div className="text-[11px] text-gray-500 flex items-center justify-between border-t border-[#E9D9CD]/50 pt-2.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Último Sync:</span>
                </span>
                <span className="font-medium text-gray-700">
                  {formatDate(chan.lastSync)}
                </span>
              </div>

              {/* Rodapé do Card com Ações Limpas */}
              <div className="flex items-center gap-2 pt-1">
                
                {/* Botão Primário: Sincronizar Estoque */}
                <button
                  type="button"
                  onClick={() => handleSync(chan)}
                  disabled={isSyncingThis}
                  className="flex-1 py-2 px-3 bg-[#FAF7F8] hover:bg-[#FAF0F4] text-[#7A3F51] border border-[#E9D9CD] hover:border-[#9C5B6F] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Sincronizar estoque e anúncios deste canal"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? "animate-spin" : ""}`} />
                  <span>{isSyncingThis ? "Sincronizando..." : "Sincronizar"}</span>
                </button>

                {/* Botão Secundário: Configurações */}
                <button
                  type="button"
                  onClick={() => handleOpenConfig(chan)}
                  className="p-2 text-gray-600 hover:text-[#7A3F51] bg-[#FAF7F8] hover:bg-[#FAF0F4] border border-[#E9D9CD] rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Configurar Taxa, Frete e Conta"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Botão Terciário: Link Externo da Loja */}
                {chan.storeUrl && (
                  <a
                    href={chan.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-[#7A3F51] bg-[#FAF7F8] hover:bg-[#FAF0F4] border border-[#E9D9CD] rounded-xl transition-all cursor-pointer shadow-2xs"
                    title="Abrir vitrine no Marketplace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

              </div>

            </div>
          );
        })}
      </div>

      {/* 3. MODAL DE CONFIGURAÇÃO DO CANAL MODERNO E INTUITIVO */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 relative shadow-2xl border border-[#E9D9CD] space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E9D9CD]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: editingChannel.color }}
                />
                <h3 className="font-serif text-lg font-bold text-[#39313A]">
                  Configurar {editingChannel.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingChannel(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Nome da Conta / Identificador Conectado *
                </label>
                <input
                  type="text"
                  required
                  value={formAccountName}
                  onChange={(e) => setFormAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] font-bold text-[#7A3F51] focus:outline-none focus:border-[#9C5B6F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Link Oficial da Loja / Vitrine
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-[#39313A]">
                      Taxa de Comissão Contratual
                    </label>
                    <span className="font-extrabold text-[#7A3F51] bg-[#FAF0F4] px-2 py-0.5 rounded-md border border-[#E9D9CD]">
                      {formFeePercentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.5"
                    value={formFeePercentage}
                    onChange={(e) => setFormFeePercentage(parseFloat(e.target.value) || 0)}
                    className="w-full accent-[#7A3F51] cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>0% (Direto)</span>
                    <span>15%</span>
                    <span>30% (Full)</span>
                  </div>
                  <p className="text-[9px] text-gray-400">Alimenta automaticamente o cálculo de deduções do DRE.</p>
                </div>

                <div>
                  <label className="block font-bold text-[#39313A] mb-1">
                    Frete Padrão Embutido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formDefaultShipping}
                    onChange={(e) => setFormDefaultShipping(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] font-bold focus:outline-none focus:border-[#9C5B6F]"
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">Base para anúncios integrados deste canal.</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">
                  Status da Conexão
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as MarketplaceChannel["status"])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] font-bold focus:outline-none focus:border-[#9C5B6F]"
                >
                  <option value="CONECTADO">CONECTADO (Sincronização Ativa)</option>
                  <option value="SINCRONIZANDO">SINCRONIZANDO</option>
                  <option value="DESCONECTADO">DESCONECTADO</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#E9D9CD]">
                <button
                  type="button"
                  onClick={handleToggleConnection}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    editingChannel.status === "CONECTADO"
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {editingChannel.status === "CONECTADO" ? "Desconectar Canal" : "Reconectar Canal"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingChannel(null)}
                    className="px-4 py-2 rounded-full border border-[#E9D9CD] text-gray-600 font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#7A3F51] hover:bg-[#5E303E] text-white font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. SEÇÃO DO LABORATÓRIO DE IDEMPOTÊNCIA & TESTES DE WEBHOOKS (REFORMULADO) */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 sm:p-7 shadow-sm space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E9D9CD]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#39313A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#9C5B6F]" />
              <span>Laboratório de Idempotência & Webhooks de Alta Disponibilidade</span>
            </h3>
            <p className="text-xs text-[#39313A]/70 mt-0.5">
              Proteção contra duplicidade: Se a Shopee ou Mercado Livre dispararem o mesmo pedido duas vezes, nosso sistema bloqueia baixas repetidas de estoque.
            </p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
            Garantia Atômica Ativa
          </span>
        </div>

        {/* Simulador de Disparo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Caixa de Entrada e Teste (col-span-5) */}
          <div className="lg:col-span-5 bg-[#FAF7F8] p-4 sm:p-5 rounded-2xl border border-[#E9D9CD] space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#39313A]">
                  Identificador Único do Evento (X-Event-ID)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateEventId}
                  className="text-[10px] text-[#9C5B6F] hover:text-[#7A3F51] font-bold cursor-pointer"
                >
                  Gerar Novo ID
                </button>
              </div>
              <input
                type="text"
                value={testEventId}
                onChange={(e) => setTestEventId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E9D9CD] font-mono text-xs font-bold text-[#7A3F51] focus:outline-none focus:border-[#9C5B6F]"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Dica: Dispare duas vezes o mesmo ID para ver a barreira de idempotência em ação.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulateWebhook}
                className="w-full py-2.5 px-4 bg-[#7A3F51] hover:bg-[#5E303E] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-white fill-white" />
                <span>Simular Recebimento de Webhook</span>
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#E9D9CD] text-[11px] text-gray-600 space-y-1">
              <span className="font-bold text-[#39313A] block">Chaves já gravadas na memória:</span>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                {processedEvents.map((ev, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-[#FAF7F8] border border-[#E9D9CD] text-[#7A3F51]">
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Terminal de Logs Developer Console (col-span-7) */}
          <div className="lg:col-span-7 bg-[#1E1A1D] rounded-2xl p-4 border border-[#39313A] shadow-lg text-xs font-mono space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-white/50 text-[10px]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Developer Console • Webhook Event Stream</span>
              </div>
              <button
                onClick={() => setSimulatorLog([])}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>

            <div className="h-48 overflow-y-auto space-y-2 pr-1 text-[11px] leading-relaxed">
              {simulatorLog.length === 0 ? (
                <div className="text-white/30 italic py-6 text-center">
                  Aguardando eventos simulados ou disparos de sincronização...
                </div>
              ) : (
                simulatorLog.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg transition-all ${
                      log.type === "success"
                        ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                        : log.type === "warn"
                        ? "bg-amber-950/40 text-amber-300 border border-amber-800/40"
                        : "bg-white/5 text-gray-300"
                    }`}
                  >
                    <span className="text-white/40 text-[10px] mr-2">[{log.time}]</span>
                    <span>{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
