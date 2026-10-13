-- 1. Create Entity Tables
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

-- 2. Create Pivot Tables
CREATE TABLE IF NOT EXISTS employee_departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    job_title TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE(employee_id, department_id)
);

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

-- 3. Populate Entity Tables from existing flat string data
-- Existing departments directly from employees
INSERT OR IGNORE INTO departments (name)
SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != '';

-- Existing units from employee_roles (previously added for testing)
INSERT OR IGNORE INTO units (name)
SELECT DISTINCT entity_name FROM employee_roles WHERE role_type = 'unit' AND entity_name IS NOT NULL AND entity_name != '';

-- Existing committees from employee_roles
INSERT OR IGNORE INTO committees (name)
SELECT DISTINCT entity_name FROM employee_roles WHERE role_type = 'committee' AND entity_name IS NOT NULL AND entity_name != '';

-- Existing departments from employee_roles
INSERT OR IGNORE INTO departments (name)
SELECT DISTINCT entity_name FROM employee_roles WHERE role_type = 'department' AND entity_name IS NOT NULL AND entity_name != '';

-- 4. Populate Pivot Tables from existing data

-- Main role from employees table -> employee_departments
INSERT OR IGNORE INTO employee_departments (employee_id, department_id, job_title, is_primary)
SELECT e.id, d.id, e.position, 1
FROM employees e
JOIN departments d ON e.department = d.name
WHERE e.department IS NOT NULL AND e.department != '';

-- Extra departments from employee_roles
INSERT OR IGNORE INTO employee_departments (employee_id, department_id, job_title, is_primary)
SELECT r.employee_id, d.id, r.job_title, 0
FROM employee_roles r
JOIN departments d ON r.entity_name = d.name
WHERE r.role_type = 'department';

-- Extra units from employee_roles
INSERT OR IGNORE INTO employee_units (employee_id, unit_id, job_title, is_primary)
SELECT r.employee_id, u.id, r.job_title, 0
FROM employee_roles r
JOIN units u ON r.entity_name = u.name
WHERE r.role_type = 'unit';

-- Extra committees from employee_roles
INSERT OR IGNORE INTO employee_committees (employee_id, committee_id, role_title, is_primary)
SELECT r.employee_id, c.id, r.job_title, 0
FROM employee_roles r
JOIN committees c ON r.entity_name = c.name
WHERE r.role_type = 'committee';

-- Clean up old employee_roles
DROP TABLE IF EXISTS employee_roles;
