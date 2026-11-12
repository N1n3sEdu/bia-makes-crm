export type AnalyticsEventType =
  | 'pageview'
  | 'product_view'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'whatsapp_order'
  | 'outbound_click'
  | 'link_click';

export type TrafficSource =
  | 'instagram'
  | 'tiktok'
  | 'whatsapp'
  | 'facebook'
  | 'google'
  | 'busca_outros'
  | 'youtube'
  | 'shopee'
  | 'mercado_livre'
  | 'outros_sites'
  | 'direto';

export type OutboundTarget =
  | 'whatsapp'
  | 'instagram'
  | 'shopee'
  | 'mercado_livre'
  | 'tiktok';

export interface AnalyticsEventPayload {
  event_type: AnalyticsEventType;
  visitor_id: string;
  session_id: string;
  path: string;
  product_sku?: string;
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  first_source?: string;
  referrer_domain?: string;
  link_code?: string;
  target?: string;
  order_number?: string;
  value_cents?: number;
}

export interface TrackedLink {
  code: string;
  name: string;
  destination: string;
  utm_source: string;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  created_at: string;
  archived_at?: string | null;
  // Métricas agregadas opcionais exibidas no painel
  clicks_count?: number;
  visitors_count?: number;
  orders_count?: number;
  conversion_rate?: number;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  changePercent: number | null; // null se anterior for 0 ou sem comparação
}

export interface TimeSeriesPoint {
  timeLabel: string; // Ex: "10:00" ou "11/11"
  timestamp: string;
  pageviews: number;
  visitors: number;
}

export interface OriginMetric {
  source: TrafficSource | string;
  label: string;
  visitors: number;
  pageviews: number;
  percentage: number;
  addToCartCount: number;
  whatsappOrdersCount: number;
  conversionRate: number;
  color: string;
  // Detalhamento de campanhas e mídias
  campaigns?: Array<{
    name: string;
    visitors: number;
    orders: number;
    conversionRate: number;
  }>;
  mediums?: Array<{
    medium: string;
    visitors: number;
  }>;
  topLandingPages?: Array<{
    path: string;
    views: number;
  }>;
  topProducts?: Array<{
    sku: string;
    views: number;
  }>;
}

export interface FunnelStep {
  key: 'visit' | 'product_view' | 'add_to_cart' | 'begin_checkout' | 'whatsapp_order';
  label: string;
  sessions: number;
  conversionFromFirst: number; // % sobre o total de visitas
  dropoffRate: number; // % que abandonou nesta etapa em relação à anterior
  isBiggestDropoff?: boolean;
}

export interface TopProductTraffic {
  sku: string;
  name: string;
  image?: string;
  views: number;
  addToCartCount: number;
  outboundClicksCount: number;
  ordersCount: number;
  conversionRate: number;
  isHighViewLowConversion?: boolean; // Selo "Muito visto, pouco vendido"
}

export interface OutboundMetric {
  target: OutboundTarget | string;
  label: string;
  clicks: number;
  percentage: number;
  color: string;
}

export interface DeviceMetric {
  device: 'mobile' | 'desktop' | 'tablet' | 'other';
  label: string;
  count: number;
  percentage: number;
}

export interface GeoLocationMetric {
  name: string;
  count: number;
  percentage: number;
}

export interface HourlyHeatmapCell {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  hour: number; // 0 a 23
  visits: number;
}

export interface RecentEventFeed {
  id: string;
  occurred_at: string;
  event_type: AnalyticsEventType;
  device?: string;
  city?: string;
  region?: string;
  source: string;
  medium?: string;
  campaign?: string;
  product_sku?: string;
  product_name?: string;
  path: string;
}

export interface TrafficSummary {
  period: {
    from: string;
    to: string;
    filterLabel: string;
    compareWithPrevious: boolean;
  };
  liveVisitorsNow: number;
  kpis: {
    pageviews: PeriodComparison;
    uniqueVisitors: PeriodComparison;
    linkClicks: PeriodComparison;
    conversionRate: PeriodComparison;
  };
  timeSeries: TimeSeriesPoint[];
  origins: OriginMetric[];
  funnel: FunnelStep[];
  topProducts: TopProductTraffic[];
  outbounds: OutboundMetric[];
  devices: DeviceMetric[];
  topRegions: GeoLocationMetric[];
  topCities: GeoLocationMetric[];
  hourlyHeatmap: HourlyHeatmapCell[];
  peakHoursInsight: string;
  originsInsight: string;
  recentEvents: RecentEventFeed[];
  trackedLinks: TrackedLink[];
  isEmpty: boolean;
}

export interface OrderAttribution {
  source: string;
  medium?: string;
  campaign?: string;
  link_code?: string;
}
