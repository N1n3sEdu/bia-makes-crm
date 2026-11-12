import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDb } from '@/lib/analytics/db';

function validateAdminAuth(req: NextRequest): boolean {
  const adminSecret = process.env.ANALYTICS_ADMIN_TOKEN;
  if (!adminSecret) return true;

  const tokenHeader = req.headers.get('x-analytics-token');
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  return tokenHeader === adminSecret || bearerToken === adminSecret;
}

export async function GET(req: NextRequest) {
  if (!validateAdminAuth(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const db = getAnalyticsDb();
  if (!db) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const links = await db.sql`
      SELECT 
        code, 
        name, 
        destination, 
        utm_source, 
        utm_medium, 
        utm_campaign, 
        utm_content, 
        created_at, 
        archived_at
      FROM tracked_links
      ORDER BY created_at DESC
    `;
    return NextResponse.json(links);
  } catch (error) {
    console.error('[API Links GET] Erro ao listar links:', error);
    return NextResponse.json({ error: 'Erro ao carregar links' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!validateAdminAuth(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const db = getAnalyticsDb();
  if (!db) {
    return NextResponse.json(
      { error: 'Banco de dados não disponível no momento' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { code, name, destination, utm_source, utm_medium, utm_campaign, utm_content } = body;

    // Validação de formato de código
    const cleanCode = (code || '').toLowerCase().trim();
    if (!cleanCode || !/^[a-z0-9-]{3,40}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: 'Código inválido: utilize apenas letras minúsculas, números e hífens (3 a 40 caracteres).' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome do link é obrigatório.' }, { status: 400 });
    }

    // Validação estrita de destino: PROIBIDO URLs externas para evitar Open Redirect
    if (!destination || typeof destination !== 'string') {
      return NextResponse.json({ error: 'Destino é obrigatório.' }, { status: 400 });
    }

    const trimmedDest = destination.trim();
    if (!trimmedDest.startsWith('/') || trimmedDest.startsWith('//') || /^https?:\/\//i.test(trimmedDest)) {
      return NextResponse.json(
        { error: 'Destino inválido: deve ser um caminho interno do site começando com "/" (ex: "/" ou "/p/BM-BASE-01"). URLs externas não são permitidas.' },
        { status: 400 }
      );
    }

    if (!utm_source || typeof utm_source !== 'string' || utm_source.trim().length === 0) {
      return NextResponse.json({ error: 'Origem (utm_source) é obrigatória.' }, { status: 400 });
    }

    const cleanSource = utm_source.trim().toLowerCase();
    const cleanMedium = utm_medium ? utm_medium.trim() : null;
    const cleanCampaign = utm_campaign ? utm_campaign.trim() : null;
    const cleanContent = utm_content ? utm_content.trim() : null;

    // Verificar se código já existe
    const existing = await db.sql`
      SELECT code FROM tracked_links WHERE code = ${cleanCode}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `O código "/r/${cleanCode}" já está em uso. Por favor, escolha outro código.` },
        { status: 409 }
      );
    }

    await db.sql`
      INSERT INTO tracked_links (
        code,
        name,
        destination,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content
      ) VALUES (
        ${cleanCode},
        ${name.trim()},
        ${trimmedDest},
        ${cleanSource},
        ${cleanMedium},
        ${cleanCampaign},
        ${cleanContent}
      )
    `;

    return NextResponse.json({ ok: true, code: cleanCode }, { status: 201 });
  } catch (error) {
    console.error('[API Links POST] Erro ao criar link:', error);
    return NextResponse.json({ error: 'Falha ao salvar link rastreável.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!validateAdminAuth(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const db = getAnalyticsDb();
  if (!db) {
    return NextResponse.json({ error: 'Banco de dados não disponível' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { code, action, name, destination } = body;

    if (!code) {
      return NextResponse.json({ error: 'Código do link é obrigatório' }, { status: 400 });
    }

    if (action === 'archive') {
      await db.sql`
        UPDATE tracked_links
        SET archived_at = now()
        WHERE code = ${code}
      `;
      return NextResponse.json({ ok: true });
    }

    if (action === 'unarchive') {
      await db.sql`
        UPDATE tracked_links
        SET archived_at = NULL
        WHERE code = ${code}
      `;
      return NextResponse.json({ ok: true });
    }

    if (action === 'update') {
      if (destination) {
        const trimmedDest = destination.trim();
        if (!trimmedDest.startsWith('/') || trimmedDest.startsWith('//') || /^https?:\/\//i.test(trimmedDest)) {
          return NextResponse.json({ error: 'Destino deve ser um caminho interno começando com "/".' }, { status: 400 });
        }
        await db.sql`
          UPDATE tracked_links
          SET destination = ${trimmedDest}
          WHERE code = ${code}
        `;
      }
      if (name) {
        await db.sql`
          UPDATE tracked_links
          SET name = ${name.trim()}
          WHERE code = ${code}
        `;
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });
  } catch (error) {
    console.error('[API Links PATCH] Erro ao atualizar link:', error);
    return NextResponse.json({ error: 'Falha ao processar atualização' }, { status: 500 });
  }
}
