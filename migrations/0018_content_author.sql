-- Add author and source_references columns to content_items
--
-- NOTE (2026-06-10): the `author` ALTER below was removed because the column
-- was retroactively folded into 0012_content_items.sql's CREATE TABLE
-- (author TEXT DEFAULT 'BRITZMEDI Research Team'). Replaying the original
-- `ALTER TABLE content_items ADD COLUMN author ...` on a fresh DB fails with
-- "duplicate column name" (SQLite has no ADD COLUMN IF NOT EXISTS), which also
-- aborted the source_references ALTER. This file is kept (as a partial no-op)
-- so the D1 migration history stays aligned with environments that already
-- recorded 0018.
--
-- Removed (now in 0012):
--   ALTER TABLE content_items ADD COLUMN author TEXT DEFAULT 'BRITZMEDI Research Team';

ALTER TABLE content_items ADD COLUMN source_references TEXT;
