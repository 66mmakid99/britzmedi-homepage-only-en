-- 0022: AEO monitor/engine tables + blog_jobs.detected_names (2026-06-10)
--
-- aeo_checks / aeo_cycles are written and read by:
--   src/pages/api/admin/aeo-check.ts        (INSERT/SELECT aeo_checks)
--   src/lib/aeo-engine.ts                   (INSERT/SELECT aeo_cycles)
--   src/pages/api/cron/aeo-engine.ts        (cycle runner)
--   src/pages/api/admin/aeo-engine/{run,status,history}.ts
-- but no migration created them until now (prod tables were created manually).
-- DDL derived from code usage + the schema blocks in AEO-GROWTH-ENGINE.md and
-- docs/archive/AUTO-PIPELINE-AEO.md. IF NOT EXISTS keeps this idempotent on prod.
--
-- ⚠️ PROD WARNING (same situation as 0023_prod_drift_sync.sql):
-- Production d1_migrations records only 0001 and 0004 — do NOT run
-- `wrangler d1 migrations apply` against production. Apply directly:
--   npx wrangler d1 execute britzmedi-leads --remote --file migrations/0022_aeo_tables.sql
--
-- ⚠️ BEFORE applying to prod, verify blog_jobs.detected_names does not already
-- exist (it may have been added via manual ALTER):
--   npx wrangler d1 execute britzmedi-leads --remote --command "PRAGMA table_info(blog_jobs)"
-- If the column already exists, remove/skip the ALTER at the bottom of this file
-- (SQLite has no "ADD COLUMN IF NOT EXISTS"; a duplicate ALTER fails the batch).

-- AEO/GEO check history (AI search mention tracking, /admin/aeo-monitor)
CREATE TABLE IF NOT EXISTS aeo_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  ai_engine TEXT DEFAULT 'claude',
  response_text TEXT,
  mentioned INTEGER DEFAULT 0,
  mention_context TEXT,
  source_urls TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aeo_checks_query ON aeo_checks(query);
CREATE INDEX IF NOT EXISTS idx_aeo_checks_created ON aeo_checks(created_at DESC);

-- AEO growth engine cycle log (diagnose/plan/produce/track/analyze phases)
CREATE TABLE IF NOT EXISTS aeo_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  data TEXT,
  error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aeo_cycles_phase ON aeo_cycles(phase);
CREATE INDEX IF NOT EXISTS idx_aeo_cycles_created ON aeo_cycles(created_at DESC);

-- blog_jobs.detected_names: Korean doctor names detected during the translate
-- step (JSON array), consumed by the generate and research steps. The column
-- was missing from all migrations even though the code writes/reads it.
-- ⚠️ See PROD WARNING above — skip if the column already exists in prod.
ALTER TABLE blog_jobs ADD COLUMN detected_names TEXT;
