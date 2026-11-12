import { AnalyticsEventPayload, AnalyticsEventType } from '@/types/analytics';

const VID_KEY = 'bm_vid';
const SID_KEY = 'bm_sid';
const SID_EXP_KEY = 'bm_sid_exp';
const FIRST_SRC_KEY = 'bm_first_source';
const SESSION_SRC_KEY = 'bm_session_source';
const SESSION_MED_KEY = 'bm_session_medium';
const SESSION_CAMP_KEY = 'bm_session_campaign';
const SESSION_LINK_KEY = 'bm_session_link_code';
const SESSION_REF_KEY = 'bm_session_referrer_domain';
const CONSENT_KEY = 'bm_cookie_consent'; // 'granted' | 'denied'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

// Gerador de UUID v4 seguro com fallback
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // continua para fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Obtém ou inicializa o Visitor ID (anônimo, persistido em localStorage se consentido).
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'denied') {
    // Modo estrito sem persistência entre sessões
    let tempVid = sessionStorage.getItem('bm_temp_vid');
    if (!tempVid) {
      tempVid = generateUUID();
      sessionStorage.setItem('bm_temp_vid', tempVid);
    }
    return tempVid;
  }

  let vid = localStorage.getItem(VID_KEY);
  if (!vid) {
    vid = generateUUID();
    try {
      localStorage.setItem(VID_KEY, vid);
    } catch {
      // storage quota ou modo anônimo
    }
  }
  return vid;
}

/**
 * Obtém ou renova a Session ID (30 min de inatividade).
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const now = Date.now();
  const existingSid = sessionStorage.getItem(SID_KEY);
  const expStr = sessionStorage.getItem(SID_EXP_KEY);
  const exp = expStr ? parseInt(expStr, 10) : 0;

  if (existingSid && exp && now < exp) {
    // Renova o tempo de expiração da sessão
    sessionStorage.setItem(SID_EXP_KEY, (now + SESSION_TIMEOUT_MS).toString());
    return existingSid;
  }

  // Nova sessão iniciada
  const newSid = generateUUID();
  sessionStorage.setItem(SID_KEY, newSid);
  sessionStorage.setItem(SID_EXP_KEY, (now + SESSION_TIMEOUT_MS).toString());

  // Limpa os dados de origem da sessão anterior para reclassificar
  sessionStorage.removeItem(SESSION_SRC_KEY);
  sessionStorage.removeItem(SESSION_MED_KEY);
  sessionStorage.removeItem(SESSION_CAMP_KEY);
  sessionStorage.removeItem(SESSION_LINK_KEY);
  sessionStorage.removeItem(SESSION_REF_KEY);

  return newSid;
}

/**
 * Normaliza o nome da origem conforme as regras do plano de medição.
 */
function normalizeSource(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (s === 'ig' || s === 'insta' || s === 'instagram') return 'instagram';
  if (s === 'tt' || s === 'tiktok') return 'tiktok';
  if (s === 'wpp' || s === 'zap' || s === 'wa' || s === 'whatsapp') return 'whatsapp';
  if (s === 'fb' || s === 'facebook') return 'facebook';
  if (s === 'google' || s === 'google_ads') return 'google';
  if (s === 'shopee') return 'shopee';
  if (s === 'ml' || s === 'mercadolivre' || s === 'mercado_livre') return 'mercado_livre';
  if (s === 'yt' || s === 'youtube') return 'youtube';
  return s;
}

/**
 * Classificação determinística da origem do tráfego.
 */
