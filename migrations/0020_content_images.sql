CREATE TABLE IF NOT EXISTS content_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_item_id INTEGER,
  filename TEXT NOT NULL,
  original_name TEXT,
  alt_text TEXT,
  caption TEXT,
  type TEXT DEFAULT 'inline' CHECK(type IN ('thumbnail','inline','og','hero')),
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  r2_key TEXT,
  url TEXT,
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_content_images_item ON content_images(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_images_type ON content_images(type);
