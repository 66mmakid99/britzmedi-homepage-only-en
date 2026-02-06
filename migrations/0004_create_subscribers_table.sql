-- Email subscriber management tables
-- Double opt-in subscription system

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  language TEXT DEFAULT 'en',
  categories TEXT DEFAULT '[]', -- JSON array of subscribed categories
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unsubscribed')),
  confirmation_token TEXT UNIQUE,
  unsubscribe_token TEXT UNIQUE,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  unsubscribed_at DATETIME
);

CREATE TABLE IF NOT EXISTS notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id INTEGER NOT NULL,
  blog_post_slug TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmation_token ON subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token ON subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_notification_log_subscriber ON notification_log(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_slug ON notification_log(blog_post_slug);
