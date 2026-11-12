'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Radar,
  Users,
  Eye,
  MousePointerClick,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  QrCode as QrIcon,
  Copy,
  Check,
  Archive,
  Smartphone,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  Flame,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { useBiaMakes } from '@/context/BiaMakesContext';
import { TrafficSummary, TrackedLink } from '@/types/analytics';
import { TrafficTimeSeriesChart } from './traffic/TrafficTimeSeriesChart';
import { TrafficFunnelChart } from './traffic/TrafficFunnelChart';
import { TrafficHeatmap } from './traffic/TrafficHeatmap';
import { CreateTrackedLinkModal } from './traffic/CreateTrackedLinkModal';
import { QrCodeModal } from './traffic/QrCodeModal';
import { ChannelFeesSettingsBlock } from './traffic/ChannelFeesSettingsBlock';

// Mock representativo para o Modo Demonstração (desligado por padrão)
function generateDemoData(): TrafficSummary {
  return {
    period: {
      from: new Date(Date.now() - 7 * 86400000).toISOString(),
      to: new Date().toISOString(),
      filterLabel: 'Últimos 7 dias (Demonstração)',
      compareWithPrevious: true,
    },
    liveVisitorsNow: 4,
    kpis: {
      pageviews: { current: 1840, previous: 1554, changePercent: 18.4 },
      uniqueVisitors: { current: 890, previous: 760, changePercent: 17.1 },
      linkClicks: { current: 342, previous: 280, changePercent: 22.1 },
      conversionRate: { current: 4.8, previous: 4.1, changePercent: 17.0 },
    },
    timeSeries: [
      { timeLabel: '06/11', timestamp: '2026-11-06', pageviews: 210, visitors: 110 },
      { timeLabel: '07/11', timestamp: '2026-11-07', pageviews: 285, visitors: 145 },
      { timeLabel: '08/11', timestamp: '2026-11-08', pageviews: 340, visitors: 170 },
      { timeLabel: '09/11', timestamp: '2026-11-09', pageviews: 290, visitors: 135 },
      { timeLabel: '10/11', timestamp: '2026-11-10', pageviews: 230, visitors: 115 },
      { timeLabel: '11/11', timestamp: '2026-11-11', pageviews: 265, visitors: 120 },
      { timeLabel: '12/11', timestamp: '2026-11-12', pageviews: 220, visitors: 95 },
    ],
    origins: [
      {
        source: 'instagram',
        label: 'Instagram',
        visitors: 427,
        pageviews: 920,
        percentage: 48.0,
        addToCartCount: 88,
        whatsappOrdersCount: 22,
        conversionRate: 5.1,
        color: '#E1306C',
      },
      {
        source: 'whatsapp',
        label: 'WhatsApp',
        visitors: 196,
        pageviews: 410,
        percentage: 22.0,
        addToCartCount: 52,
        whatsappOrdersCount: 14,
        conversionRate: 7.1,
        color: '#25D366',
      },
      {
        source: 'tiktok',
        label: 'TikTok',
        visitors: 133,
        pageviews: 260,
        percentage: 15.0,
        addToCartCount: 24,
        whatsappOrdersCount: 4,
        conversionRate: 3.0,
        color: '#111111',
      },
      {
        source: 'google',
        label: 'Google (Orgânico & Ads)',
        visitors: 80,
        pageviews: 150,
        percentage: 9.0,
        addToCartCount: 12,
        whatsappOrdersCount: 2,
        conversionRate: 2.5,
        color: '#4285F4',
      },
      {
        source: 'direto',
        label: 'Direto / Link salvo',
        visitors: 54,
        pageviews: 100,
        percentage: 6.0,
        addToCartCount: 6,
        whatsappOrdersCount: 1,
        conversionRate: 1.8,
        color: '#78716C',
      },
    ],
    funnel: [
      { key: 'visit', label: 'Visitou o site', sessions: 890, conversionFromFirst: 100, dropoffRate: 0 },
      { key: 'product_view', label: 'Viu um produto', sessions: 620, conversionFromFirst: 69.7, dropoffRate: 30 },
      { key: 'add_to_cart', label: 'Adicionou à sacola', sessions: 182, conversionFromFirst: 20.4, dropoffRate: 70, isBiggestDropoff: true },
      { key: 'begin_checkout', label: 'Abriu o checkout', sessions: 94, conversionFromFirst: 10.5, dropoffRate: 48 },
      { key: 'whatsapp_order', label: 'Enviou pedido no WhatsApp', sessions: 43, conversionFromFirst: 4.8, dropoffRate: 54 },
    ],
    topProducts: [
      {
        sku: 'BM-BASE-01',
        name: 'Base Matte Alta Cobertura Efeito Soft Focus',
        views: 410,
        addToCartCount: 85,
        outboundClicksCount: 30,
        ordersCount: 19,
        conversionRate: 4.6,
      },
      {
        sku: 'BM-BATOM-02',
        name: 'Batom Líquido Matte Longa Duração 12h',
        views: 245,
        addToCartCount: 42,
        outboundClicksCount: 18,
        ordersCount: 11,
        conversionRate: 4.5,
      },
      {
        sku: 'BM-PO-03',
        name: 'Pó Compacto Ultrafino Micronizado HD',
        views: 190,
        addToCartCount: 28,
        outboundClicksCount: 12,
        ordersCount: 6,
        conversionRate: 3.1,
      },
      {
        sku: 'BM-CORRET-04',
        name: 'Corretivo Camuflagem Alta Fixação Resistente à Água',
        views: 160,
        addToCartCount: 14,
        outboundClicksCount: 8,
        ordersCount: 1,
        conversionRate: 0.6,
        isHighViewLowConversion: true, // Muito visto, pouco vendido
      },
    ],
    outbounds: [
      { target: 'whatsapp', label: 'WhatsApp Oficial', clicks: 142, percentage: 54.0, color: '#25D366' },
      { target: 'instagram', label: 'Instagram da Loja', clicks: 68, percentage: 25.8, color: '#E1306C' },
      { target: 'shopee', label: 'Loja Shopee', clicks: 32, percentage: 12.2, color: '#EE4D2D' },
      { target: 'tiktok', label: 'TikTok Shop', clicks: 14, percentage: 5.3, color: '#111111' },
      { target: 'mercado_livre', label: 'Mercado Livre', clicks: 7, percentage: 2.7, color: '#FFE600' },
    ],
    devices: [
      { device: 'mobile', label: 'Celular (Mobile)', count: 774, percentage: 87 },
      { device: 'desktop', label: 'Computador (Desktop)', count: 98, percentage: 11 },
      { device: 'tablet', label: 'Tablet', count: 18, percentage: 2 },
    ],
    topRegions: [
      { name: 'São Paulo (SP)', count: 480, percentage: 54 },
      { name: 'Rio de Janeiro (RJ)', count: 160, percentage: 18 },
      { name: 'Minas Gerais (MG)', count: 115, percentage: 13 },
      { name: 'Paraná (PR)', count: 70, percentage: 8 },
      { name: 'Bahia (BA)', count: 65, percentage: 7 },
    ],
    topCities: [
      { name: 'São Paulo', count: 320, percentage: 40 },
      { name: 'Campinas', count: 85, percentage: 11 },
      { name: 'Rio de Janeiro', count: 80, percentage: 10 },
      { name: 'Belo Horizonte', count: 65, percentage: 8 },
      { name: 'Curitiba', count: 45, percentage: 6 },
    ],
    hourlyHeatmap: [
      { dayOfWeek: 2, hour: 20, visits: 78 },
      { dayOfWeek: 4, hour: 21, visits: 72 },
    ],
    peakHoursInsight:
      'Seu público mais acessa às terças e quintas-feiras entre 20h e 22h: excelente horário para postar novidades e reels.',
    originsInsight:
      '💡 O Instagram trouxe 48% das suas visitas nesta semana, mas o WhatsApp é a origem que mais converte (7,1%).',
    recentEvents: [
      {
        id: '1',
        occurred_at: new Date(Date.now() - 2 * 60000).toISOString(),
        event_type: 'product_view',
        device: 'mobile',
        city: 'São Paulo',
        region: 'SP',
        source: 'instagram',
        medium: 'stories',
        product_sku: 'BM-BASE-01',
        path: '/p/BM-BASE-01',
      },
      {
        id: '2',
        occurred_at: new Date(Date.now() - 5 * 60000).toISOString(),
        event_type: 'add_to_cart',
        device: 'mobile',
        city: 'Campinas',
        region: 'SP',
        source: 'whatsapp',
        medium: 'status',
        product_sku: 'BM-BATOM-02',
        path: '/',
      },
    ],
    trackedLinks: [
      {
        code: 'bio-insta',
        name: 'Link Principal da Bio',
        destination: '/',
        utm_source: 'instagram',
        utm_medium: 'bio',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        clicks_count: 215,
        visitors_count: 180,
        orders_count: 14,
        conversion_rate: 7.8,
      },
      {
        code: 'stories-base',
        name: 'Stories Base Matte Soft Focus',
        destination: '/p/BM-BASE-01',
        utm_source: 'instagram',
        utm_medium: 'stories',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        clicks_count: 98,
        visitors_count: 82,
        orders_count: 6,
        conversion_rate: 7.3,
      },
    ],
    isEmpty: false,
  };
}

