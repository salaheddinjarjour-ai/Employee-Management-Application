-- Add fine_amount column to absences table
ALTER TABLE absences
  ADD COLUMN fine_amount REAL NOT NULL DEFAULT 0;



