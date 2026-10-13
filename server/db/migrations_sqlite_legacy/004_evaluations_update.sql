-- Update evaluations table to match the required schema
-- Drop and recreate the evaluations table with the correct structure

DROP TABLE IF EXISTS evaluations;

CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE SET NULL,

  -- الفترة: either a single month "YYYY-MM" or a range
  period TEXT NOT NULL,                -- e.g. "2025-09" or "2025-04 — 2025-09"

  overall_score REAL NOT NULL,         -- الدرجة الإجمالية 0..100
  rating TEXT NOT NULL,                -- التقييم: 'ضعيف'|'يحتاج تحسين'|'مقبول'|'جيد'|'ممتاز'
  goals_percent REAL NOT NULL,         -- تحقيق الأهداف 0..100
  status TEXT NOT NULL DEFAULT 'قيد المراجعة',  -- 'قيد المراجعة'|'معتمد'|'مرفوض'

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_eval_period ON evaluations(period);
CREATE INDEX IF NOT EXISTS idx_eval_employee ON evaluations(employee_id);
