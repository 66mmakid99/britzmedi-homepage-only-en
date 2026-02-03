-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Contact Info
  company_name TEXT NOT NULL,
  company_website TEXT,
  contact_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,

  -- Interest
  interested_products TEXT NOT NULL, -- JSON array
  message TEXT,

  -- Lead Scoring
  lead_score INTEGER DEFAULT 0,
  lead_grade TEXT DEFAULT 'D' CHECK (lead_grade IN ('A', 'B', 'C', 'D')),

  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),

  -- AI Research (to be populated later)
  ai_research TEXT, -- JSON object with company analysis

  -- Metadata
  source TEXT DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  contacted_at DATETIME,

  -- Notes
  notes TEXT
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_grade ON leads(lead_grade);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
