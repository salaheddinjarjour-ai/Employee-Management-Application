-- Payroll snapshots table for storing monthly salary calculations
CREATE TABLE IF NOT EXISTS payroll_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM format
    status TEXT NOT NULL DEFAULT 'مسودّة', -- مسودّة | قيد المراجعة | معالج | ملغي
    
    -- inputs (USD)
    base_salary_usd REAL NOT NULL,
    admin_allowance_usd REAL DEFAULT 0,
    education_allowance_usd REAL DEFAULT 0,
    housing_allowance_usd REAL DEFAULT 0,
    transport_allowance_usd REAL DEFAULT 0,
    col_allowance_usd REAL DEFAULT 0,
    children_allowance_usd REAL DEFAULT 0,
    special_allowance_usd REAL DEFAULT 0,
    fuel_allowance_usd REAL DEFAULT 0,
    eos_accrual_usd REAL DEFAULT 0,
    exceptional_additions_usd REAL DEFAULT 0,
    deduction_loan_penalty_usd REAL DEFAULT 0,
    deduction_payment_usd REAL DEFAULT 0,
    deductions_other_usd REAL DEFAULT 0,
    overtime_hours REAL DEFAULT 0,
    
    -- computed USD
    salary_sum_usd REAL,         -- Base + regular allowances
    salary_total_usd REAL,       -- + EOS + Exceptional
    daily_rate_usd REAL, 
    hourly_rate_usd REAL,
    overtime_value_usd REAL,
    deductions_usd REAL,         -- combined three
    net_salary_usd REAL,
    
    -- TRY snapshot
    rate_used REAL,              -- USD→TRY at calc time
    salary_sum_try REAL, 
    salary_total_try REAL,
    daily_rate_try REAL, 
    hourly_rate_try REAL,
    overtime_value_try REAL, 
    deductions_try REAL, 
    net_salary_try REAL,
    
    -- audit
    audit_json TEXT,             -- raw inputs / sources / scale fills
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, month) -- One snapshot per employee per month
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_snapshots(month);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_snapshots(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_month ON payroll_snapshots(employee_id, month);
