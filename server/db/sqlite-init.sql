-- SQLite schema for Employee Management System
-- This schema matches the column names expected by the repository layer

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_no TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    hire_date TEXT NOT NULL,
    department TEXT,
    position TEXT,
    salary_grade_id INTEGER,
    manager_id INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ==========================================
-- ENTITY TABLES (Departments, Units, Committees)
-- ==========================================
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS committees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ==========================================
-- PIVOT TABLES (Many-to-Many Relationships)
-- ==========================================

-- Employee Departments
CREATE TABLE IF NOT EXISTS employee_departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    job_title TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0, -- 1 for true, 0 for false
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE(employee_id, department_id)
);
CREATE INDEX IF NOT EXISTS idx_emp_dept_emp_id ON employee_departments(employee_id);

-- Employee Units
CREATE TABLE IF NOT EXISTS employee_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    unit_id INTEGER NOT NULL,
    job_title TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    UNIQUE(employee_id, unit_id)
);
CREATE INDEX IF NOT EXISTS idx_emp_unit_emp_id ON employee_units(employee_id);

-- Employee Committees
CREATE TABLE IF NOT EXISTS employee_committees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    committee_id INTEGER NOT NULL,
    role_title TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, committee_id)
);
CREATE INDEX IF NOT EXISTS idx_emp_comm_emp_id ON employee_committees(employee_id);

-- Leaves (matches leavesRepo: from_date, to_date, days, status, reason)
CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT NOT NULL,
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    days INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'في الانتظار',
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON leaves(employee_id);

-- Absences
CREATE TABLE IF NOT EXISTS absences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    absence_date TEXT NOT NULL,
    absence_type TEXT NOT NULL DEFAULT 'unexcused',
    hours_missed REAL,
    reason TEXT,
    documented INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_absences_employee_id ON absences(employee_id);

-- Evaluations (matches evaluationsRepo: period, overall_score, rating, goals_percent, status, evaluator_id)
CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    evaluator_id INTEGER,
    period TEXT,
    overall_score REAL DEFAULT 0,
    rating TEXT,
    goals_percent REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'في الانتظار',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES employees(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee_id ON evaluations(employee_id);

-- Promotions (matches promotionsRepo: from_title, to_title, from_grade, to_grade, promo_type, status, effective_date, increase_amount_usd, increase_percent, notes)
CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    from_title TEXT,
    to_title TEXT,
    from_grade INTEGER,
    to_grade INTEGER,
    promo_type TEXT NOT NULL DEFAULT 'ترقية',
    status TEXT NOT NULL DEFAULT 'في الانتظار',
    effective_date TEXT NOT NULL,
    increase_amount_usd REAL DEFAULT 0,
    increase_percent REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_promotions_employee_id ON promotions(employee_id);

-- Rewards (matches rewardsRepo: title, kind, category, amount_usd, reward_date, status)
CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    kind TEXT NOT NULL DEFAULT 'مكافأة',
    category TEXT NOT NULL DEFAULT 'خاص',
    amount_usd REAL DEFAULT 0,
    reward_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'في الانتظار',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_rewards_employee_id ON rewards(employee_id);

-- Courses (matches coursesRepo: employee_id, course_name, provider, start_date, end_date, result, grade, status, attachment_*)
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    course_name TEXT NOT NULL,
    provider TEXT,
    start_date TEXT,
    end_date TEXT,
    result TEXT,
    grade TEXT,
    status TEXT NOT NULL DEFAULT 'planned',
    attachment_name TEXT,
    attachment_path TEXT,
    attachment_size INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_courses_employee_id ON courses(employee_id);

-- Salary Grades
CREATE TABLE IF NOT EXISTS salary_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade_name TEXT NOT NULL,
    base_salary REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payroll Headers
CREATE TABLE IF NOT EXISTS payroll_headers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    period TEXT NOT NULL,
    id_number TEXT,
    start_date TEXT,
    admin_level TEXT,
    job_title TEXT,
    edu_actual TEXT,
    edu_required TEXT,
    base_min REAL NOT NULL DEFAULT 0,
    years_of_exp INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    base_min_currency TEXT NOT NULL DEFAULT 'TRY',
    experience_allowance_amount REAL NOT NULL DEFAULT 0,
    experience_allowance_currency TEXT NOT NULL DEFAULT 'TRY',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, period)
);

-- Payroll Lines
CREATE TABLE IF NOT EXISTS payroll_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    header_id INTEGER NOT NULL,
    line_key TEXT NOT NULL,
    label TEXT,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'TRY',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (header_id) REFERENCES payroll_headers(id) ON DELETE CASCADE
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency TEXT NOT NULL DEFAULT 'USD',
    to_currency TEXT NOT NULL DEFAULT 'TRY',
    rate REAL NOT NULL,
    effective_from TEXT NOT NULL,
    effective_to TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_by INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates(is_active);

-- Service Years
CREATE TABLE IF NOT EXISTS service_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    service_months INTEGER NOT NULL DEFAULT 12,
    bonus_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sections
CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Holidays
CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'official',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Loans
CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    installments INTEGER NOT NULL DEFAULT 1,
    remaining REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Overtime
CREATE TABLE IF NOT EXISTS overtime (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    hours REAL NOT NULL,
    rate REAL NOT NULL DEFAULT 1.5,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Penalties
CREATE TABLE IF NOT EXISTS penalties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    penalty_type TEXT NOT NULL,
    amount REAL,
    currency TEXT DEFAULT 'USD',
    reason TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    page_key TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'view',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, page_key, action_type)
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Employee Attachments
CREATE TABLE IF NOT EXISTS employee_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
