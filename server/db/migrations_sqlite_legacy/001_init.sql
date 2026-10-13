-- employees
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  employee_no TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  hire_date   TEXT NOT NULL,
  job_title   TEXT NOT NULL,
  department  TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT
);

-- courses
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  provider    TEXT NOT NULL,
  start_date  TEXT NOT NULL,
  end_date    TEXT NOT NULL,
  result      TEXT,
  grade       TEXT,
  status      TEXT NOT NULL DEFAULT 'planned',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  eval_date TEXT NOT NULL,
  score     REAL,
  rating_text TEXT,
  evaluator TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- promotions
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  promo_type TEXT NOT NULL,
  promo_date TEXT NOT NULL,
  reference  TEXT,
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- rewards
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_date TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  reference TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- leaves
CREATE TABLE IF NOT EXISTS leaves (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  from_date  TEXT NOT NULL,
  to_date    TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- absences
CREATE TABLE IF NOT EXISTS absences (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  from_date TEXT NOT NULL,
  to_date   TEXT NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- attachments (polymorphic)
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_url TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT
);

-- exchange_rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL DEFAULT 'TRY',
  rate REAL NOT NULL CHECK (rate > 0),
  effective_from TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_courses_employee  ON courses(employee_id);
CREATE INDEX IF NOT EXISTS idx_eval_employee     ON evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_prom_employee     ON promotions(employee_id);
CREATE INDEX IF NOT EXISTS idx_reward_employee   ON rewards(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_employee    ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_abs_employee      ON absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_att_entity        ON attachments(entity_type, entity_id);