export function resolveTrafficSource(urlParams: URLSearchParams): {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  link_code?: string;
  referrer_domain?: string;
} {
  if (typeof window === 'undefined') {
    return { source: 'direto' };
  }

  // Se já temos a origem da sessão atual guardada, reutiliza para consistência de atribuição
  const storedSrc = sessionStorage.getItem(SESSION_SRC_KEY);
  if (storedSrc && !urlParams.get('utm_source') && !urlParams.get('fbclid') && !urlParams.get('gclid')) {
    return {
      source: storedSrc,
      medium: sessionStorage.getItem(SESSION_MED_KEY) || undefined,
      campaign: sessionStorage.getItem(SESSION_CAMP_KEY) || undefined,
      link_code: sessionStorage.getItem(SESSION_LINK_KEY) || undefined,
      referrer_domain: sessionStorage.getItem(SESSION_REF_KEY) || undefined,
    };
  }

  // 1. UTMs presentes na URL
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium') || undefined;
  const utmCampaign = urlParams.get('utm_campaign') || undefined;
  const utmContent = urlParams.get('utm_content') || undefined;
  const utmTerm = urlParams.get('utm_term') || undefined;

  let resolvedSource = '';
  let resolvedMedium = utmMedium;
  let resolvedCampaign = utmCampaign;
  let resolvedLinkCode = utmContent?.startsWith('link_') || urlParams.get('r') ? (urlParams.get('r') || utmContent || undefined) : undefined;
  let resolvedReferrerDomain: string | undefined = undefined;

  if (utmSource) {
    resolvedSource = normalizeSource(utmSource);
  }

  // 2. Click IDs na URL
  if (!resolvedSource) {
    const fbclid = urlParams.get('fbclid');
    const gclid = urlParams.get('gclid');
    const ttclid = urlParams.get('ttclid');

    if (gclid) {
      resolvedSource = 'google';
      resolvedMedium = resolvedMedium || 'cpc';
    } else if (ttclid) {
      resolvedSource = 'tiktok';
      resolvedMedium = resolvedMedium || 'ads';
    } else if (fbclid) {
      // Distingue pelo referrer se veio do Instagram
      const ref = document.referrer ? document.referrer.toLowerCase() : '';
      if (ref.includes('instagram.com')) {
        resolvedSource = 'instagram';
      } else {
        resolvedSource = 'facebook';
      }
      resolvedMedium = resolvedMedium || 'ads';
    }
  }

  // 3. Referrer
  if (!resolvedSource) {
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    if (referrer) {
      try {
        const refUrl = new URL(referrer);
        const host = refUrl.hostname.toLowerCase();
        const currentHost = window.location.hostname.toLowerCase();

        if (host !== currentHost) {
          resolvedReferrerDomain = host;

          if (host.includes('instagram.com')) {
            resolvedSource = 'instagram';
          } else if (host.includes('facebook.com')) {
            resolvedSource = 'facebook';
          } else if (host.includes('tiktok.com')) {
            resolvedSource = 'tiktok';
          } else if (host.includes('wa.me') || host.includes('whatsapp.com')) {
            resolvedSource = 'whatsapp';
          } else if (host.includes('google.')) {
            resolvedSource = 'google';
          } else if (host.includes('bing.com') || host.includes('duckduckgo.com') || host.includes('yahoo.com')) {
            resolvedSource = 'busca_outros';
          } else if (host.includes('youtube.com') || host.includes('youtu.be')) {
            resolvedSource = 'youtube';
          } else if (host.includes('shopee.com.br') || host.includes('shopee.com')) {
            resolvedSource = 'shopee';
          } else if (host.includes('mercadolivre.com.br') || host.includes('mercadolivre.com')) {
            resolvedSource = 'mercado_livre';
          } else {
            resolvedSource = 'outros_sites';
          }
        }
      } catch {
        // Ignora erro de parsing de referrer
      }
    }
  }

  // 4. Fallback: Direto
  if (!resolvedSource) {
    resolvedSource = 'direto';
  }

  // Gravar na sessão para manter a consistência da sessão
  try {
    sessionStorage.setItem(SESSION_SRC_KEY, resolvedSource);
    if (resolvedMedium) sessionStorage.setItem(SESSION_MED_KEY, resolvedMedium);
    if (resolvedCampaign) sessionStorage.setItem(SESSION_CAMP_KEY, resolvedCampaign);
    if (resolvedLinkCode) sessionStorage.setItem(SESSION_LINK_KEY, resolvedLinkCode);
    if (resolvedReferrerDomain) sessionStorage.setItem(SESSION_REF_KEY, resolvedReferrerDomain);

    // Grava first_source no localStorage se for a primeira visita
    if (!localStorage.getItem(FIRST_SRC_KEY) && localStorage.getItem(CONSENT_KEY) !== 'denied') {
      localStorage.setItem(FIRST_SRC_KEY, resolvedSource);
    }
  } catch {
    // sessionStorage indisponível
  }

  return {
    source: resolvedSource,
    medium: resolvedMedium,
    campaign: resolvedCampaign,
    content: utmContent,
    term: utmTerm,
    link_code: resolvedLinkCode,
    referrer_domain: resolvedReferrerDomain,
  };
}

// Controle de deduplicação de pageview (Strict Mode e cliques rápidos < 2s)
let lastPageviewPath = '';
let lastPageviewTime = 0;

/**
 * Envia um evento de tráfego para a API no servidor.
 */
export function trackEvent(
  eventType: AnalyticsEventType,
  data?: Partial<Omit<AnalyticsEventPayload, 'event_type' | 'visitor_id' | 'session_id'>>
) {
  if (typeof window === 'undefined') return;

  // Respeita Não Rastrear (DNT) se o usuário ativou explicitamente
  if (navigator.doNotTrack === '1') return;

  // Ignora se estiver navegando na área administrativa
  const pathname = window.location.pathname;
  if (pathname.startsWith('/admin')) return;

  // Ignora se o admin estiver logado
  if (localStorage.getItem('bm_is_admin') === 'true') return;

  // Deduplicação de pageview para a mesma URL em menos de 2s
  if (eventType === 'pageview') {
    const now = Date.now();
    if (pathname === lastPageviewPath && now - lastPageviewTime < 2000) {
      return;
    }
    lastPageviewPath = pathname;
    lastPageviewTime = now;
  }

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const urlParams = new URLSearchParams(window.location.search);
  const originInfo = resolveTrafficSource(urlParams);
  const firstSource = localStorage.getItem(FIRST_SRC_KEY) || originInfo.source;

  const payload: AnalyticsEventPayload = {
    event_type: eventType,
    visitor_id: visitorId,
    session_id: sessionId,
    path: pathname,
    product_sku: data?.product_sku,
    source: originInfo.source,
    medium: data?.medium || originInfo.medium,
    campaign: data?.campaign || originInfo.campaign,
    content: data?.content || originInfo.content,
    term: data?.term || originInfo.term,
    first_source: firstSource,
    referrer_domain: originInfo.referrer_domain,
    link_code: data?.link_code || originInfo.link_code,
    target: data?.target,
    order_number: data?.order_number,
    value_cents: data?.value_cents,
  };

  const payloadString = JSON.stringify(payload);

  // Envio prioritário via sendBeacon
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([payloadString], { type: 'application/json' });
      const success = navigator.sendBeacon('/api/track', blob);
      if (success) return;
    } catch {
      // Fallback para fetch
    }
  }

  // Fallback via fetch com keepalive
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payloadString,
    keepalive: true,
  }).catch(() => {
    // Erros de rastreio são sempre silenciosos para o cliente
  });
}
