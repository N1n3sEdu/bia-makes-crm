import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { getAnalyticsDb } from "@/lib/analytics/db";

const STATE_ROW_ID = "biamakes_main_state_v1";
const LOCAL_FALLBACK_FILE = path.join(os.tmpdir(), "biamakes-store-state-v4.json");

export interface StoreSnapshotPayload {
  updatedAt: number;
  products?: unknown[];
  orders?: unknown[];
  movements?: unknown[];
  channels?: unknown[];
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

async function ensureStateTable(db: NonNullable<ReturnType<typeof getAnalyticsDb>>) {
  await db.sql`
    CREATE TABLE IF NOT EXISTS bia_store_state (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `;
}

async function readLocalFallback(): Promise<StoreSnapshotPayload | null> {
  try {
    const raw = await fs.readFile(LOCAL_FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.updatedAt === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeLocalFallback(payload: StoreSnapshotPayload): Promise<boolean> {
  try {
    await fs.writeFile(LOCAL_FALLBACK_FILE, JSON.stringify(payload), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const db = getAnalyticsDb();

  if (db) {
    try {
      await ensureStateTable(db);
      const rows = (await db.sql`
        SELECT payload, updated_at
        FROM bia_store_state
        WHERE id = ${STATE_ROW_ID}
        LIMIT 1
      `) as Array<{ payload: StoreSnapshotPayload; updated_at: string | number }>;

      if (rows.length > 0 && rows[0]?.payload) {
        return NextResponse.json({
          initialized: true,
          ...rows[0].payload,
          updatedAt: Number(rows[0].updated_at || rows[0].payload.updatedAt || 0),
        });
      }
      return NextResponse.json({ initialized: false, updatedAt: 0 });
    } catch (error) {
      console.warn("[API store-state GET] Falha ao ler do Netlify DB, tentando fallback local:", error);
    }
  }

  const local = await readLocalFallback();
  if (local) {
    return NextResponse.json({
      initialized: true,
      ...local,
    });
  }

  return NextResponse.json({ initialized: false, updatedAt: 0 });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StoreSnapshotPayload;
    if (!body || typeof body.updatedAt !== "number") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const snapshot: StoreSnapshotPayload = {
      updatedAt: body.updatedAt,
      products: Array.isArray(body.products) ? body.products : undefined,
      orders: Array.isArray(body.orders) ? body.orders : undefined,
      movements: Array.isArray(body.movements) ? body.movements : undefined,
      channels: Array.isArray(body.channels) ? body.channels : undefined,
      maintenanceMode: typeof body.maintenanceMode === "boolean" ? body.maintenanceMode : undefined,
      maintenanceMessage: typeof body.maintenanceMessage === "string" ? body.maintenanceMessage : undefined,
    };

    const db = getAnalyticsDb();
    if (db) {
      try {
        await ensureStateTable(db);
        const existing = (await db.sql`
          SELECT updated_at FROM bia_store_state WHERE id = ${STATE_ROW_ID} LIMIT 1
        `) as Array<{ updated_at: string | number }>;

        const currentUpdatedAt = existing.length > 0 ? Number(existing[0].updated_at || 0) : 0;
        if (snapshot.updatedAt >= currentUpdatedAt) {
          const jsonStr = JSON.stringify(snapshot);
          await db.sql`
            INSERT INTO bia_store_state (id, payload, updated_at)
            VALUES (${STATE_ROW_ID}, ${jsonStr}::jsonb, ${snapshot.updatedAt})
            ON CONFLICT (id) DO UPDATE SET
              payload = EXCLUDED.payload,
              updated_at = EXCLUDED.updated_at
          `;
        }
        return NextResponse.json({ ok: true, storage: "database", updatedAt: snapshot.updatedAt });
      } catch (error) {
        console.warn("[API store-state POST] Falha ao gravar no Netlify DB, usando fallback local:", error);
      }
    }

    const existingLocal = await readLocalFallback();
    if (!existingLocal || snapshot.updatedAt >= existingLocal.updatedAt) {
      await writeLocalFallback(snapshot);
    }

    return NextResponse.json({ ok: true, storage: "local", updatedAt: snapshot.updatedAt });
  } catch (error) {
    console.error("[API store-state POST] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro ao sincronizar estado" }, { status: 500 });
  }
}
