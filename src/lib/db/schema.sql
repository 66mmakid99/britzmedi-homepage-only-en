-- BRITZMEDI Lead Management Database Schema
-- Cloudflare D1 (SQLite)

-- Leads table
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
  lead_grade TEXT DEFAULT 'C', -- A, B, C, D

  -- Status tracking
  status TEXT DEFAULT 'new', -- new, contacted, qualified, proposal, won, lost
  assigned_to TEXT,

  -- Enrichment data (AI-gathered)
  company_size TEXT,
  company_industry TEXT,
  company_description TEXT,
  linkedin_url TEXT,
  enrichment_data TEXT, -- JSON object for additional data

  -- Metadata
  source TEXT DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  contacted_at TEXT,
  qualified_at TEXT
);

-- Lead activities/notes
CREATE TABLE IF NOT EXISTS lead_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL, -- note, email, call, meeting, status_change
  description TEXT,
  created_by TEXT,
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

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
