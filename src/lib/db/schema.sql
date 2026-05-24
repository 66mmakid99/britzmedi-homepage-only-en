-- BRITZMEDI Lead Management Database Schema
-- Cloudflare D1 (SQLite)
--
-- ⚠️ SOURCE OF TRUTH: the `migrations/` directory (applied via wrangler) plus a few
-- columns that were added directly on the production DB (britzmedi-leads). This file is
-- a reference snapshot and is NOT executed at runtime. It is kept in sync with the live
-- `PRAGMA table_info` so new environments / debugging match production.
-- Last reconciled against production: 2026-05-24.

-- Leads table — reflects live production schema (0001 + 0013 + manual ALTERs).
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  company_website TEXT,
  contact_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  interested_products TEXT NOT NULL, -- JSON array
  message TEXT,

  -- Lead scoring fields
  lead_score INTEGER DEFAULT 0,
  lead_grade TEXT DEFAULT 'D', -- A, B, C, D
  score_breakdown TEXT,          -- JSON: full scoring detail (lead-scoring.ts)

  -- Status tracking / CRM pipeline (migration 0013)
  status TEXT DEFAULT 'new', -- new, contacted, qualified, proposal, won, lost
  notes TEXT,                    -- admin notes (updated via PUT)
  priority TEXT DEFAULT 'normal',
  assigned_to TEXT,
  last_contacted_at DATETIME,
  next_action TEXT,
  next_action_date DATETIME,
  lost_reason TEXT,
  contacted_at TEXT,

  -- AI research / enrichment
  ai_research TEXT,              -- JSON, populated by api/admin/leads/research.ts
  company_research TEXT,         -- JSON, enrichment lookup
  research_status TEXT DEFAULT 'pending', -- pending | done | failed
  enrichment_data TEXT,          -- JSON object for additional data
  is_free_email INTEGER DEFAULT 0, -- 1 if a free/personal email domain

  -- Acquisition tracking
  source TEXT DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Lead activities/notes (migration 0013). NOTE: columns are `type` + `title`,
-- NOT `activity_type`. Code (api/leads/[id].ts) inserts type/title/description/created_by.
CREATE TABLE IF NOT EXISTS lead_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  type TEXT NOT NULL,          -- note, email, call, meeting, status_change, lead_created
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Lead score history
CREATE TABLE IF NOT EXISTS lead_score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  previous_score INTEGER,
  new_score INTEGER,
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Resource download tracking
CREATE TABLE IF NOT EXISTS resource_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id TEXT NOT NULL,
  resource_title TEXT NOT NULL,
  resource_category TEXT,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_downloads_resource ON resource_downloads(resource_id);
CREATE INDEX IF NOT EXISTS idx_downloads_created ON resource_downloads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_country ON resource_downloads(country);

-- ============================================
-- YouTube to Blog Automation Tables
-- ============================================
-- (Full schema in schema-blog.sql)

-- Blog generation jobs (queue)
CREATE TABLE IF NOT EXISTS blog_jobs (
  id TEXT PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  video_title TEXT,
  channel_name TEXT,
  channel_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  current_step TEXT,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  transcript_text TEXT,
  transcript_lang TEXT,
  translated_text TEXT,
  target_lang TEXT DEFAULT 'en',
  tone TEXT DEFAULT 'professional',
  word_count INTEGER DEFAULT 1500,
  blog_post_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT
);

-- Blog posts (generated content)
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_description TEXT,
  keywords TEXT,
  schema_json_ld TEXT,
  featured_image TEXT,
  images TEXT,
  youtube_embed_url TEXT,
  doctor_name TEXT,
  doctor_title TEXT,
  doctor_credentials TEXT,
  doctor_image TEXT,
  doctor_bio TEXT,
  category TEXT DEFAULT 'medical-devices',
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  approval_token TEXT,
  approved_by TEXT,
  approved_at TEXT,
  published_at TEXT,
  github_commit_sha TEXT,
  youtube_url TEXT,
  youtube_id TEXT,
  channel_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- YouTube channels (for batch processing)
CREATE TABLE IF NOT EXISTS youtube_channels (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  channel_url TEXT,
  thumbnail_url TEXT,
  auto_process INTEGER DEFAULT 0,
  last_checked_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- YouTube videos (tracking processed videos)
CREATE TABLE IF NOT EXISTS youtube_videos (
  id TEXT PRIMARY KEY,
  youtube_id TEXT NOT NULL UNIQUE,
  channel_id TEXT,
  title TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  published_at TEXT,
  processed INTEGER DEFAULT 0,
  job_id TEXT,
  blog_post_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Blog indexes
CREATE INDEX IF NOT EXISTS idx_blog_jobs_status ON blog_jobs(status);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_created ON blog_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_youtube_id ON blog_jobs(youtube_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_youtube_id ON youtube_videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel ON youtube_videos(channel_id);
