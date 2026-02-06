-- Add scheduled publishing columns to blog_posts table
-- scheduled_date: when a scheduled post should auto-publish
-- Note: status field already exists with values: draft, review, approved, published, unpublished
-- We add 'scheduled' as a valid status value (no schema change needed for SQLite TEXT column)

ALTER TABLE blog_posts ADD COLUMN scheduled_date TEXT;

-- Index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled
  ON blog_posts(status, scheduled_date)
  WHERE status = 'scheduled';
