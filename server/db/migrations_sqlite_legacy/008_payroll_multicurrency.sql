-- Add multi-currency support to payroll_headers table
-- This migration adds currency fields for base salary and experience allowance

-- Add base salary currency column
ALTER TABLE payroll_headers ADD COLUMN base_min_currency TEXT NOT NULL DEFAULT 'TRY';

-- Add experience allowance amount and currency columns
ALTER TABLE payroll_headers ADD COLUMN experience_allowance_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE payroll_headers ADD COLUMN experience_allowance_currency TEXT NOT NULL DEFAULT 'TRY';

-- Update existing records to use TRY as default currency
UPDATE payroll_headers SET 
  base_min_currency = 'TRY',
  experience_allowance_amount = 0,
  experience_allowance_currency = 'TRY'
WHERE base_min_currency IS NULL OR experience_allowance_currency IS NULL;
