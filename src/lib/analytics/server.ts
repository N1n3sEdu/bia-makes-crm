import { NextRequest } from 'next/server';

// TODO: Este controle de token deve migrar para autenticação de sessão de servidor (NextAuth / Netlify Identity)
// quando o backend do Bia Makes for completamente centralizado no servidor.
export function validateAdminAuth(req: NextRequest): boolean {
  const adminSecret = process.env.ANALYTICS_ADMIN_TOKEN;
  if (!adminSecret) {
    // Se a variável não estiver configurada no ambiente local, permite a requisição em dev
    return true;
  }

  const tokenHeader = req.headers.get('x-analytics-token');
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  return tokenHeader === adminSecret || bearerToken === adminSecret;
}

export const BOT_USER_AGENT_REGEX =
  /bot|crawler|spider|preview|facebookexternalhit|WhatsApp\/|Googlebot|bingbot|Slackbot|TelegramBot|Twitterbot|LinkedInBot/i;

export function parseUserAgent(ua: string | null) {
  if (!ua) {
    return { device: 'desktop', browser: 'Desconhecido', os: 'Desconhecido' };
  }

  // Device
  let device = 'desktop';
  if (/iPad|tablet|PlayBook|Silk/i.test(ua)) {
    device = 'tablet';
  } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    device = 'mobile';
  }

  // OS
  let os = 'Outro';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser
  let browser = 'Outro';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

  return { device, browser, os };
}

export function parseNetlifyGeo(geoHeader: string | null) {
  if (!geoHeader) {
    return { country: null, region: null, city: null };
  }

  try {
    const decoded = Buffer.from(geoHeader, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    return {
      country: parsed?.country?.code || parsed?.country?.name || null,
      region: parsed?.subdivision?.code || parsed?.subdivision?.name || null,
      city: parsed?.city || null,
    };
  } catch {
    return { country: null, region: null, city: null };
  }
}

export function getSaoPauloStartOfDay(date: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const second = Number(parts.find((p) => p.type === 'second')?.value || 0);

  const elapsedMsInDay =
    ((hour * 60 + minute) * 60 + second) * 1000 + date.getMilliseconds();

  return new Date(date.getTime() - elapsedMsInDay);
}
