import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDb } from '@/lib/analytics/db';
import {
  BOT_USER_AGENT_REGEX,
  parseUserAgent,
  parseNetlifyGeo,
} from '@/lib/analytics/server';
import { AnalyticsEventPayload, AnalyticsEventType } from '@/types/analytics';

// Rate limit simples em memória por session_id (máx 120 eventos por minuto)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= 120) {
    return false;
  }

  entry.count++;
  return true;
}

// Limpeza periódica do mapa de rate limit para evitar vazamento de memória
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((val, key) => {
      if (now > val.resetAt) {
        rateLimitMap.delete(key);
      }
    });
  }, 300000); // a cada 5 min
}

const ALLOWED_EVENT_TYPES: AnalyticsEventType[] = [
  'pageview',
  'product_view',
  'add_to_cart',
  'begin_checkout',
  'whatsapp_order',
  'outbound_click',
  'link_click',
];

export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') || '';

    // Filtro de bots
    if (BOT_USER_AGENT_REGEX.test(userAgent)) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'bot' });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const events: AnalyticsEventPayload[] = Array.isArray(body)
      ? (body as AnalyticsEventPayload[])
      : [body as AnalyticsEventPayload];

    if (events.length === 0 || events.length > 20) {
      return NextResponse.json({ error: 'Lote de eventos inválido' }, { status: 400 });
    }

    const { device, browser, os } = parseUserAgent(userAgent);
    const { country, region, city } = parseNetlifyGeo(req.headers.get('x-nf-geo'));

    const db = getAnalyticsDb();

    for (const raw of events) {
      if (!raw || typeof raw !== 'object') continue;

      // Validações de campos obrigatórios
      if (!ALLOWED_EVENT_TYPES.includes(raw.event_type)) continue;
      if (!raw.visitor_id || typeof raw.visitor_id !== 'string') continue;
      if (!raw.session_id || typeof raw.session_id !== 'string') continue;
      if (!raw.path || typeof raw.path !== 'string') continue;

      // Não rastrear caminhos internos administrativos
      if (raw.path.startsWith('/admin')) continue;

      // Checar rate limit por sessão
      if (!checkRateLimit(raw.session_id)) {
        continue; // Descarta excedente silenciosamente
      }

      // Sanitizar tamanhos máximos
      const path = raw.path.substring(0, 300);
      const source = (raw.source || 'direto').substring(0, 100);
      const medium = raw.medium ? raw.medium.substring(0, 100) : null;
      const campaign = raw.campaign ? raw.campaign.substring(0, 100) : null;
      const content = raw.content ? raw.content.substring(0, 100) : null;
      const term = raw.term ? raw.term.substring(0, 100) : null;
      const firstSource = raw.first_source ? raw.first_source.substring(0, 100) : null;
      const referrerDomain = raw.referrer_domain ? raw.referrer_domain.substring(0, 150) : null;
      const linkCode = raw.link_code ? raw.link_code.substring(0, 50) : null;
      const target = raw.target ? raw.target.substring(0, 50) : null;
      const productSku = raw.product_sku ? raw.product_sku.substring(0, 80) : null;
      const orderNumber = raw.order_number ? raw.order_number.substring(0, 50) : null;
      const valueCents = typeof raw.value_cents === 'number' && raw.value_cents >= 0
        ? Math.round(raw.value_cents)
        : null;

      if (db) {
        try {
          await db.sql`
            INSERT INTO analytics_events (
              event_type,
              visitor_id,
              session_id,
              path,
              product_sku,
              source,
              medium,
              campaign,
              content,
              term,
              first_source,
              referrer_domain,
              link_code,
              target,
              order_number,
              value_cents,
              device,
              browser,
              os,
              country,
              region,
              city
            ) VALUES (
              ${raw.event_type},
              ${raw.visitor_id},
              ${raw.session_id},
              ${path},
              ${productSku},
              ${source},
              ${medium},
              ${campaign},
              ${content},
              ${term},
              ${firstSource},
              ${referrerDomain},
              ${linkCode},
              ${target},
              ${orderNumber},
              ${valueCents},
              ${device},
              ${browser},
              ${os},
              ${country},
              ${region},
              ${city}
            )
          `;
        } catch (dbErr) {
          console.error('[Analytics Track] Erro ao inserir evento no banco:', dbErr);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Analytics Track] Falha geral no handler:', error);
    return NextResponse.json({ ok: false }, { status: 200 }); // Nunca bloqueia o cliente
  }
}
