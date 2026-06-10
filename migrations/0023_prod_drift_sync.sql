-- 0023: Production drift sync (2026-06-10)
--
-- ⚠️ WARNING — DO NOT run `wrangler d1 migrations apply` against production!
-- Production d1_migrations records only 0001 and 0004; migrations 0005-0021
-- were applied manually via `d1 execute`. Running `migrations apply` on prod
-- would replay 17 migrations and corrupt the schema.
-- Apply this file directly instead:
--   npx wrangler d1 execute britzmedi-leads --remote --file migrations/0023_prod_drift_sync.sql
--
-- Verified against live schema dump 2026-06-10 before writing:
--   * content_items.quality_score missing in prod (AEO analyze queries fail)
--   * lead_activities has legacy 0010 shape (activity_type NOT NULL) while code
--     inserts (type, title, ...) — every CRM activity insert fails; table is EMPTY (0 rows)
--   * social_posts CHECK(channel) lacks 'instagram' while code posts instagram;
--     post_id is NOT NULL while code binds null — table is EMPTY (0 rows)

-- 1. content_items: add quality_score used by aeo-engine analyze + status dashboard
ALTER TABLE content_items ADD COLUMN quality_score INTEGER;

-- 2. lead_activities: rebuild to the 0013 shape the code expects (table empty, no data loss)
DROP TABLE IF EXISTS lead_activities;
CREATE TABLE lead_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(created_at);

-- 3. social_posts: rebuild with instagram channel + nullable post_id (table empty, no data loss)
DROP TABLE IF EXISTS social_posts;
CREATE TABLE social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('twitter', 'linkedin', 'facebook', 'instagram')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'skipped')),
  scheduled_at DATETIME,
  published_at DATETIME,
  external_id TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_social_posts_post ON social_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
