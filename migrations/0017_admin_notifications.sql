-- Admin notifications table for lead alerts and system events
CREATE TABLE IF NOT EXISTS admin_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON admin_notifications(is_read, created_at);
