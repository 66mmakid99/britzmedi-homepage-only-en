-- Content Hub: content_items and content_revisions tables
-- Migration 0012

CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL CHECK(source_type IN ('youtube', 'file', 'seo_brief', 'manual')),
  source_id TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  excerpt TEXT,
  category TEXT,
  tags TEXT,
  featured_image TEXT,
  seo_keyword TEXT,
  seo_secondary_keywords TEXT,
  seo_gap_score INTEGER,
  seo_target_position INTEGER,
  schema_type TEXT,
  faq TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('brief','generating','draft','review','approved','published','archived')),
  author TEXT DEFAULT 'BRITZMEDI Research Team',
  word_count INTEGER,
  estimated_read_time TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  editor TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_source ON content_items(source_type);
