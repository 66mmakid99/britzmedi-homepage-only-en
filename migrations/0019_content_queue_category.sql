-- Add category column to content_queue
ALTER TABLE content_queue ADD COLUMN category TEXT DEFAULT 'medical-devices';
