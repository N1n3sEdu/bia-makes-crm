import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDb } from '@/lib/analytics/db';
import { getSaoPauloStartOfDay, validateAdminAuth } from '@/lib/analytics/server';
import {
  AnalyticsEventType,
  TrafficSummary,
  OriginMetric,
  FunnelStep,
  DeviceMetric,
} from '@/types/analytics';

const ORIGIN_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#111111',
  whatsapp: '#25D366',
  facebook: '#1877F2',
  google: '#4285F4',
  busca_outros: '#8B5CF6',
  youtube: '#FF0000',
  shopee: '#EE4D2D',
  mercado_livre: '#FFE600',
  outros_sites: '#C69A76',
  direto: '#78716C',
};

const ORIGIN_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  google: 'Google (Orgânico & Ads)',
  busca_outros: 'Outros Buscadores',
  youtube: 'YouTube',
  shopee: 'Shopee',
  mercado_livre: 'Mercado Livre',
  outros_sites: 'Outros Sites / Blogs',
  direto: 'Direto / Link salvo / App',
};

export async function GET(req: NextRequest) {
  if (!validateAdminAuth(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || '7d';
  const compareWithPrevious = searchParams.get('compare') !== 'false';
  const originFilter = searchParams.get('source') || null;

  // Determinar janelas de datas (America/Sao_Paulo)
  const now = new Date();
  let fromDate = new Date();
  let periodDays = 7;
  let isToday = false;

  if (filter === 'today') {
    fromDate = getSaoPauloStartOfDay(now);
    periodDays = 1;
    isToday = true;
  } else if (filter === '30d') {
    fromDate.setDate(now.getDate() - 30);
    periodDays = 30;
  } else if (filter === '90d') {
    fromDate.setDate(now.getDate() - 90);
    periodDays = 90;
  } else if (filter === 'custom') {
    const customFrom = searchParams.get('from');
    const customTo = searchParams.get('to');
    if (customFrom) fromDate = new Date(customFrom);
    if (customTo) {
      const to = new Date(customTo);
      periodDays = Math.max(1, Math.round((to.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
    }
  } else {
    // 7d default
    fromDate.setDate(now.getDate() - 7);
    periodDays = 7;
  }

  const prevFromDate = new Date(fromDate);
  prevFromDate.setDate(prevFromDate.getDate() - periodDays);
  const prevToDate = new Date(fromDate);

  const db = getAnalyticsDb();

  // Resposta vazia padrão estruturada caso o banco não esteja disponível ou esteja vazio
  const emptySummary: TrafficSummary = {
    period: {
      from: fromDate.toISOString(),
      to: now.toISOString(),
      filterLabel: isToday ? 'Hoje' : `Últimos ${periodDays} dias`,
      compareWithPrevious,
    },
    liveVisitorsNow: 0,
    kpis: {
      pageviews: { current: 0, previous: 0, changePercent: null },
      uniqueVisitors: { current: 0, previous: 0, changePercent: null },
      linkClicks: { current: 0, previous: 0, changePercent: null },
      conversionRate: { current: 0, previous: 0, changePercent: null },
    },
    timeSeries: [],
    origins: [],
    funnel: [
      { key: 'visit', label: 'Visitou o site', sessions: 0, conversionFromFirst: 100, dropoffRate: 0 },
      { key: 'product_view', label: 'Viu um produto', sessions: 0, conversionFromFirst: 0, dropoffRate: 0 },
      { key: 'add_to_cart', label: 'Adicionou à sacola', sessions: 0, conversionFromFirst: 0, dropoffRate: 0 },
      { key: 'begin_checkout', label: 'Abriu o checkout', sessions: 0, conversionFromFirst: 0, dropoffRate: 0 },
      { key: 'whatsapp_order', label: 'Enviou pedido no WhatsApp', sessions: 0, conversionFromFirst: 0, dropoffRate: 0 },
    ],
    topProducts: [],
    outbounds: [],
    devices: [],
    topRegions: [],
    topCities: [],
    hourlyHeatmap: [],
    peakHoursInsight: 'Aguardando primeiros dados de acessos para mapear horários de pico.',
    originsInsight: 'Divulgue seus links rastreáveis no Instagram e WhatsApp para ver o fluxo de clientes aqui.',
    recentEvents: [],
    trackedLinks: [],
    isEmpty: true,
  };

  if (!db) {
    return NextResponse.json(emptySummary, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    });
  }

  try {
    const fromIso = fromDate.toISOString();
    const toIso = now.toISOString();
    const prevFromIso = prevFromDate.toISOString();
    const prevToIso = prevToDate.toISOString();

    // 1. Visitantes online agora (últimos 5 min)
    const liveRes = await db.sql<{ live_count: string }>`
      SELECT COUNT(DISTINCT visitor_id) AS live_count
      FROM analytics_events
      WHERE occurred_at >= (now() - interval '5 minutes')
    `;
    const liveVisitorsNow = parseInt(liveRes[0]?.live_count || '0', 10);

    // 2. KPIs do período atual
    const kpiCurrRes = await db.sql<{
      pageviews: string;
      unique_visitors: string;
      link_clicks: string;
      total_sessions: string;
      order_sessions: string;
    }>`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'pageview') AS pageviews,
        COUNT(DISTINCT visitor_id) AS unique_visitors,
        COUNT(*) FILTER (WHERE event_type = 'link_click') AS link_clicks,
        COUNT(DISTINCT session_id) AS total_sessions,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'whatsapp_order') AS order_sessions
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
      ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
    `;

    const currPageviews = parseInt(kpiCurrRes[0]?.pageviews || '0', 10);
    const currVisitors = parseInt(kpiCurrRes[0]?.unique_visitors || '0', 10);
    const currClicks = parseInt(kpiCurrRes[0]?.link_clicks || '0', 10);
    const currSessions = parseInt(kpiCurrRes[0]?.total_sessions || '0', 10);
    const currOrderSessions = parseInt(kpiCurrRes[0]?.order_sessions || '0', 10);
    const currConversion = currSessions > 0 ? (currOrderSessions / currSessions) * 100 : 0;

    // Se não há nenhum pageview ou visitante registrado, retorna o estado vazio didático
    if (currPageviews === 0 && currVisitors === 0 && currClicks === 0) {
      // Busca se já existem links cadastrados para exibir na tabela de links mesmo com eventos zerados
      const linksRes = await db.sql<{
        code: string;
        name: string;
        destination: string;
        utm_source: string;
        utm_medium: string | null;
        utm_campaign: string | null;
        utm_content: string | null;
        created_at: string;
        archived_at: string | null;
      }>`
        SELECT code, name, destination, utm_source, utm_medium, utm_campaign, utm_content, created_at, archived_at
        FROM tracked_links
        ORDER BY created_at DESC
      `;

      return NextResponse.json(
        {
          ...emptySummary,
          trackedLinks: linksRes.map((l) => ({
            ...l,
            clicks_count: 0,
            visitors_count: 0,
            orders_count: 0,
            conversion_rate: 0,
          })),
        },
        { headers: { 'Cache-Control': 'private, max-age=30' } }
      );
    }

    // 3. KPIs do período anterior (para comparação)
    let prevPageviews = 0;
    let prevVisitors = 0;
    let prevClicks = 0;
    let prevConversion = 0;

    if (compareWithPrevious) {
      const kpiPrevRes = await db.sql<{
        pageviews: string;
        unique_visitors: string;
        link_clicks: string;
        total_sessions: string;
        order_sessions: string;
      }>`
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'pageview') AS pageviews,
          COUNT(DISTINCT visitor_id) AS unique_visitors,
          COUNT(*) FILTER (WHERE event_type = 'link_click') AS link_clicks,
          COUNT(DISTINCT session_id) AS total_sessions,
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'whatsapp_order') AS order_sessions
        FROM analytics_events
        WHERE occurred_at >= ${prevFromIso} AND occurred_at < ${prevToIso}
        ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
      `;

      prevPageviews = parseInt(kpiPrevRes[0]?.pageviews || '0', 10);
      prevVisitors = parseInt(kpiPrevRes[0]?.unique_visitors || '0', 10);
      prevClicks = parseInt(kpiPrevRes[0]?.link_clicks || '0', 10);
      const prevSessions = parseInt(kpiPrevRes[0]?.total_sessions || '0', 10);
      const prevOrderSessions = parseInt(kpiPrevRes[0]?.order_sessions || '0', 10);
      prevConversion = prevSessions > 0 ? (prevOrderSessions / prevSessions) * 100 : 0;
    }

    const calcChange = (curr: number, prev: number) => {
      if (!compareWithPrevious || prev === 0) return null;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    // 4. Série Temporal (Hourly se hoje, Daily nos demais)
    let timeSeriesRows: Array<{ time_label: string; bucket: string; pageviews: string; visitors: string }> = [];

    if (isToday) {
      timeSeriesRows = await db.sql<{ time_label: string; bucket: string; pageviews: string; visitors: string }>`
        SELECT
          to_char(date_trunc('hour', occurred_at AT TIME ZONE 'America/Sao_Paulo'), 'HH24:00') AS time_label,
          date_trunc('hour', occurred_at AT TIME ZONE 'America/Sao_Paulo')::text AS bucket,
          COUNT(*) FILTER (WHERE event_type = 'pageview') AS pageviews,
          COUNT(DISTINCT visitor_id) AS visitors
        FROM analytics_events
        WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
        ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
        GROUP BY 1, 2
        ORDER BY 2 ASC
      `;
    } else {
      timeSeriesRows = await db.sql<{ time_label: string; bucket: string; pageviews: string; visitors: string }>`
        SELECT
          to_char(date_trunc('day', occurred_at AT TIME ZONE 'America/Sao_Paulo'), 'DD/MM') AS time_label,
          date_trunc('day', occurred_at AT TIME ZONE 'America/Sao_Paulo')::text AS bucket,
          COUNT(*) FILTER (WHERE event_type = 'pageview') AS pageviews,
          COUNT(DISTINCT visitor_id) AS visitors
        FROM analytics_events
        WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
        ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
        GROUP BY 1, 2
        ORDER BY 2 ASC
      `;
    }

    const timeSeries = timeSeriesRows.map((r) => ({
      timeLabel: r.time_label,
      timestamp: r.bucket,
      pageviews: parseInt(r.pageviews || '0', 10),
      visitors: parseInt(r.visitors || '0', 10),
    }));

    // 5. Ranking de Origens (com taxas de conversão, add to cart e orders)
    const originsRes = await db.sql<{
      source: string;
      visitors: string;
      pageviews: string;
      add_to_cart_count: string;
      whatsapp_orders_count: string;
      total_sessions: string;
    }>`
      SELECT
        source,
        COUNT(DISTINCT visitor_id) AS visitors,
        COUNT(*) FILTER (WHERE event_type = 'pageview') AS pageviews,
        COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS add_to_cart_count,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'whatsapp_order') AS whatsapp_orders_count,
        COUNT(DISTINCT session_id) AS total_sessions
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
      GROUP BY source
      ORDER BY COUNT(DISTINCT visitor_id) DESC
    `;

    const totalOriginVisitors = originsRes.reduce((sum, r) => sum + parseInt(r.visitors || '0', 10), 0) || 1;

    const origins: OriginMetric[] = originsRes.map((r) => {
      const visitors = parseInt(r.visitors || '0', 10);
      const pageviews = parseInt(r.pageviews || '0', 10);
      const addToCartCount = parseInt(r.add_to_cart_count || '0', 10);
      const ordersCount = parseInt(r.whatsapp_orders_count || '0', 10);
      const sessions = parseInt(r.total_sessions || '0', 10);
      const convRate = sessions > 0 ? (ordersCount / sessions) * 100 : 0;

      return {
        source: r.source,
        label: ORIGIN_LABELS[r.source] || r.source,
        visitors,
        pageviews,
        percentage: Math.round((visitors / totalOriginVisitors) * 1000) / 10,
        addToCartCount,
        whatsappOrdersCount: ordersCount,
        conversionRate: Math.round(convRate * 10) / 10,
        color: ORIGIN_COLORS[r.source] || '#C69A76',
      };
    });

    // 6. Funil de Compras
    const funnelRes = await db.sql<{
      total_sessions: string;
      product_view_sessions: string;
      add_to_cart_sessions: string;
      begin_checkout_sessions: string;
      whatsapp_order_sessions: string;
    }>`
      SELECT
        COUNT(DISTINCT session_id) AS total_sessions,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'product_view') AS product_view_sessions,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'add_to_cart') AS add_to_cart_sessions,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'begin_checkout') AS begin_checkout_sessions,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'whatsapp_order') AS whatsapp_order_sessions
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
      ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
    `;

    const fRow = funnelRes[0] || {};
    const sVisit = parseInt(fRow.total_sessions || '0', 10);
    const sProd = parseInt(fRow.product_view_sessions || '0', 10);
    const sCart = parseInt(fRow.add_to_cart_sessions || '0', 10);
    const sCheck = parseInt(fRow.begin_checkout_sessions || '0', 10);
    const sOrder = parseInt(fRow.whatsapp_order_sessions || '0', 10);

    const funnelCounts = [sVisit, sProd, sCart, sCheck, sOrder];
    const funnelKeys: FunnelStep['key'][] = [
      'visit',
      'product_view',
      'add_to_cart',
      'begin_checkout',
      'whatsapp_order',
    ];
    const funnelLabels = [
      'Visitou o site',
      'Viu um produto',
      'Adicionou à sacola',
      'Abriu o checkout',
      'Enviou pedido no WhatsApp',
    ];

    let biggestDropIndex = -1;
    let maxDropRate = -1;

    const funnel: FunnelStep[] = funnelCounts.map((count, idx) => {
      const prevCount = idx === 0 ? count : funnelCounts[idx - 1];
      const dropoffRate = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
      const convFirst = sVisit > 0 ? Math.round((count / sVisit) * 1000) / 10 : 0;

      if (idx > 0 && dropoffRate > maxDropRate && prevCount > 0) {
        maxDropRate = dropoffRate;
        biggestDropIndex = idx;
      }

      return {
        key: funnelKeys[idx],
        label: funnelLabels[idx],
        sessions: count,
        conversionFromFirst: convFirst,
        dropoffRate,
      };
    });

    if (biggestDropIndex > -1 && maxDropRate > 0) {
      funnel[biggestDropIndex].isBiggestDropoff = true;
    }

    // 7. Top Produtos Acessados
    const topProdRes = await db.sql<{
      product_sku: string;
      views: string;
      carts: string;
      outbounds: string;
      orders: string;
    }>`
      SELECT
        product_sku,
        COUNT(*) FILTER (WHERE event_type = 'product_view') AS views,
        COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS carts,
        COUNT(*) FILTER (WHERE event_type = 'outbound_click') AS outbounds,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'whatsapp_order') AS orders
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
        AND product_sku IS NOT NULL AND product_sku <> ''
      ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
      GROUP BY product_sku
      ORDER BY COUNT(*) FILTER (WHERE event_type = 'product_view') DESC
      LIMIT 10
    `;

    const topProducts = topProdRes.map((r) => {
      const views = parseInt(r.views || '0', 10);
      const carts = parseInt(r.carts || '0', 10);
      const outbounds = parseInt(r.outbounds || '0', 10);
      const orders = parseInt(r.orders || '0', 10);
      const conv = views > 0 ? Math.round((orders / views) * 1000) / 10 : 0;
      const isHighViewLowConversion = views >= 10 && conv < 1.0;

      return {
        sku: r.product_sku,
        name: r.product_sku, // o componente frontend complementa com o nome real de products do contexto
        views,
        addToCartCount: carts,
        outboundClicksCount: outbounds,
        ordersCount: orders,
        conversionRate: conv,
        isHighViewLowConversion,
      };
    });

    // 8. Cliques de Saída (Outbound Clicks)
    const outboundsRes = await db.sql<{ target: string; clicks: string }>`
      SELECT target, COUNT(*) AS clicks
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
        AND event_type = 'outbound_click'
        AND target IS NOT NULL
      ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
      GROUP BY target
      ORDER BY COUNT(*) DESC
    `;

    const totalOutbound = outboundsRes.reduce((sum, r) => sum + parseInt(r.clicks || '0', 10), 0) || 1;
    const outbounds = outboundsRes.map((r) => ({
      target: r.target,
      label:
        r.target === 'whatsapp'
          ? 'WhatsApp Oficial'
          : r.target === 'instagram'
          ? 'Instagram da Loja'
          : r.target === 'shopee'
          ? 'Loja Shopee'
          : r.target === 'mercado_livre'
          ? 'Mercado Livre'
          : r.target === 'tiktok'
          ? 'TikTok Shop'
          : r.target,
      clicks: parseInt(r.clicks || '0', 10),
      percentage: Math.round((parseInt(r.clicks || '0', 10) / totalOutbound) * 1000) / 10,
      color: ORIGIN_COLORS[r.target] || '#C69A76',
    }));

    // 9. Perfil do Público: Dispositivos
    const devicesRes = await db.sql<{ device: string; count: string }>`
      SELECT COALESCE(device, 'other') AS device, COUNT(DISTINCT visitor_id) AS count
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
      ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
      GROUP BY 1
      ORDER BY 2 DESC
    `;

    const totalDev = devicesRes.reduce((sum, r) => sum + parseInt(r.count || '0', 10), 0) || 1;
    const devices: DeviceMetric[] = devicesRes.map((r) => {
      const dev = r.device as 'mobile' | 'desktop' | 'tablet' | 'other';
      const count = parseInt(r.count || '0', 10);
      return {
        device: dev,
        label:
          dev === 'mobile'
            ? 'Celular (Mobile)'
            : dev === 'desktop'
            ? 'Computador (Desktop)'
            : dev === 'tablet'
            ? 'Tablet'
            : 'Outro',
        count,
        percentage: Math.round((count / totalDev) * 100),
      };
    });

    // 10. Top Regiões (Estados) e Cidades
    const regionsRes = await db.sql<{ region: string; count: string }>`
      SELECT region, COUNT(DISTINCT visitor_id) AS count
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
        AND region IS NOT NULL AND region <> ''
      ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
      GROUP BY region
      ORDER BY count DESC
      LIMIT 5
    `;

    const totalReg = regionsRes.reduce((sum, r) => sum + parseInt(r.count || '0', 10), 0) || 1;
    const topRegions = regionsRes.map((r) => ({
      name: r.region,
      count: parseInt(r.count || '0', 10),
      percentage: Math.round((parseInt(r.count || '0', 10) / totalReg) * 100),
    }));

    const citiesRes = await db.sql<{ city: string; count: string }>`
      SELECT city, COUNT(DISTINCT visitor_id) AS count
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
        AND city IS NOT NULL AND city <> ''
      ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
      GROUP BY city
      ORDER BY count DESC
      LIMIT 5
    `;

    const totalCities = citiesRes.reduce((sum, r) => sum + parseInt(r.count || '0', 10), 0) || 1;
    const topCities = citiesRes.map((r) => ({
      name: r.city,
      count: parseInt(r.count || '0', 10),
      percentage: Math.round((parseInt(r.count || '0', 10) / totalCities) * 100),
    }));

    // 11. Mapa de Calor (Dia da Semana x Hora)
    const heatmapRes = await db.sql<{ dow: string; hour: string; visits: string }>`
      SELECT
        EXTRACT(DOW FROM occurred_at AT TIME ZONE 'America/Sao_Paulo')::int AS dow,
        EXTRACT(HOUR FROM occurred_at AT TIME ZONE 'America/Sao_Paulo')::int AS hour,
        COUNT(DISTINCT visitor_id) AS visits
      FROM analytics_events
      WHERE occurred_at >= ${fromIso} AND occurred_at <= ${toIso}
      ${originFilter ? db.sql`AND source = ${originFilter}` : db.sql``}
      GROUP BY 1, 2
      ORDER BY 3 DESC
    `;

    const hourlyHeatmap = heatmapRes.map((r) => ({
      dayOfWeek: parseInt(r.dow, 10),
      hour: parseInt(r.hour, 10),
      visits: parseInt(r.visits || '0', 10),
    }));

    let peakHoursInsight = 'Aguardando mais acessos para calcular o melhor horário de postagem.';
    if (hourlyHeatmap.length > 0 && hourlyHeatmap[0].visits > 0) {
      const best = hourlyHeatmap[0];
      const dowNames = ['domingos', 'segundas-feiras', 'terças-feiras', 'quartas-feiras', 'quintas-feiras', 'sextas-feiras', 'sábados'];
      peakHoursInsight = `Seu público mais acessa às ${dowNames[best.dayOfWeek]} entre ${best.hour}h e ${best.hour + 1}h: excelente horário para postar novidades e stories.`;
    }

    // Insight automático de origens em linguagem natural
    let originsInsight = 'Acompanhe as origens que mais geram visitantes e vendas na sua loja.';
    if (origins.length > 0) {
      const topVis = origins[0];
      const sortedByConv = [...origins].sort((a, b) => b.conversionRate - a.conversionRate);
      const topConv = sortedByConv[0];

      if (topVis.source === topConv.source) {
        originsInsight = `💡 O ${topVis.label} é sua maior fonte de clientes, trazendo ${topVis.percentage}% dos visitantes e convertendo ${topVis.conversionRate}% em pedidos no WhatsApp.`;
      } else {
        originsInsight = `💡 O ${topVis.label} trouxe ${topVis.percentage}% das suas visitas, mas o ${topConv.label} é a origem que mais converte (${topConv.conversionRate}%).`;
      }
    }

    // 12. Feed de Acessos Recentes (Últimos 20)
    const recentRes = await db.sql<{
      id: string;
      occurred_at: string;
      event_type: string;
      device: string | null;
      city: string | null;
      region: string | null;
      source: string;
      medium: string | null;
      campaign: string | null;
      product_sku: string | null;
      path: string;
    }>`
      SELECT
        id::text,
        occurred_at::text,
        event_type,
        device,
        city,
        region,
        source,
        medium,
        campaign,
        product_sku,
        path
      FROM analytics_events
      ORDER BY occurred_at DESC
      LIMIT 20
    `;

    const recentEvents = recentRes.map((r) => ({
      id: r.id,
      occurred_at: r.occurred_at,
      event_type: r.event_type as AnalyticsEventType,
      device: r.device || 'desktop',
      city: r.city || undefined,
      region: r.region || undefined,
      source: r.source,
      medium: r.medium || undefined,
      campaign: r.campaign || undefined,
      product_sku: r.product_sku || undefined,
      path: r.path,
    }));

    // 13. Links Rastreáveis com Métricas
    const linksRes = await db.sql<{
      code: string;
      name: string;
      destination: string;
      utm_source: string;
      utm_medium: string | null;
      utm_campaign: string | null;
      utm_content: string | null;
      created_at: string;
      archived_at: string | null;
      clicks_count: string;
      visitors_count: string;
      orders_count: string;
    }>`
      SELECT
        l.code,
        l.name,
        l.destination,
        l.utm_source,
        l.utm_medium,
        l.utm_campaign,
        l.utm_content,
        l.created_at,
        l.archived_at,
        COUNT(e.id) FILTER (WHERE e.event_type = 'link_click') AS clicks_count,
        COUNT(DISTINCT e.visitor_id) AS visitors_count,
        COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'whatsapp_order') AS orders_count
      FROM tracked_links l
      LEFT JOIN analytics_events e 
        ON (e.link_code = l.code OR e.content = l.code)
        AND e.occurred_at >= ${fromIso} AND e.occurred_at <= ${toIso}
      GROUP BY l.code, l.name, l.destination, l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content, l.created_at, l.archived_at
      ORDER BY l.created_at DESC
    `;

    const trackedLinks = linksRes.map((l) => {
      const clicks = parseInt(l.clicks_count || '0', 10);
      const visitors = parseInt(l.visitors_count || '0', 10);
      const orders = parseInt(l.orders_count || '0', 10);
      const conv = visitors > 0 ? Math.round((orders / visitors) * 1000) / 10 : 0;
      return {
        ...l,
        clicks_count: clicks,
        visitors_count: visitors,
        orders_count: orders,
        conversion_rate: conv,
      };
    });

    const summary: TrafficSummary = {
      period: {
        from: fromDate.toISOString(),
        to: now.toISOString(),
        filterLabel: isToday ? 'Hoje' : `Últimos ${periodDays} dias`,
        compareWithPrevious,
      },
      liveVisitorsNow,
      kpis: {
        pageviews: {
          current: currPageviews,
          previous: prevPageviews,
          changePercent: calcChange(currPageviews, prevPageviews),
        },
        uniqueVisitors: {
          current: currVisitors,
          previous: prevVisitors,
          changePercent: calcChange(currVisitors, prevVisitors),
        },
        linkClicks: {
          current: currClicks,
          previous: prevClicks,
          changePercent: calcChange(currClicks, prevClicks),
        },
        conversionRate: {
          current: Math.round(currConversion * 10) / 10,
          previous: Math.round(prevConversion * 10) / 10,
          changePercent: calcChange(currConversion, prevConversion),
        },
      },
      timeSeries,
      origins,
      funnel,
      topProducts,
      outbounds,
      devices,
      topRegions,
      topCities,
      hourlyHeatmap,
      peakHoursInsight,
      originsInsight,
      recentEvents,
      trackedLinks,
      isEmpty: false,
    };

    return NextResponse.json(summary, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    });
  } catch (error) {
    console.error('[Analytics GET] Falha ao consultar métricas:', error);
    return NextResponse.json(emptySummary, {
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=10' },
    });
  }
}
