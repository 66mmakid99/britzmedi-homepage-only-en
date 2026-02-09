-- ============================================================
-- BRITZMEDI D1 Full Schema (통합)
-- Generated from actual code query analysis (2026-02-09)
-- Database: britzmedi-leads (Cloudflare D1 / SQLite)
-- ============================================================

-- ============================================================
-- 1. leads — 리드(영업 문의) 관리
-- ============================================================
-- 사용: api/leads/index.ts, api/leads/[id].ts, api/leads/stats.ts,
--       api/newsletter.ts, api/resource-download.ts, api/admin/leads/research.ts
CREATE TABLE IF NOT EXISTS leads (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Contact info (7 required fields from LeadForm)
  company_name        TEXT NOT NULL,
  company_website     TEXT,
  contact_name        TEXT NOT NULL,
  job_title           TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  country             TEXT NOT NULL,
  interested_products TEXT NOT NULL,          -- JSON array: ["TORR RF","ULBLANC"]

  -- Message
  message             TEXT,

  -- Lead scoring (calculated on submit by lead-score.ts)
  lead_score          INTEGER DEFAULT 0,      -- 0-100
  lead_grade          TEXT DEFAULT 'D' CHECK (lead_grade IN ('A','B','C','D')),

  -- Sales pipeline status
  status              TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal','won','lost')),
  assigned_to         TEXT,                   -- future: sales rep assignment
  notes               TEXT,                   -- admin notes (updated via PUT)
  contacted_at        TEXT,                   -- when first contact was made

  -- AI company research (populated by api/admin/leads/research.ts)
  ai_research         TEXT,                   -- JSON: {companySize, estimatedRevenue, mainBusiness, ...}

  -- Enrichment data
  enrichment_data     TEXT,                   -- JSON: {referral_source, ...}
  company_size        TEXT,
  company_industry    TEXT,
  company_description TEXT,
  linkedin_url        TEXT,

  -- Acquisition tracking
  source              TEXT DEFAULT 'website', -- website | resource_download | newsletter
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  ip_address          TEXT,
  user_agent          TEXT,

  -- Timestamps
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now')),
  qualified_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_email     ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status    ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_grade     ON leads(lead_grade);
CREATE INDEX IF NOT EXISTS idx_leads_country   ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_score     ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created   ON leads(created_at DESC);


-- ============================================================
-- 2. lead_activities — 리드 활동 이력
-- ============================================================
-- 사용: schema.sql에 정의 (UI에서 향후 사용 예정)
CREATE TABLE IF NOT EXISTS lead_activities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id       INTEGER NOT NULL,
  activity_type TEXT NOT NULL,                -- note | email | call | meeting | status_change
  description   TEXT,
  created_by    TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);


-- ============================================================
-- 3. lead_score_history — 리드 스코어 변경 이력
-- ============================================================
-- 사용: schema.sql에 정의 (UI에서 향후 사용 예정)
CREATE TABLE IF NOT EXISTS lead_score_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id        INTEGER NOT NULL,
  previous_score INTEGER,
  new_score      INTEGER,
  reason         TEXT,
  created_at     TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);


