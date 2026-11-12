CREATE TABLE IF NOT EXISTS analytics_events (
  id              BIGSERIAL PRIMARY KEY,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type      TEXT NOT NULL,
  visitor_id      UUID NOT NULL,
  session_id      UUID NOT NULL,
  path            TEXT NOT NULL,
  product_sku     TEXT,
  source          TEXT NOT NULL,
  medium          TEXT,
  campaign        TEXT,
  content         TEXT,
  term            TEXT,
  first_source    TEXT,
  referrer_domain TEXT,
  link_code       TEXT,
  target          TEXT,
  order_number    TEXT,
  value_cents     INTEGER,
  device          TEXT,
  browser         TEXT,
  os              TEXT,
  country         TEXT,
  region          TEXT,
  city            TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_time        ON analytics_events (occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_type_time   ON analytics_events (event_type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_source_time ON analytics_events (source, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_sku         ON analytics_events (product_sku);
CREATE INDEX IF NOT EXISTS idx_events_session     ON analytics_events (session_id);

CREATE TABLE IF NOT EXISTS tracked_links (
  code         TEXT PRIMARY KEY,          -- ex.: "bio-insta", só [a-z0-9-], 3 a 40 caracteres
  name         TEXT NOT NULL,             -- ex.: "Link da Bio do Instagram"
  destination  TEXT NOT NULL,             -- caminho interno: "/" ou "/p/BM-BASE-01"
  utm_source   TEXT NOT NULL,
  utm_medium   TEXT,
  utm_campaign TEXT,
  utm_content  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at  TIMESTAMPTZ
);
