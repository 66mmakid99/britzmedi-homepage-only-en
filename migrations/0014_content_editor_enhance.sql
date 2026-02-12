-- Content Editor Enhancement: research/analysis/revisions
-- Migration 0014

-- Add research and analysis columns to content_items
ALTER TABLE content_items ADD COLUMN research_data TEXT;
ALTER TABLE content_items ADD COLUMN analysis_data TEXT;

-- Drop old content_revisions (schema mismatch from 0012, no useful data)
DROP TABLE IF EXISTS content_revisions;

-- Create content_revisions with proper schema
CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  faqs TEXT,
  change_summary TEXT,
  word_count INTEGER,
  score INTEGER,
  created_by TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revisions_content ON content_revisions(content_id, version);