-- ============================================================
-- 4. resource_downloads — 리소스 다운로드 추적
-- ============================================================
-- 사용: api/resources/track.ts, api/resources/stats.ts, api/resource-download.ts
CREATE TABLE IF NOT EXISTS resource_downloads (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id       TEXT NOT NULL,
  resource_title    TEXT NOT NULL,
  resource_category TEXT,
  email             TEXT,
  ip_address        TEXT,
  user_agent        TEXT,
  referer           TEXT,
  country           TEXT,
  created_at        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_downloads_resource ON resource_downloads(resource_id);
CREATE INDEX IF NOT EXISTS idx_downloads_created  ON resource_downloads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_country  ON resource_downloads(country);


-- ============================================================
-- 5. blog_jobs — YouTube/파일→블로그 생성 작업 큐
-- ============================================================
-- 사용: api/blog/queue.ts, api/blog/upload.ts, api/blog/queue/[id].ts,
--       api/blog/queue/[id]/step/*.ts, lib/youtube-to-blog/queue.ts
CREATE TABLE IF NOT EXISTS blog_jobs (
  id               TEXT PRIMARY KEY,          -- UUID
  youtube_url      TEXT NOT NULL,
  youtube_id       TEXT NOT NULL,
  video_title      TEXT,
  channel_name     TEXT,
  channel_id       TEXT,

  -- Pipeline state
  status           TEXT NOT NULL DEFAULT 'pending',
    -- pending | extracting | translating | generating | researching | imaging | finalizing | completed | failed
  current_step     TEXT,
  progress         INTEGER DEFAULT 0,         -- 0-100
  error_message    TEXT,

  -- Extracted/translated content
  transcript_text  TEXT,
  transcript_lang  TEXT,                      -- original language code (ko, en, etc.)
  translated_text  TEXT,                      -- English translation

  -- Generation settings
  target_lang      TEXT DEFAULT 'en',
  tone             TEXT DEFAULT 'professional', -- professional | casual | academic
  word_count       INTEGER DEFAULT 1500,

  -- Result link
  blog_post_id     TEXT,

  -- Timestamps
  created_at       TEXT DEFAULT (datetime('now')),
  updated_at       TEXT DEFAULT (datetime('now')),
  started_at       TEXT,
  completed_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_blog_jobs_status     ON blog_jobs(status);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_created    ON blog_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_youtube_id ON blog_jobs(youtube_id);


-- ============================================================
-- 6. blog_posts — 블로그 게시물
-- ============================================================
-- 사용: api/blog/posts.ts, api/blog/posts/[id].ts, api/blog/posts/[id]/publish.ts,
--       api/blog/posts/[id]/unpublish.ts, api/blog/posts/[id]/upload-image.ts,
--       api/blog/posts/[id]/send-approval.ts, api/blog/posts/[id]/approve.ts,
--       api/blog/posts/[id]/regenerate-image.ts, api/blog/posts/[id]/research-doctor.ts,
--       api/blog/queue/[id]/step/generate.ts, finalize.ts, image.ts, research.ts,
--       api/blog/approve.ts, api/admin/blog/[id].ts, api/admin/blog/posts.ts,
--       api/admin/content-hub/transition.ts, api/admin/content-hub/quality-check.ts,
--       api/admin/social/post.ts, worker/scheduled-publish.ts
CREATE TABLE IF NOT EXISTS blog_posts (
  id                   TEXT PRIMARY KEY,       -- UUID
  job_id               TEXT,                   -- FK → blog_jobs.id

  -- Content
  title                TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  content              TEXT NOT NULL,          -- HTML body
  excerpt              TEXT,
  meta_description     TEXT,

  -- SEO
  keywords             TEXT,                   -- JSON array
  schema_json_ld       TEXT,                   -- JSON-LD structured data

  -- Media
  featured_image       TEXT,                   -- R2 key or URL
  images               TEXT,                   -- JSON array [{url, alt, caption}]
  youtube_embed_url    TEXT,

  -- Doctor/Expert attribution
  doctor_name          TEXT,
  doctor_title         TEXT,
  doctor_credentials   TEXT,
  doctor_image         TEXT,                   -- R2 key or URL
  doctor_bio           TEXT,
  doctor_verified      BOOLEAN DEFAULT FALSE,
  doctor_verified_source TEXT,

  -- Categorization
  category             TEXT DEFAULT 'medical-devices',
  tags                 TEXT,                   -- JSON array

  -- Publishing workflow
  status               TEXT NOT NULL DEFAULT 'draft',
    -- draft | review | approved | scheduled | published | unpublished | archived
  scheduled_date       TEXT,                   -- ISO date for scheduled publish
  approval_token       TEXT,                   -- random token for email approve/reject
  approved_by          TEXT,
  approved_at          TEXT,
  published_at         TEXT,
  github_commit_sha    TEXT,                   -- SHA of the commit that published

  -- Source tracking
  youtube_url          TEXT,
  youtube_id           TEXT,
  channel_name         TEXT,

  -- Timestamps
  created_at           TEXT DEFAULT (datetime('now')),
  updated_at           TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status    ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug      ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled ON blog_posts(status, scheduled_date) WHERE status = 'scheduled';


-- ============================================================
-- 7. youtube_channels — YouTube 채널 관리
-- ============================================================
-- 사용: schema-blog.sql에 정의 (YouTube batch processing)
CREATE TABLE IF NOT EXISTS youtube_channels (
  id              TEXT PRIMARY KEY,
  channel_id      TEXT NOT NULL UNIQUE,
  channel_name    TEXT NOT NULL,
  channel_url     TEXT,
  thumbnail_url   TEXT,
  auto_process    INTEGER DEFAULT 0,          -- boolean: auto-process new videos
  last_checked_at TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);


-- ============================================================
-- 8. youtube_videos — YouTube 비디오 처리 추적
-- ============================================================
-- 사용: schema-blog.sql에 정의 (video tracking)
CREATE TABLE IF NOT EXISTS youtube_videos (
  id            TEXT PRIMARY KEY,
  youtube_id    TEXT NOT NULL UNIQUE,
  channel_id    TEXT,
  title         TEXT,
  thumbnail_url TEXT,
  duration      TEXT,
  published_at  TEXT,
  processed     INTEGER DEFAULT 0,            -- boolean
  job_id        TEXT,
  blog_post_id  TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (channel_id) REFERENCES youtube_channels(channel_id),
  FOREIGN KEY (job_id) REFERENCES blog_jobs(id),
  FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id)
);

CREATE INDEX IF NOT EXISTS idx_youtube_videos_youtube_id ON youtube_videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel    ON youtube_videos(channel_id);


-- ============================================================
-- 9. name_mappings — 한국어 이름 로마자 매핑
-- ============================================================
-- 사용: lib/youtube-to-blog/name-romanization.ts
CREATE TABLE IF NOT EXISTS name_mappings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ko         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  affiliation_ko  TEXT,
  affiliation_en  TEXT,
  specialty       TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  verified_source TEXT,                       -- manual | api | gemini
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_name_mappings_name_ko  ON name_mappings(name_ko);
CREATE INDEX IF NOT EXISTS idx_name_mappings_verified        ON name_mappings(verified);


-- ============================================================
-- 10. subscribers — 이메일 뉴스레터 구독자
-- ============================================================
-- 사용: api/subscribers/subscribe.ts, confirm.ts, unsubscribe.ts, list.ts,
--       export.ts, notify.ts
CREATE TABLE IF NOT EXISTS subscribers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  email               TEXT UNIQUE NOT NULL,
  name                TEXT,
  language            TEXT DEFAULT 'en',
  categories          TEXT DEFAULT '[]',       -- JSON array of subscribed categories
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','unsubscribed')),
  confirmation_token  TEXT UNIQUE,
  unsubscribe_token   TEXT UNIQUE,
  subscribed_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at        DATETIME,
  unsubscribed_at     DATETIME
);

CREATE INDEX IF NOT EXISTS idx_subscribers_status              ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email               ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmation_token  ON subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token   ON subscribers(unsubscribe_token);


-- ============================================================
-- 11. notification_log — 구독자 알림 발송 이력
-- ============================================================
-- 사용: api/subscribers/notify.ts
CREATE TABLE IF NOT EXISTS notification_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id   INTEGER NOT NULL,
  blog_post_slug  TEXT NOT NULL,
  sent_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  status          TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed','bounced')),
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_subscriber ON notification_log(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_slug       ON notification_log(blog_post_slug);


-- ============================================================
-- 12. social_accounts — SNS 계정 관리
-- ============================================================
-- 사용: api/admin/social/accounts.ts, api/admin/social/accounts/[id].ts,
--       api/admin/social/linkedin/callback.ts, disconnect.ts,
--       api/admin/social/status.ts, lib/social/auto-post.ts
CREATE TABLE IF NOT EXISTS social_accounts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  channel      TEXT NOT NULL CHECK (channel IN ('twitter','linkedin','facebook','instagram')),
  account_name TEXT NOT NULL,
  account_id   TEXT,
  enabled      INTEGER DEFAULT 1,             -- boolean
  auto_post    INTEGER DEFAULT 1,             -- boolean: auto-post on blog publish
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_channel ON social_accounts(channel);


-- ============================================================
-- 13. social_posts — SNS 포스팅 이력
-- ============================================================
-- 사용: api/admin/social/post.ts, posts.ts, [id].ts, [id]/repost.ts,
--       lib/social/auto-post.ts
CREATE TABLE IF NOT EXISTS social_posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id       TEXT NOT NULL,                -- blog_posts.id (source content)
  channel       TEXT NOT NULL CHECK (channel IN ('twitter','linkedin','facebook','instagram')),
  content       TEXT NOT NULL,                -- actual posted text
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','posted','failed','skipped')),
  scheduled_at  DATETIME,
  published_at  DATETIME,
  external_id   TEXT,                         -- platform's post ID (tweet ID, etc.)
  error_message TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_posts_post_id ON social_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_channel ON social_posts(channel);
CREATE INDEX IF NOT EXISTS idx_social_posts_status  ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);


-- ============================================================
-- Seed data
-- ============================================================
INSERT OR REPLACE INTO name_mappings (name_ko, name_en, affiliation_ko, affiliation_en, specialty, verified, verified_source)
VALUES ('서의석', 'Yeui-seok Seo', NULL, NULL, NULL, 1, 'manual');

INSERT OR REPLACE INTO name_mappings (name_ko, name_en, affiliation_ko, affiliation_en, specialty, verified, verified_source)
VALUES ('김형주', 'Kim Hyung-ju', '더웰피부과', 'The Well Dermatology Clinic', 'Dermatology', 1, 'manual');
