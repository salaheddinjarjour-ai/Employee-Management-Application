-- Ensure leaves table has all required columns with proper names
-- This migration is idempotent and safe to run multiple times

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  leave_type TEXT,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  days INTEGER DEFAULT 0,
  status TEXT DEFAULT 'في الانتظار',
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Add missing columns if they don't exist
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we'll handle this in the migration script

