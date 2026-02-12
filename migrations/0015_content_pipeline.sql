-- Content Pipeline: queue and logging tables
-- Migration 0015

CREATE TABLE IF NOT EXISTS content_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  search_intent TEXT,
  priority INTEGER DEFAULT 5,
  target_word_count INTEGER DEFAULT 2000,
  status TEXT DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  content_id INTEGER,
  research_data TEXT,
  analysis_data TEXT,
  scheduled_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pipeline_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  queue_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
