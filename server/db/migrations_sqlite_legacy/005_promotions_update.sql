-- Update promotions table to match the required schema
-- Drop and recreate the promotions table with the correct structure

DROP TABLE IF EXISTS promotions;

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- "إلى / من" (job titles) + grades shown in the table
  from_title TEXT, 
  to_title TEXT,
  from_grade INTEGER, 
  to_grade INTEGER,

  -- نوع الترقية + الحالة
  promo_type TEXT NOT NULL,          -- 'درجة'|'مسمى'|'سنوية'|'استثنائية'|'أخرى'
  status TEXT NOT NULL DEFAULT 'في الانتظار', -- 'في الانتظار'|'معتمد'|'منفذ'|'مرفوض'

  -- تاريخ السريان
  effective_date TEXT NOT NULL,      -- 'YYYY-MM-DD'

  -- زيادة الراتب (اختياري): إمّا مبلغ بالدولار أو نسبة
  increase_amount_usd REAL,          -- nullable
  increase_percent REAL,             -- nullable (0..100)

  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_promotions_employee ON promotions(employee_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(promo_type);
CREATE INDEX IF NOT EXISTS idx_promotions_effdate ON promotions(effective_date);
