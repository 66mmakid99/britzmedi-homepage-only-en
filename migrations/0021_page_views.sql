CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  device TEXT,
  session_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_pv_session ON page_views(session_id);
