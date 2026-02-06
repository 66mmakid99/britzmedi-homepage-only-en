-- YouTube to Blog Automation Database Schema
-- Cloudflare D1 (SQLite)

-- Blog generation jobs (queue)
CREATE TABLE IF NOT EXISTS blog_jobs (
  id TEXT PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  video_title TEXT,
  channel_name TEXT,
  channel_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values: pending, extracting, translating, generating, researching, imaging, finalizing, completed, failed
  current_step TEXT,
  progress INTEGER DEFAULT 0, -- 0-100
  error_message TEXT,

  -- Extracted data
  transcript_text TEXT,
  transcript_lang TEXT, -- original language code
  translated_text TEXT, -- English translation

  -- Generation settings
  target_lang TEXT DEFAULT 'en',
  tone TEXT DEFAULT 'professional', -- professional, casual, academic
  word_count INTEGER DEFAULT 1500,

  -- Result
  blog_post_id TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT
);

-- Blog posts (generated content)
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  job_id TEXT,

  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL, -- HTML content
  excerpt TEXT,
  meta_description TEXT,

  -- SEO
  keywords TEXT, -- JSON array
  schema_json_ld TEXT, -- JSON-LD structured data

  -- Media
  featured_image TEXT, -- R2 URL
  images TEXT, -- JSON array of {url, alt, caption}
  youtube_embed_url TEXT,

  -- Doctor/Expert info (for medical content)
  doctor_name TEXT,
  doctor_title TEXT,
  doctor_credentials TEXT,
  doctor_image TEXT,
  doctor_bio TEXT,

  -- Categorization
  category TEXT DEFAULT 'medical-devices',
  tags TEXT, -- JSON array

  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft',
  -- Status values: draft, review, approved, published, unpublished
  approval_token TEXT,
  approved_by TEXT,
  approved_at TEXT,
  published_at TEXT,
  github_commit_sha TEXT,

  -- Source
  youtube_url TEXT,
  youtube_id TEXT,
  channel_name TEXT,

  -- Timestamps
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
  auto_process INTEGER DEFAULT 0, -- boolean: auto-process new videos
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
  processed INTEGER DEFAULT 0, -- boolean
  job_id TEXT,
  blog_post_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES youtube_channels(channel_id),
  FOREIGN KEY (job_id) REFERENCES blog_jobs(id),
  FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id)
);

-- Korean name romanization mappings
CREATE TABLE IF NOT EXISTS name_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  affiliation_ko TEXT,
  affiliation_en TEXT,
  specialty TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_jobs_status ON blog_jobs(status);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_created ON blog_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_youtube_id ON blog_jobs(youtube_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_youtube_id ON youtube_videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel ON youtube_videos(channel_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_name_mappings_name_ko ON name_mappings(name_ko);
CREATE INDEX IF NOT EXISTS idx_name_mappings_verified ON name_mappings(verified);
