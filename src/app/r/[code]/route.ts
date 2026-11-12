import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDb } from '@/lib/analytics/db';
import {
  BOT_USER_AGENT_REGEX,
  parseUserAgent,
  parseNetlifyGeo,
} from '@/lib/analytics/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = (params?.code || '').toLowerCase().trim();
  const origin = req.nextUrl.origin;

  if (!code || !/^[a-z0-9-]+$/.test(code)) {
    return NextResponse.redirect(new URL('/', origin), 302);
  }

  const db = getAnalyticsDb();
  if (!db) {
    return NextResponse.redirect(new URL('/', origin), 302);
  }

  try {
    const linkRes = await db.sql<{
      code: string;
      name: string;
      destination: string;
      utm_source: string;
      utm_medium: string | null;
      utm_campaign: string | null;
      utm_content: string | null;
    }>`
      SELECT code, name, destination, utm_source, utm_medium, utm_campaign, utm_content
      FROM tracked_links
      WHERE code = ${code} AND archived_at IS NULL
      LIMIT 1
    `;

    const link = linkRes[0];
    if (!link) {
      return NextResponse.redirect(new URL('/', origin), 302);
    }

    // Monta a URL de destino com parâmetros UTM e o código do link
    const cleanDestination = link.destination.startsWith('/') ? link.destination : `/${link.destination}`;
    const targetUrl = new URL(cleanDestination, origin);

    targetUrl.searchParams.set('utm_source', link.utm_source);
    if (link.utm_medium) targetUrl.searchParams.set('utm_medium', link.utm_medium);
    if (link.utm_campaign) targetUrl.searchParams.set('utm_campaign', link.utm_campaign);
    targetUrl.searchParams.set('utm_content', link.utm_content || link.code);
    targetUrl.searchParams.set('r', link.code);

    const userAgent = req.headers.get('user-agent') || '';
    const isBot = BOT_USER_AGENT_REGEX.test(userAgent);

    // Registra o clique no servidor se não for bot
    if (!isBot) {
      const { device, browser, os } = parseUserAgent(userAgent);
      const { country, region, city } = parseNetlifyGeo(req.headers.get('x-nf-geo'));
      const fakeSession = `srv-${crypto.randomUUID()}`;
      const fakeVisitor = crypto.randomUUID();

      // Inserção sem travar o redirecionamento
      try {
        await db.sql`
          INSERT INTO analytics_events (
            event_type,
            visitor_id,
            session_id,
            path,
            source,
            medium,
            campaign,
            content,
            link_code,
            device,
            browser,
            os,
            country,
            region,
            city
          ) VALUES (
            'link_click',
            ${fakeVisitor},
            ${fakeSession},
            ${cleanDestination},
            ${link.utm_source},
            ${link.utm_medium},
            ${link.utm_campaign},
            ${link.code},
            ${link.code},
            ${device},
            ${browser},
            ${os},
            ${country},
            ${region},
            ${city}
          )
        `;
      } catch (err) {
        console.error('[Tracked Link] Erro ao registrar clique:', err);
      }
    }

    return NextResponse.redirect(targetUrl, 302);
  } catch (error) {
    console.error('[Tracked Link] Falha no redirecionamento:', error);
    return NextResponse.redirect(new URL('/', origin), 302);
  }
}
