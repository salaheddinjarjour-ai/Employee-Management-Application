DROP TABLE IF EXISTS rewards;

CREATE TABLE rewards (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- العرض في الجدول
  title TEXT NOT NULL,            -- العنوان (مثال: "أفضل موظف للشهر")
  description TEXT,               -- الوصف
  kind TEXT NOT NULL,             -- النوع: 'مكافأة'|'تقدير'|'إنجاز'|'ابتكار'|'خاص'
  category TEXT NOT NULL,         -- الفئة: 'شهري'|'سنوي'|'ربع سنوي'|'خاص'

  amount_usd REAL,                -- (اختياري) المبلغ بالدولار، null إذا غير مالي
  reward_date TEXT NOT NULL,      -- 'YYYY-MM-DD'
  status TEXT NOT NULL,           -- 'مدفوع'|'في الانتظار'|'معتمد'

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rewards_employee ON rewards(employee_id);
CREATE INDEX IF NOT EXISTS idx_rewards_date ON rewards(reward_date);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_kind ON rewards(kind);