export function TrafficManager() {
  const { products, channels, updateChannel } = useBiaMakes();

  // Filtros de período
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | '90d'>('7d');
  const [comparePrevious, setComparePrevious] = useState(true);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  // Estados de dados da API
  const [summary, setSummary] = useState<TrafficSummary | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Modais de Criação e QR Code
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrCodeLink, setQrCodeLink] = useState<{ code: string; name: string; url: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Popover de Glossário
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (isDemoMode) {
      setSummary(generateDemoData());
      return;
    }

    try {
      const params = new URLSearchParams({
        filter: periodFilter,
        compare: comparePrevious ? 'true' : 'false',
      });
      if (selectedOrigin) {
        params.set('source', selectedOrigin);
      }

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Falha ao obter dados de tráfego');
      }
      const data: TrafficSummary = await res.json();
      setSummary(data);
    } catch (err: unknown) {
      console.error('[TrafficManager] Erro:', err);
    }
  }, [periodFilter, comparePrevious, selectedOrigin, isDemoMode]);

  useEffect(() => {
    fetchAnalytics();

    // Atualização em tempo real a cada 30 segundos
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // Ações de Links Rastreáveis
  const handleCopyLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://biamakes.com.br';
    const full = `${origin}/r/${code}`;
    navigator.clipboard?.writeText(full).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenQrModal = (link: TrackedLink) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://biamakes.com.br';
    setQrCodeLink({
      code: link.code,
      name: link.name,
      url: `${origin}/r/${link.code}`,
    });
  };

  const handleArchiveLink = async (code: string) => {
    if (!confirm(`Deseja arquivar o link "/r/${code}"? Ele não aceitará novos cliques.`)) return;

    try {
      const res = await fetch('/api/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, action: 'archive' }),
      });
      if (!res.ok) throw new Error('Erro ao arquivar link');
      fetchAnalytics();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha ao arquivar link');
    }
  };

  // Exportação CSV formatada para Excel PT-BR (BOM UTF-8 + separador ;)
  const handleExportCsv = () => {
    if (!summary) return;

    const rows: string[] = [];
    rows.push('RELATÓRIO DE TRÁFEGO & ORIGEM DOS CLIENTES — BIA MAKES');
    rows.push(`Período:;${summary.period.filterLabel}`);
    rows.push(`Data de Extração:;${new Date().toLocaleString('pt-BR')}`);
    rows.push('');

    // KPIs
    rows.push('KPIS PRINCIPAIS');
    rows.push('Indicador;Valor Atual;Período Anterior;Variação (%)');
    rows.push(`Acessos (Pageviews);${summary.kpis.pageviews.current};${summary.kpis.pageviews.previous};${summary.kpis.pageviews.changePercent ?? 'S/C'}%`);
    rows.push(`Visitantes Únicos;${summary.kpis.uniqueVisitors.current};${summary.kpis.uniqueVisitors.previous};${summary.kpis.uniqueVisitors.changePercent ?? 'S/C'}%`);
    rows.push(`Cliques nos Links;${summary.kpis.linkClicks.current};${summary.kpis.linkClicks.previous};${summary.kpis.linkClicks.changePercent ?? 'S/C'}%`);
    rows.push(`Taxa de Conversão;${summary.kpis.conversionRate.current}%;${summary.kpis.conversionRate.previous}%;${summary.kpis.conversionRate.changePercent ?? 'S/C'}%`);
    rows.push('');

    // Origens
    rows.push('ORIGEM DOS VISITANTES');
    rows.push('Canal / Rede;Visitantes Únicos;Acessos;% do Tráfego;Adições à Sacola;Pedidos WhatsApp;Taxa de Conversão');
    summary.origins.forEach((o) => {
      rows.push(`${o.label};${o.visitors};${o.pageviews};${o.percentage}%;${o.addToCartCount};${o.whatsappOrdersCount};${o.conversionRate}%`);
    });
    rows.push('');

    // Funil
    rows.push('FUNIL DE COMPRA');
    rows.push('Etapa;Sessões;% Retenção;Abandono vs Etapa Anterior');
    summary.funnel.forEach((f) => {
      rows.push(`${f.label};${f.sessions};${f.conversionFromFirst}%;-${f.dropoffRate}%`);
    });
    rows.push('');

    // Links Rastreáveis
    rows.push('LINKS RASTREÁVEIS DIVULGADOS');
    rows.push('Nome;Código Curto;Destino;Origem;Cliques;Visitantes;Pedidos;Conversão');
    summary.trackedLinks.forEach((l) => {
      rows.push(`${l.name};/r/${l.code};${l.destination};${l.utm_source};${l.clicks_count || 0};${l.visitors_count || 0};${l.orders_count || 0};${l.conversion_rate || 0}%`);
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biamakes-trafego-${periodFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Glossário simples explicativo
  const GLOSSARY: Record<string, string> = {
    pageviews: 'Acessos: total de vezes que páginas da loja foram abertas por qualquer pessoa.',
    visitors: 'Visitantes Únicos: quantidade de pessoas físicas diferentes que navegaram no site.',
    linkClicks: 'Cliques nos Links: total de vezes que os links encurtados (/r/...) foram clicados nas redes.',
    conversion: 'Taxa de Conversão: porcentagem de visitas que concluíram um pedido enviado para o WhatsApp.',
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* SEÇÃO A: CABEÇALHO EXECUTIVO E CONTROLES GLOBAIS */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-[#FAF0F4] text-[#7A3F51] flex items-center justify-center">
              <Radar className="w-4 h-4" />
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#39313A]">
              Tráfego & Origem dos Clientes
            </h2>
          </div>
          <p className="text-xs text-stone-500 max-w-2xl">
            Descubra de onde vêm as clientes que visitam sua loja (Instagram, TikTok, WhatsApp ou Google) e o que elas fazem no site.
          </p>
        </div>

        {/* Controles de Período, Live Counter e Ações */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Indicador ao Vivo */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              {summary ? summary.liveVisitorsNow : 0}{' '}
              {summary?.liveVisitorsNow === 1 ? 'pessoa online agora' : 'pessoas online agora'}
            </span>
          </div>

          {/* Seletor de Período em Pílulas */}
          <div className="bg-[#FAF7F8] p-1 rounded-full border border-[#E9D9CD] flex items-center text-xs font-semibold">
            {(
              [
                { id: 'today', label: 'Hoje' },
                { id: '7d', label: '7 dias' },
                { id: '30d', label: '30 dias' },
                { id: '90d', label: '90 dias' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id)}
                className={`px-3 py-1 rounded-full transition-all ${
                  periodFilter === p.id
                    ? 'bg-[#7A3F51] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-[#7A3F51]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Toggle Comparar */}
          <button
            onClick={() => setComparePrevious(!comparePrevious)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1 transition-all ${
              comparePrevious
                ? 'bg-[#FAF0F4] border-[#7A3F51] text-[#7A3F51]'
                : 'bg-white border-[#E9D9CD] text-stone-500 hover:bg-stone-50'
            }`}
            title="Comparar números com o mesmo período anterior"
          >
            <span>vs período anterior</span>
          </button>

          {/* Toggle Modo Demonstração */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              isDemoMode
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                : 'bg-white border-[#E9D9CD] text-stone-500 hover:bg-stone-50'
            }`}
            title="Exibir dados completos simulados para testes sem alterar o banco real"
          >
            {isDemoMode ? '✨ Modo Demo (Ativo)' : 'Modo Demo'}
          </button>

          {/* Exportar CSV */}
          <button
            onClick={handleExportCsv}
            disabled={!summary || summary.isEmpty}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E9D9CD] text-stone-700 hover:border-[#7A3F51] hover:text-[#7A3F51] text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#C69A76]" />
            <span>Exportar CSV</span>
          </button>

          {/* Botão Criar Link */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#7A3F51] hover:bg-[#683343] text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Criar link rastreável</span>
          </button>
        </div>
      </div>

      {/* FILTRO DE ORIGEM ATIVO (SE HOUVER) */}
      {selectedOrigin && (
        <div className="bg-[#FAF0F4] p-3 rounded-2xl border border-[#E9D9CD] flex items-center justify-between text-xs text-[#7A3F51]">
          <div className="flex items-center gap-2">
            <span className="font-bold">Filtrando métricas pela origem:</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#C69A76] font-extrabold uppercase">
              {selectedOrigin}
            </span>
          </div>
          <button
            onClick={() => setSelectedOrigin(null)}
            className="text-xs font-bold underline hover:text-[#39313A]"
          >
            Limpar filtro (Ver todas as origens)
          </button>
        </div>
      )}

      {/* SEÇÃO B: 4 HERO CARDS DE KPIS */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Acessos */}
          <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm relative group hover:border-[#7A3F51]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#7A3F51]" />
                Acessos às Páginas
              </span>
              <button
                onClick={() =>
                  setActiveGlossaryTerm(activeGlossaryTerm === 'pageviews' ? null : 'pageviews')
                }
                className="text-stone-400 hover:text-[#7A3F51]"
                title="Explicação"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-3xl font-extrabold text-[#39313A] mt-2">
              {summary.kpis.pageviews.current.toLocaleString('pt-BR')}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E9D9CD]/50 text-xs">
              <span className="text-stone-500 text-[11px]">Total de visualizações</span>
              {summary.kpis.pageviews.changePercent !== null ? (
                <span
                  className={`flex items-center gap-0.5 font-bold ${
                    summary.kpis.pageviews.changePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {summary.kpis.pageviews.changePercent >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {summary.kpis.pageviews.changePercent > 0 ? '+' : ''}
                  {summary.kpis.pageviews.changePercent}%
                </span>
              ) : (
                <span className="text-stone-400 text-[10px]">Sem comparação</span>
              )}
            </div>

            {activeGlossaryTerm === 'pageviews' && (
              <div className="absolute top-12 left-4 right-4 z-20 p-3 bg-stone-900 text-white text-[11px] rounded-xl shadow-xl">
                {GLOSSARY.pageviews}
              </div>
            )}
          </div>

          {/* Card 2: Visitantes Únicos */}
          <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm relative group hover:border-[#7A3F51]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#C69A76]" />
                Visitantes Únicos
              </span>
              <button
                onClick={() =>
                  setActiveGlossaryTerm(activeGlossaryTerm === 'visitors' ? null : 'visitors')
                }
                className="text-stone-400 hover:text-[#7A3F51]"
                title="Explicação"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-3xl font-extrabold text-[#7A3F51] mt-2">
              {summary.kpis.uniqueVisitors.current.toLocaleString('pt-BR')}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E9D9CD]/50 text-xs">
              <span className="text-stone-500 text-[11px]">Pessoas diferentes</span>
              {summary.kpis.uniqueVisitors.changePercent !== null ? (
                <span
                  className={`flex items-center gap-0.5 font-bold ${
                    summary.kpis.uniqueVisitors.changePercent >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  {summary.kpis.uniqueVisitors.changePercent >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {summary.kpis.uniqueVisitors.changePercent > 0 ? '+' : ''}
                  {summary.kpis.uniqueVisitors.changePercent}%
                </span>
              ) : (
                <span className="text-stone-400 text-[10px]">Sem comparação</span>
              )}
            </div>

            {activeGlossaryTerm === 'visitors' && (
              <div className="absolute top-12 left-4 right-4 z-20 p-3 bg-stone-900 text-white text-[11px] rounded-xl shadow-xl">
                {GLOSSARY.visitors}
              </div>
            )}
          </div>

          {/* Card 3: Cliques nos Links Rastreáveis */}
          <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm relative group hover:border-[#7A3F51]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-[#9C5B6F]" />
                Cliques nos Seus Links
              </span>
              <button
                onClick={() =>
                  setActiveGlossaryTerm(activeGlossaryTerm === 'linkClicks' ? null : 'linkClicks')
                }
                className="text-stone-400 hover:text-[#7A3F51]"
                title="Explicação"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-3xl font-extrabold text-[#39313A] mt-2">
              {summary.kpis.linkClicks.current.toLocaleString('pt-BR')}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E9D9CD]/50 text-xs">
              <span className="text-stone-500 text-[11px]">Cliques rastreados (/r/...)</span>
              {summary.kpis.linkClicks.changePercent !== null ? (
                <span
                  className={`flex items-center gap-0.5 font-bold ${
                    summary.kpis.linkClicks.changePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {summary.kpis.linkClicks.changePercent >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {summary.kpis.linkClicks.changePercent > 0 ? '+' : ''}
                  {summary.kpis.linkClicks.changePercent}%
                </span>
              ) : (
                <span className="text-stone-400 text-[10px]">Sem comparação</span>
              )}
            </div>

            {activeGlossaryTerm === 'linkClicks' && (
              <div className="absolute top-12 left-4 right-4 z-20 p-3 bg-stone-900 text-white text-[11px] rounded-xl shadow-xl">
                {GLOSSARY.linkClicks}
              </div>
            )}
          </div>

          {/* Card 4: Taxa de Conversão */}
          <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm relative group hover:border-[#7A3F51]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                Taxa de Conversão
              </span>
              <button
                onClick={() =>
                  setActiveGlossaryTerm(activeGlossaryTerm === 'conversion' ? null : 'conversion')
                }
                className="text-stone-400 hover:text-[#7A3F51]"
                title="Explicação"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-3xl font-extrabold text-emerald-700 mt-2">
              {summary.kpis.conversionRate.current.toFixed(1).replace('.', ',')}%
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E9D9CD]/50 text-xs">
              <span className="text-stone-500 text-[11px]">Viraram pedido no WhatsApp</span>
              {summary.kpis.conversionRate.changePercent !== null ? (
                <span
                  className={`flex items-center gap-0.5 font-bold ${
                    summary.kpis.conversionRate.changePercent >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  {summary.kpis.conversionRate.changePercent >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {summary.kpis.conversionRate.changePercent > 0 ? '+' : ''}
                  {summary.kpis.conversionRate.changePercent}%
                </span>
              ) : (
                <span className="text-stone-400 text-[10px]">Sem comparação</span>
              )}
            </div>

            {activeGlossaryTerm === 'conversion' && (
              <div className="absolute top-12 left-4 right-4 z-20 p-3 bg-stone-900 text-white text-[11px] rounded-xl shadow-xl">
                {GLOSSARY.conversion}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SEÇÃO K: ESTADO VAZIO DIDÁTICO (QUANDO O BANCO ESTÁ ZERADO) */}
      {summary?.isEmpty && !isDemoMode && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-dashed border-[#C69A76]/60 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF0F4] text-[#7A3F51] flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-display text-xl font-bold text-[#39313A]">
              Sua Central de Tráfego está Pronta!
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Ainda não registramos acessos de clientes neste período. Siga o passo a passo abaixo para começar a medir as visitas vindas do Instagram e WhatsApp:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left text-xs pt-2">
            <div className="p-3.5 bg-[#FAF7F8] rounded-2xl border border-[#E9D9CD]">
              <span className="w-6 h-6 rounded-full bg-[#7A3F51] text-white flex items-center justify-center text-[11px] font-bold mb-2">
                1
              </span>
              <strong className="block text-[#39313A]">Crie seu primeiro link</strong>
              <span className="text-[11px] text-stone-500">
                Gere um link encurtado para a Bio do seu Instagram.
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF7F8] rounded-2xl border border-[#E9D9CD]">
              <span className="w-6 h-6 rounded-full bg-[#7A3F51] text-white flex items-center justify-center text-[11px] font-bold mb-2">
                2
              </span>
              <strong className="block text-[#39313A]">Cole na sua Bio</strong>
              <span className="text-[11px] text-stone-500">
                Substitua o link da sua bio do Instagram pelo link gerado.
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF7F8] rounded-2xl border border-[#E9D9CD]">
              <span className="w-6 h-6 rounded-full bg-[#7A3F51] text-white flex items-center justify-center text-[11px] font-bold mb-2">
                3
              </span>
              <strong className="block text-[#39313A]">Divulgue nos Stories</strong>
              <span className="text-[11px] text-stone-500">
                Use a figurinha de link nos stories e no status do WhatsApp.
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF7F8] rounded-2xl border border-[#E9D9CD]">
              <span className="w-6 h-6 rounded-full bg-[#7A3F51] text-white flex items-center justify-center text-[11px] font-bold mb-2">
                4
              </span>
              <strong className="block text-[#39313A]">Veja os Gráficos</strong>
              <span className="text-[11px] text-stone-500">
                Volte aqui para acompanhar os acessos em tempo real!
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-[#7A3F51] hover:bg-[#683343] text-white text-xs font-bold transition-all shadow-md"
            >
              + Criar meu primeiro link rastreável
            </button>
            <button
              onClick={() => setIsDemoMode(true)}
              className="px-4 py-2.5 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-[#7A3F51] text-xs font-bold hover:bg-[#F5DDE5] transition-all"
            >
              Ver com dados de demonstração
            </button>
          </div>
        </div>
      )}

      {/* SEÇÃO C: GRÁFICO DE ACESSOS AO LONGO DO TEMPO */}
      {summary && (!summary.isEmpty || isDemoMode) && (
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-[#39313A]">
                Evolução do Tráfego ao Longo do Tempo
              </h3>
              <p className="text-xs text-stone-500">
                {periodFilter === 'today'
                  ? 'Volume de páginas abertas e visitantes por hora hoje'
                  : 'Volume diário de acessos e visitantes únicos no período'}
              </p>
            </div>
          </div>

          <TrafficTimeSeriesChart data={summary.timeSeries} />
        </div>
      )}

      {/* SEÇÃO D & E: RANKING DE ORIGENS & FUNIL DE COMPRA */}
      {summary && (!summary.isEmpty || isDemoMode) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SEÇÃO D: DE ONDE VÊM SEUS CLIENTES (7 colunas) */}
          <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-base font-bold text-[#39313A]">
                  De Onde Vêm Seus Clientes
                </h3>
                <span className="text-xs font-bold text-[#7A3F51]">Ranking de Origens</span>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Canais e redes que mais trazem pessoas para a vitrine da Bia Makes.
              </p>

              {/* Destaque em Linguagem Natural */}
              <div className="p-3.5 bg-[#FAF0F4] border border-[#E9D9CD] rounded-2xl text-xs text-[#7A3F51] mb-4 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#C69A76] shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{summary.originsInsight}</span>
              </div>

              {/* Lista de Barras de Origem */}
              <div className="space-y-3">
                {summary.origins.map((orig) => {
                  const isFiltered = selectedOrigin === orig.source;

                  return (
                    <div
                      key={orig.source}
                      onClick={() =>
                        setSelectedOrigin(selectedOrigin === orig.source ? null : orig.source)
                      }
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isFiltered
                          ? 'bg-[#FAF0F4] border-[#7A3F51] ring-2 ring-[#7A3F51]'
                          : 'bg-[#FAF7F8]/60 border-[#E9D9CD] hover:border-[#7A3F51]/50 hover:bg-[#FAF7F8]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: orig.color }}
                          />
                          <span className="font-bold text-[#39313A]">{orig.label}</span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            ({orig.percentage}%)
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-[#7A3F51]">
                            {orig.visitors.toLocaleString('pt-BR')} visitantes
                          </span>
                          <span className="text-stone-400 text-[11px] ml-1.5">
                            · {orig.pageviews} acessos
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Visual */}
                      <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(4, orig.percentage)}%`,
                            backgroundColor: orig.color,
                          }}
                        />
                      </div>

                      {/* Métricas de Conversão da Origem */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-[#E9D9CD]/50">
                        <span>Adições à Sacola: <strong>{orig.addToCartCount}</strong></span>
                        <span>Pedidos no Zap: <strong>{orig.whatsappOrdersCount}</strong></span>
                        <span className="text-emerald-700 font-bold">
                          Conversão: {orig.conversionRate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-stone-400 italic">
              💡 Dica: Navegadores internos do Instagram e WhatsApp costumam ocultar a referência. Use links rastreáveis para ter 100% de precisão.
            </div>
          </div>

          {/* SEÇÃO E: FUNIL DE COMPRA (5 colunas) */}
          <div className="lg:col-span-5 bg-white p-5 md:p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-base font-bold text-[#39313A]">
                  Funil de Compra
                </h3>
                <span className="text-xs font-bold text-stone-400">Jornada da Cliente</span>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Acompanhe quantas pessoas avançam da primeira visita até o pedido no WhatsApp.
              </p>
            </div>

            <TrafficFunnelChart steps={summary.funnel} />
          </div>

        </div>
      )}

      {/* SEÇÃO F & G: TOP PRODUTOS ACESSADOS & CLIQUES DE SAÍDA */}
      {summary && (!summary.isEmpty || isDemoMode) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SEÇÃO F: PRODUTOS MAIS ACESSADOS (7 colunas) */}
          <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#39313A]">
                  Produtos Mais Acessados
                </h3>
                <p className="text-xs text-stone-500">
                  Os cosméticos mais visualizados pelas clientes na vitrine e nos links sociais.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E9D9CD] text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="py-2.5">Produto</th>
                    <th className="py-2.5 text-center">Visualizações</th>
                    <th className="py-2.5 text-center">Sacola</th>
                    <th className="py-2.5 text-center">Pedidos Zap</th>
                    <th className="py-2.5 text-right">Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9D9CD]/50">
                  {summary.topProducts.map((tp) => {
                    // Cruzamento com a lista de produtos reais do contexto para pegar nome e foto
                    const prodMatch = products.find((p) => p.sku === tp.sku || p.id === tp.sku);
                    const prodName = prodMatch?.name || tp.name;
                    const prodImage = prodMatch?.images[0] || '/logo.jpg';

                    return (
                      <tr key={tp.sku} className="hover:bg-[#FAF7F8] transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#FAF0F4] shrink-0 border border-[#E9D9CD]">
                              <Image src={prodImage} alt={prodName} fill className="object-cover" />
                            </div>
                            <div className="max-w-[220px]">
                              <span className="font-bold text-[#39313A] line-clamp-1 block">
                                {prodName}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                SKU: {tp.sku}
                              </span>
                              {tp.isHighViewLowConversion && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold mt-0.5">
                                  <Flame className="w-3 h-3 text-amber-600" /> Muito visto, pouco vendido
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center font-bold text-[#7A3F51]">
                          {tp.views}
                        </td>
                        <td className="py-3 text-center text-stone-600 font-semibold">
                          {tp.addToCartCount}
                        </td>
                        <td className="py-3 text-center text-emerald-700 font-bold">
                          {tp.ordersCount}
                        </td>
                        <td className="py-3 text-right font-extrabold text-[#39313A]">
                          {tp.conversionRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO G: PARA ONDE OS CLIENTES SAEM (5 colunas) */}
          <div className="lg:col-span-5 bg-white p-5 md:p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-[#39313A]">
                Para Onde os Clientes Saem
              </h3>
              <p className="text-xs text-stone-500">
                Pessoas que saíram do site clicando nos botões de contato e redes sociais.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {summary.outbounds.map((ob) => (
                <div
                  key={ob.target}
                  className="p-3 bg-[#FAF7F8] rounded-2xl border border-[#E9D9CD] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ob.color }}
                    />
                    <span className="font-bold text-[#39313A]">{ob.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#7A3F51]">{ob.clicks} cliques</span>
                    <span className="text-[10px] text-stone-400 ml-1.5 font-mono">
                      ({ob.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#FAF0F4] rounded-2xl text-[11px] text-[#7A3F51] flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#C69A76] shrink-0" />
              <span>
                O WhatsApp é o destino mais acionado para tirar dúvidas de tons e fechar pedidos.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SEÇÃO H: PERFIL DO PÚBLICO (3 CARDS) */}
      {summary && (!summary.isEmpty || isDemoMode) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Dispositivos */}
          <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-3">
            <h4 className="font-display text-sm font-bold text-[#39313A] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#7A3F51]" />
              Dispositivos Utilizados
            </h4>
            <div className="space-y-2 pt-1">
              {summary.devices.map((dev) => (
                <div key={dev.device} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 font-medium">{dev.label}</span>
                    <span className="font-bold text-[#39313A]">{dev.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-[#7A3F51] rounded-full"
                      style={{ width: `${dev.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Localização */}
          <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-3">
            <h4 className="font-display text-sm font-bold text-[#39313A] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C69A76]" />
              Principais Cidades & Estados
            </h4>
            <div className="space-y-1.5 text-xs">
              {summary.topCities.slice(0, 5).map((city, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-[#E9D9CD]/40">
                  <span className="text-[#39313A] font-semibold">{city.name}</span>
                  <span className="text-stone-400 font-mono text-[11px]">{city.count} visitantes</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Horários de Pico */}
          <div className="bg-white p-5 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-3">
            <h4 className="font-display text-sm font-bold text-[#39313A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#9C5B6F]" />
              Melhores Horários de Acesso
            </h4>
            <TrafficHeatmap
              cells={summary.hourlyHeatmap}
              peakInsight={summary.peakHoursInsight}
            />
          </div>

        </div>
      )}

      {/* SEÇÃO I: GESTÃO DE LINKS RASTREÁVEIS */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-[#39313A] flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-[#7A3F51]" />
              Seus Links Rastreáveis Ativos
            </h3>
            <p className="text-xs text-stone-500">
              Crie links personalizados para colocar na bio do Instagram, stories, status do WhatsApp ou parcerias.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A3F51] hover:bg-[#683343] text-white text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Criar Link Rastreável</span>
          </button>
        </div>

        {summary && summary.trackedLinks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E9D9CD] text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  <th className="py-2.5">Nome do Link</th>
                  <th className="py-2.5">Link Encurtado</th>
                  <th className="py-2.5">Destino</th>
                  <th className="py-2.5 text-center">Cliques</th>
                  <th className="py-2.5 text-center">Visitantes</th>
                  <th className="py-2.5 text-center">Pedidos</th>
                  <th className="py-2.5 text-center">Conversão</th>
                  <th className="py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9D9CD]/50">
                {summary.trackedLinks.map((link) => {
                  const isCopied = copiedCode === link.code;

                  return (
                    <tr key={link.code} className="hover:bg-[#FAF7F8] transition-colors">
                      <td className="py-3 font-bold text-[#39313A]">
                        {link.name}
                        <span className="block text-[10px] text-stone-400 font-normal">
                          Divulgado em: {link.utm_source} {link.utm_medium ? `(${link.utm_medium})` : ''}
                        </span>
                      </td>

                      <td className="py-3 font-mono text-[11px] text-[#7A3F51]">
                        /r/{link.code}
                      </td>

                      <td className="py-3 text-stone-600 font-mono text-[11px]">
                        {link.destination}
                      </td>

                      <td className="py-3 text-center font-bold text-[#39313A]">
                        {link.clicks_count || 0}
                      </td>

                      <td className="py-3 text-center text-[#7A3F51] font-semibold">
                        {link.visitors_count || 0}
                      </td>

                      <td className="py-3 text-center text-emerald-700 font-bold">
                        {link.orders_count || 0}
                      </td>

                      <td className="py-3 text-center font-extrabold text-[#39313A]">
                        {link.conversion_rate || 0}%
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyLink(link.code)}
                            className="p-1.5 rounded-lg border border-[#E9D9CD] hover:border-[#7A3F51] text-stone-600 hover:text-[#7A3F51] transition-all"
                            title="Copiar link"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenQrModal(link)}
                            className="p-1.5 rounded-lg border border-[#E9D9CD] hover:border-[#7A3F51] text-stone-600 hover:text-[#7A3F51] transition-all"
                            title="Ver e Baixar QR Code"
                          >
                            <QrIcon className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleArchiveLink(link.code)}
                            className="p-1.5 rounded-lg border border-[#E9D9CD] hover:border-rose-400 text-stone-400 hover:text-rose-600 transition-all"
                            title="Arquivar link"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-[#FAF7F8] rounded-2xl border border-dashed border-[#E9D9CD] text-center text-xs text-stone-500">
            Nenhum link rastreável criado ainda. Clique no botão acima para criar o primeiro link para a sua bio!
          </div>
        )}
      </div>

      {/* SEÇÃO J: FEED DE ACESSOS RECENTES (AO VIVO, ANÔNIMO) */}
      {summary && summary.recentEvents.length > 0 && (
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-[#39313A] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7A3F51]" />
              Feed de Acessos Recentes em Tempo Real (Anônimo)
            </h3>
            <span className="text-[11px] text-stone-400">Últimos eventos</span>
          </div>

          <div className="divide-y divide-[#E9D9CD]/40 max-h-64 overflow-y-auto pr-1 text-xs">
            {summary.recentEvents.map((ev) => {
              const date = new Date(ev.occurred_at);
              const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={ev.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-stone-400">{timeStr}</span>
                    <span className="text-stone-300">·</span>
                    <span className="capitalize font-semibold text-[#7A3F51]">
                      {ev.device === 'mobile' ? '📱 Celular' : '💻 Computador'}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-600">
                      {ev.city ? `${ev.city}/${ev.region || 'BR'}` : 'Brasil'}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span>
                      veio do{' '}
                      <strong className="text-[#39313A]">{ev.source}</strong>{' '}
                      {ev.medium ? `(${ev.medium})` : ''}
                    </span>
                  </div>

                  <div className="text-stone-500 font-mono text-[11px]">
                    {ev.product_sku ? (
                      <span className="text-[#7A3F51] font-bold">Viu {ev.product_sku}</span>
                    ) : (
                      <span>{ev.path}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BLOCO RECOLHÍVEL DE PRESERVAÇÃO DE TAXAS DOS CANAIS DE VENDA (FINANCEIRO) */}
      <ChannelFeesSettingsBlock
        channels={channels}
        onUpdateChannel={updateChannel}
      />

      {/* MODAL DE CRIAÇÃO DE LINK RASTREÁVEL */}
      <CreateTrackedLinkModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        products={products}
        onCreated={fetchAnalytics}
      />

      {/* MODAL DE QR CODE */}
      {qrCodeLink && (
        <QrCodeModal
          isOpen={true}
          onClose={() => setQrCodeLink(null)}
          linkCode={qrCodeLink.code}
          linkName={qrCodeLink.name}
          fullUrl={qrCodeLink.url}
        />
      )}

    </div>
  );
}
