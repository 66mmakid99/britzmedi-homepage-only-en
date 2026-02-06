-- Korean Name Romanization Mapping Table
-- Used by Document to Blog pipeline for consistent name translations

CREATE TABLE IF NOT EXISTS name_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  affiliation_ko TEXT,
  affiliation_en TEXT,
  specialty TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_name_mappings_name_ko ON name_mappings(name_ko);
CREATE INDEX IF NOT EXISTS idx_name_mappings_verified ON name_mappings(verified);
