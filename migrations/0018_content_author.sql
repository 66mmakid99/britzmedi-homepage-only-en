-- Add author and source_references columns to content_items
ALTER TABLE content_items ADD COLUMN author TEXT DEFAULT 'BRITZMEDI Research Team';
ALTER TABLE content_items ADD COLUMN source_references TEXT;
