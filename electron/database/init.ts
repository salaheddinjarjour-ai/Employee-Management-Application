import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

import { performDailyBackup } from '../util/backup'

// Use userData as requested for robust path handling
// This maps to %APPDATA%/Name on Windows
const DATA_DIR = app.getPath('userData')
const DB_PATH = path.join(DATA_DIR, 'database', 'hrms.db')

let db: SqlJsDatabase | null = null
let SQL: any = null

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export async function initializeDatabase() {
  console.log('Initializing database at:', DB_PATH)

  // Ensure data directory exists
  const dbDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Create uploads directories
  const uploadsDir = path.join(DATA_DIR, 'uploads')
  const subdirs = ['contracts', 'certificates', 'photos', 'attachments']
  subdirs.forEach(subdir => {
    const dir = path.join(uploadsDir, subdir)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  // Create backups directory
  const backupsDir = path.join(DATA_DIR, 'backups')
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
  }

  // Create logs directory
  const logsDir = path.join(DATA_DIR, 'logs')
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }

  // Initialize sql.js
  SQL = await initSqlJs()

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
    console.log('Loaded existing database from:', DB_PATH)
    // Ensure all tables exist (safe due to IF NOT EXISTS)
    await createSchema()
    await migrateSchema()
  } else {
    db = new SQL.Database()
    console.log('Created new database')
    await createSchema()
    saveDatabase()
  }

  // Check if first run
  const isFirstRun = await checkFirstRun()

  if (isFirstRun) {
    console.log('First run detected - initializing schema')
    await createSchema()
    saveDatabase()
  } else {
    // Clean up demo data on subsequent runs
    try {
      console.log('Cleaning up demo data...')
      // Remove demo courses (those without real enrollments or with placeholder data)
      db.run("DELETE FROM courses WHERE title LIKE '%Demo%' OR title LIKE '%Test%' OR instructor LIKE '%Demo%'")
      saveDatabase()
    } catch (e) {
      console.error('Failed to clean demo data:', e)
    }
  }

  console.log('Database initialized at:', DB_PATH)

  // Test audit log system
  try {
    const { logAudit } = require('../utils/auditLog')
    console.log('[Init] Testing audit log system...')
    logAudit({
      action_type: 'CREATE',
      entity_type: 'system',
      entity_name: 'Database Initialized',
      description: 'تم تهيئة قاعدة البيانات'
    })
    console.log('[Init] Test audit log should be created')
  } catch (err) {
    console.error('[Init] Failed to create test audit log:', err)
  }

  // Trigger daily backup
  try {
    performDailyBackup()
  } catch (e) {
    console.error('Failed to perform daily backup:', e)
  }
}

async function migrateSchema() {
  console.log('Checking for schema migrations...')
  try {
    const columns = db!.exec("PRAGMA table_info(employees)")
    if (columns.length > 0 && columns[0].values) {
      const hasEmployeeNo = columns[0].values.some(col => col[1] === 'employee_no')
      const hasEmployeeNumber = columns[0].values.some(col => col[1] === 'employee_number')

      if (!hasEmployeeNo && hasEmployeeNumber) {
        console.log('Migrating: Renaming employee_number to employee_no')
        db!.run("ALTER TABLE employees RENAME COLUMN employee_number TO employee_no")
      }

      // Add other missing columns from frontend
      const missingCols = [
        'education_degree',
        'category',
        'grade',
        'hire_date',
        'status',
        'unit'
      ]

      missingCols.forEach(col => {
        const hasCol = columns[0].values.some(c => c[1] === col)
        if (!hasCol) {
          console.log(`Migrating: Adding ${col} to employees`)
          db!.run(`ALTER TABLE employees ADD COLUMN ${col} TEXT`)
        }
      })
    }

    // Check payroll_headers for max_experience_years
    const payrollColumns = db!.exec("PRAGMA table_info(payroll_headers)")
    if (payrollColumns.length > 0 && payrollColumns[0].values) {
      const hasMaxExp = payrollColumns[0].values.some(c => c[1] === 'max_experience_years')
      if (!hasMaxExp) {
        console.log('Migrating: Adding max_experience_years to payroll_headers')
        db!.run('ALTER TABLE payroll_headers ADD COLUMN max_experience_years INTEGER')
      }
    }

    // Check payroll_lines constraint for cash/indemnity
    const result = db!.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='payroll_lines'")
    if (result.length > 0 && result[0].values.length > 0) {
      const sql = result[0].values[0][0] as string
      if (!sql.includes("'cash'")) {
        console.log('Migrating: Updating payroll_lines check constraint')
        db!.run("PRAGMA foreign_keys=off")
        db!.run("BEGIN TRANSACTION")
        try {
          db!.run("ALTER TABLE payroll_lines RENAME TO payroll_lines_old")
          db!.run(`
                    CREATE TABLE payroll_lines (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      header_id INTEGER NOT NULL,
                      category TEXT CHECK(category IN ('allowance', 'deduction', 'exception', 'reward', 'cash', 'indemnity')) NOT NULL,
                      label TEXT NOT NULL,
                      currency TEXT DEFAULT 'TRY',
                      amount REAL NOT NULL,
                      sort_order INTEGER,
                      FOREIGN KEY (header_id) REFERENCES payroll_headers(id) ON DELETE CASCADE
                    );
                `)
          db!.run("INSERT INTO payroll_lines SELECT * FROM payroll_lines_old")
          db!.run("DROP TABLE payroll_lines_old")
          db!.run("COMMIT")
          console.log('Migration successful: payroll_lines updated')
        } catch (err) {
          console.error('Migration failed:', err)
          db!.run("ROLLBACK")
        } finally {
          db!.run("PRAGMA foreign_keys=on")
        }
      }
    }

    // Check absences columns
    const absColumns = db!.exec("PRAGMA table_info(absences)")
    if (absColumns.length > 0 && absColumns[0].values) {
      const colNames = absColumns[0].values.map(c => c[1])

      const missingAbsCols = [
        { name: 'from_date', type: 'TEXT' },
        { name: 'to_date', type: 'TEXT' },
        { name: 'days_count', type: 'INTEGER DEFAULT 1' },
        { name: 'reported_by', type: 'TEXT' },
        { name: 'reported_date', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' },
        { name: 'hours_missed', type: 'REAL' },
        { name: 'penalty_applied', type: 'BOOLEAN' },
        { name: 'penalty_amount', type: 'REAL' },
        { name: 'fine_amount', type: 'REAL' },
        { name: 'direct_manager_notes', type: 'TEXT' },
        { name: 'hr_manager_notes', type: 'TEXT' },
        { name: 'manager_notes', type: 'TEXT' }
      ]

      missingAbsCols.forEach(col => {
        if (!colNames.includes(col.name)) {
          console.log(`Migrating: Adding ${col.name} to absences`)
          db!.run(`ALTER TABLE absences ADD COLUMN ${col.name} ${col.type}`)
        }
      })

      // Migrate existing data if from_date was just added
      if (!colNames.includes('from_date')) {
        db!.run("UPDATE absences SET from_date = date, to_date = date WHERE from_date IS NULL")
      }
    }

    // Check course_enrollments columns
    const ceColumns = db!.exec("PRAGMA table_info(course_enrollments)")
    if (ceColumns.length > 0 && ceColumns[0].values) {
      const hasGrade = ceColumns[0].values.some(c => c[1] === 'grade')
      if (!hasGrade) {
        console.log('Migrating: Adding grade/result to course_enrollments')
        db!.run("ALTER TABLE course_enrollments ADD COLUMN grade TEXT")
        db!.run("ALTER TABLE course_enrollments ADD COLUMN result TEXT")
      }
    }

    // Check evaluations table for evaluator_id and rating
    const evalColumns = db!.exec("PRAGMA table_info(evaluations)")
    if (evalColumns.length > 0 && evalColumns[0].values) {
      const hasEvaluatorId = evalColumns[0].values.some(c => c[1] === 'evaluator_id')
      if (!hasEvaluatorId) {
        console.log('Migrating: Adding evaluator_id to evaluations')
        db!.run("ALTER TABLE evaluations ADD COLUMN evaluator_id INTEGER")
      }

      const hasRating = evalColumns[0].values.some(c => c[1] === 'rating')
      if (!hasRating) {
        console.log('Migrating: Adding rating to evaluations')
        db!.run("ALTER TABLE evaluations ADD COLUMN rating TEXT")
      }

      const hasGoalsPercent = evalColumns[0].values.some(c => c[1] === 'goals_percent')
      if (!hasGoalsPercent) {
        console.log('Migrating: Adding goals_percent to evaluations')
        db!.run("ALTER TABLE evaluations ADD COLUMN goals_percent REAL")
      }
    }

    // Check entities (departments, units, committees) for description column
    const entities = ['departments', 'units', 'committees'];
    entities.forEach(entity => {
      const entityColumns = db!.exec(`PRAGMA table_info(${entity})`);
      if (entityColumns.length > 0 && entityColumns[0].values) {
        const hasDescription = entityColumns[0].values.some(c => c[1] === 'description');
        if (!hasDescription) {
          console.log(`Migrating: Adding description to ${entity}`);
          db!.run(`ALTER TABLE ${entity} ADD COLUMN description TEXT`);
        }
      }
    });

    // Check payroll_headers for net_salary column
    const payrollHeaderColumns = db!.exec("PRAGMA table_info(payroll_headers)")
    if (payrollHeaderColumns.length > 0 && payrollHeaderColumns[0].values) {
      const hasNetSalary = payrollHeaderColumns[0].values.some(c => c[1] === 'net_salary')
      if (!hasNetSalary) {
        console.log('Migrating: Adding net_salary to payroll_headers')
        db!.run("ALTER TABLE payroll_headers ADD COLUMN net_salary REAL DEFAULT 0")
      }

      const hasNetSalaryUsd = payrollHeaderColumns[0].values.some(c => c[1] === 'net_salary_usd')
      if (!hasNetSalaryUsd) {
        console.log('Migrating: Adding net_salary_usd to payroll_headers')
        db!.run("ALTER TABLE payroll_headers ADD COLUMN net_salary_usd REAL DEFAULT 0")
      }
    }


    // Check attachments table for entity_type column
    const attachmentsColumns = db!.exec("PRAGMA table_info(attachments)")
    if (attachmentsColumns.length > 0 && attachmentsColumns[0].values) {
      const colNames = attachmentsColumns[0].values.map(c => c[1])

      const hasEntityType = colNames.includes('entity_type')
      if (!hasEntityType) {
        console.log('Migrating: Adding entity_type to attachments')
        db!.run("ALTER TABLE attachments ADD COLUMN entity_type TEXT DEFAULT 'employee'")
      }

      const hasEntityId = colNames.includes('entity_id')
      if (!hasEntityId) {
        console.log('Migrating: Adding entity_id to attachments')
        db!.run("ALTER TABLE attachments ADD COLUMN entity_id INTEGER")
        // Migrate existing data: set entity_id from employee_id if it exists
        db!.run("UPDATE attachments SET entity_id = employee_id WHERE entity_id IS NULL AND employee_id IS NOT NULL")
      }

      // Add attachment_name, attachment_path, attachment_size columns if they don't exist
      const hasAttachmentName = colNames.includes('attachment_name')
      if (!hasAttachmentName && colNames.includes('file_name')) {
        console.log('Migrating: Adding attachment_name to attachments')
        db!.run("ALTER TABLE attachments ADD COLUMN attachment_name TEXT")
        db!.run("UPDATE attachments SET attachment_name = file_name WHERE attachment_name IS NULL")
      }

      const hasAttachmentPath = colNames.includes('attachment_path')
      if (!hasAttachmentPath && colNames.includes('file_path')) {
        console.log('Migrating: Adding attachment_path to attachments')
        db!.run("ALTER TABLE attachments ADD COLUMN attachment_path TEXT")
        db!.run("UPDATE attachments SET attachment_path = file_path WHERE attachment_path IS NULL")
      }

      const hasAttachmentSize = colNames.includes('attachment_size')
      if (!hasAttachmentSize && colNames.includes('file_size')) {
        console.log('Migrating: Adding attachment_size to attachments')
        db!.run("ALTER TABLE attachments ADD COLUMN attachment_size INTEGER")
        db!.run("UPDATE attachments SET attachment_size = file_size WHERE attachment_size IS NULL")
      }

      const hasDeletedAt = colNames.includes('deleted_at')
      if (!hasDeletedAt) {
        console.log('Migrating: Adding deleted_at to attachments')
        db!.run("ALTER TABLE attachments ADD COLUMN deleted_at TEXT")
      }
    }


    // Add deleted_at to leaves table if it doesn't exist
    const leavesColumns = db!.exec("PRAGMA table_info(leaves)")
    if (leavesColumns.length > 0 && leavesColumns[0].values) {
      const hasDeletedAt = leavesColumns[0].values.some(c => c[1] === 'deleted_at')
      if (!hasDeletedAt) {
        console.log('Migrating: Adding deleted_at to leaves')
        db!.run("ALTER TABLE leaves ADD COLUMN deleted_at TEXT")
      }
    }

    // Add deleted_at to promotions table if it doesn't exist
    const promotionsColumns = db!.exec("PRAGMA table_info(promotions)")
    if (promotionsColumns.length > 0 && promotionsColumns[0].values) {
      const hasDeletedAt = promotionsColumns[0].values.some(c => c[1] === 'deleted_at')
      if (!hasDeletedAt) {
        console.log('Migrating: Adding deleted_at to promotions')
        db!.run("ALTER TABLE promotions ADD COLUMN deleted_at TEXT")
      }
    }

    // Add deleted_at to evaluations table if it doesn't exist
    const evaluationsColumns = db!.exec("PRAGMA table_info(evaluations)")
    if (evaluationsColumns.length > 0 && evaluationsColumns[0].values) {
      const hasDeletedAt = evaluationsColumns[0].values.some(c => c[1] === 'deleted_at')
      if (!hasDeletedAt) {
        console.log('Migrating: Adding deleted_at to evaluations')
        db!.run("ALTER TABLE evaluations ADD COLUMN deleted_at TEXT")
      }
    }

    // Create delays table as alias/view if it doesn't exist
    const delaysTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='delays'")
    if (delaysTable.length === 0) {
      console.log('Creating delays table')
      db!.run(`
        CREATE TABLE IF NOT EXISTS delays (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          employee_name TEXT,
          date TEXT NOT NULL,
          delay_hours INTEGER DEFAULT 0,
          delay_minutes INTEGER DEFAULT 0,
          reason TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT,
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
      `)
    }

    // Create departments / units / committees tables if missing
    const deptTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='departments'")
    if (deptTable.length === 0) {
      console.log('Creating departments, units, committees and pivot tables')
      db!.run(`CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT
      )`)
      db!.run(`CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        department_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      )`)
      db!.run(`CREATE TABLE IF NOT EXISTS committees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT
      )`)
      db!.run(`CREATE TABLE IF NOT EXISTS employee_departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        department_id INTEGER NOT NULL,
        job_title TEXT,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      )`)
      db!.run(`CREATE TABLE IF NOT EXISTS employee_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        unit_id INTEGER NOT NULL,
        job_title TEXT,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
      )`)
      db!.run(`CREATE TABLE IF NOT EXISTS employee_committees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        committee_id INTEGER NOT NULL,
        role_title TEXT,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
      )`)
    } else {
      // Ensure pivot tables exist even if departments already existed
      db!.run(`CREATE TABLE IF NOT EXISTS employee_departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL,
        department_id INTEGER NOT NULL, job_title TEXT, is_primary INTEGER DEFAULT 0)`)
      db!.run(`CREATE TABLE IF NOT EXISTS employee_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL,
        unit_id INTEGER NOT NULL, job_title TEXT, is_primary INTEGER DEFAULT 0)`)
      db!.run(`CREATE TABLE IF NOT EXISTS employee_committees (
        id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL,
        committee_id INTEGER NOT NULL, role_title TEXT, is_primary INTEGER DEFAULT 0)`)
    }

    // Create audit_logs table if it doesn't exist
    const auditLogsTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'")
    if (auditLogsTable.length === 0) {
      console.log('Creating audit_logs table')
      db!.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action_type TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id INTEGER,
          entity_name TEXT,
          user_id INTEGER,
          user_name TEXT,
          description TEXT,
          old_values TEXT,
          new_values TEXT,
          ip_address TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `)
      console.log('Audit logs table created successfully')
    }

    // Add reward_currency and notes columns to rewards table if missing
    const rewardsColumns = db!.exec("PRAGMA table_info(rewards)")
    if (rewardsColumns.length > 0 && rewardsColumns[0].values) {
      const cols = rewardsColumns[0].values.map(c => c[1] as string)
      if (!cols.includes('reward_currency')) {
        db!.run("ALTER TABLE rewards ADD COLUMN reward_currency TEXT DEFAULT 'USD'")
      }
      if (!cols.includes('notes')) {
        db!.run("ALTER TABLE rewards ADD COLUMN notes TEXT")
      }
      if (!cols.includes('payroll_action')) {
        db!.run("ALTER TABLE rewards ADD COLUMN payroll_action TEXT DEFAULT 'direct'") // 'direct' | 'payroll'
      }
      if (!cols.includes('payroll_month')) {
        db!.run("ALTER TABLE rewards ADD COLUMN payroll_month TEXT") // e.g. '2026-04'
      }
      if (!cols.includes('payroll_synced')) {
        db!.run("ALTER TABLE rewards ADD COLUMN payroll_synced INTEGER DEFAULT 0")
      }
    }

    // Rebuild rewards table if it has old CHECK constraints on status or kind
    const rewardsMaster = db!.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='rewards'")
    if (rewardsMaster.length > 0 && rewardsMaster[0].values.length > 0) {
      const createSql = rewardsMaster[0].values[0][0] as string
      if (createSql && createSql.includes('CHECK') && createSql.includes('status')) {
        console.log('[Migration] Rebuilding rewards table to remove CHECK constraints')
        db!.exec(`
          BEGIN TRANSACTION;
          CREATE TABLE IF NOT EXISTS rewards_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            employee_name TEXT,
            title TEXT NOT NULL,
            description TEXT,
            kind TEXT,
            amount_usd REAL,
            reward_date TEXT NOT NULL,
            status TEXT DEFAULT 'في الانتظار',
            reward_currency TEXT DEFAULT 'USD',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
          );
          INSERT INTO rewards_new (id, employee_id, employee_name, title, description, kind, amount_usd, reward_date, status, created_at, updated_at)
            SELECT id, employee_id, employee_name, title, description, kind, amount_usd, reward_date, COALESCE(status, 'في الانتظار'), created_at, updated_at FROM rewards;
          DROP TABLE rewards;
          ALTER TABLE rewards_new RENAME TO rewards;
          COMMIT;
        `)
      }
    }

    // Add fine_currency column to absences table if missing
    const absencesColumns = db!.exec("PRAGMA table_info(absences)")
    if (absencesColumns.length > 0 && absencesColumns[0].values) {
      const cols = absencesColumns[0].values.map(c => c[1] as string)
      if (!cols.includes('fine_currency')) {
        db!.run("ALTER TABLE absences ADD COLUMN fine_currency TEXT DEFAULT 'TRY'")
      }
    }

    // Add increase_currency column to promotions table if missing
    const promotionsColumnsCheck = db!.exec("PRAGMA table_info(promotions)")
    if (promotionsColumnsCheck.length > 0 && promotionsColumnsCheck[0].values) {
      const cols = promotionsColumnsCheck[0].values.map(c => c[1] as string)
      if (!cols.includes('increase_currency')) {
        db!.run("ALTER TABLE promotions ADD COLUMN increase_currency TEXT DEFAULT 'USD'")
      }
    }

    // Create leave_types table with defaults if it doesn't exist
    const leaveTypesTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='leave_types'")
    if (leaveTypesTable.length === 0) {
      db!.run(`
        CREATE TABLE IF NOT EXISTS leave_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      const defaultTypes = ['سنوية', 'مرضية', 'طارئة', 'بدون راتب', 'أمومة', 'أبوة', 'أخرى']
      defaultTypes.forEach(t => {
        db!.run("INSERT OR IGNORE INTO leave_types (name) VALUES (?)", [t])
      })
    }

    // Create leave_statuses table with defaults if it doesn't exist
    const leaveStatusesTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='leave_statuses'")
    if (leaveStatusesTable.length === 0) {
      db!.run(`
        CREATE TABLE IF NOT EXISTS leave_statuses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      const defaultStatuses = ['في الانتظار', 'معتمد', 'مرفوض']
      defaultStatuses.forEach(s => {
        db!.run("INSERT OR IGNORE INTO leave_statuses (name) VALUES (?)", [s])
      })
    }

    // Add trainer_name and training_org columns to courses table if missing
    const coursesColumnsCheck = db!.exec("PRAGMA table_info(courses)")
    if (coursesColumnsCheck.length > 0 && coursesColumnsCheck[0].values) {
      const cols = coursesColumnsCheck[0].values.map(c => c[1] as string)
      if (!cols.includes('trainer_name')) {
        db!.run("ALTER TABLE courses ADD COLUMN trainer_name TEXT")
      }
      if (!cols.includes('training_org')) {
        db!.run("ALTER TABLE courses ADD COLUMN training_org TEXT")
      }
    }

    // Add notes column to evaluations table if missing
    const evalColumnsCheck = db!.exec("PRAGMA table_info(evaluations)")
    if (evalColumnsCheck.length > 0 && evalColumnsCheck[0].values) {
      const evalCols = evalColumnsCheck[0].values.map(c => c[1] as string)
      if (!evalCols.includes('notes')) {
        db!.run("ALTER TABLE evaluations ADD COLUMN notes TEXT")
      }
    }
  } catch (error) {
    console.error('Migration error:', error)
  }

  // Create reward_types table with defaults if it doesn't exist
  try {
    const rewardTypesTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='reward_types'")
    if (rewardTypesTable.length === 0 || !rewardTypesTable[0]?.values?.length) {
      db!.run(`
        CREATE TABLE IF NOT EXISTS reward_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      const defaultRewardTypes = ['مكافأة', 'تقدير', 'إنجاز', 'ابتكار', 'خاص']
      defaultRewardTypes.forEach(t => {
        db!.run("INSERT OR IGNORE INTO reward_types (name) VALUES (?)", [t])
      })
    }
  } catch (e) { console.error('reward_types migration error:', e) }

  // Create reward_statuses table with defaults if it doesn't exist
  try {
    const rewardStatusesTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='reward_statuses'")
    if (rewardStatusesTable.length === 0 || !rewardStatusesTable[0]?.values?.length) {
      db!.run(`
        CREATE TABLE IF NOT EXISTS reward_statuses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      const defaultRewardStatuses = ['مدفوع', 'في الانتظار', 'معتمد']
      defaultRewardStatuses.forEach(s => {
        db!.run("INSERT OR IGNORE INTO reward_statuses (name) VALUES (?)", [s])
      })
    }
  } catch (e) { console.error('reward_statuses migration error:', e) }

  // Create absence_types table with defaults if it doesn't exist
  try {
    const absenceTypesTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='absence_types'")
    if (absenceTypesTable.length === 0 || !absenceTypesTable[0]?.values?.length) {
      db!.run(`
        CREATE TABLE IF NOT EXISTS absence_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `)
      const defaultAbsenceTypes = ['غياب غير مبرر', 'تأخير', 'مغادرة مبكرة', 'عدم حضور']
      defaultAbsenceTypes.forEach(t => {
        db!.run("INSERT OR IGNORE INTO absence_types (name) VALUES (?)", [t])
      })
    }
  } catch (e) { console.error('absence_types migration error:', e) }

  // Migrate exchange_rates table - add missing columns
  try {
    const erCols = db!.exec("PRAGMA table_info(exchange_rates)")
    if (erCols.length > 0 && erCols[0].values) {
      const cols = erCols[0].values.map(c => c[1] as string)
      if (!cols.includes('is_active')) {
        db!.run("ALTER TABLE exchange_rates ADD COLUMN is_active INTEGER DEFAULT 0")
      }
      if (!cols.includes('note')) {
        db!.run("ALTER TABLE exchange_rates ADD COLUMN note TEXT")
      }
    }
  } catch (e) {}

  // Migrate auth system
  try {
    // Check if users table has old 'role' column
    const usersColumns = db!.exec("PRAGMA table_info(users)")
    if (usersColumns.length > 0 && usersColumns[0].values) {
      const hasRole = usersColumns[0].values.some(c => c[1] === 'role')
      const hasIsAdmin = usersColumns[0].values.some(c => c[1] === 'is_admin')

      if (hasRole && !hasIsAdmin) {
        console.log('Migrating: Converting role-based to permission-based auth system')

        // Add is_admin column
        db!.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
        db!.run("ALTER TABLE users ADD COLUMN updated_at TEXT")

        // Migrate existing users: ADMIN role -> is_admin = 1
        db!.run("UPDATE users SET is_admin = 1 WHERE role = 'ADMIN'")

        // Note: We can't drop the role column in SQLite easily, but it won't be used
        console.log('Auth migration completed - role column deprecated, using is_admin')
      }
    }

    // Create permissions, user_permissions, and sessions tables if they don't exist
    const permissionsTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='permissions'")
    if (permissionsTable.length === 0) {
      console.log('Creating permissions table')
      db!.run(`
        CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page_key TEXT NOT NULL,
          action_type TEXT NOT NULL CHECK(action_type IN ('view', 'create', 'edit', 'delete')),
          display_name TEXT NOT NULL,
          description TEXT,
          UNIQUE(page_key, action_type)
        )
      `)
    }

    const userPermissionsTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='user_permissions'")
    if (userPermissionsTable.length === 0) {
      console.log('Creating user_permissions table')
      db!.run(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          permission_id INTEGER NOT NULL,
          granted_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
          UNIQUE(user_id, permission_id)
        )
      `)
    }

    const sessionsTable = db!.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
    if (sessionsTable.length === 0) {
      console.log('Creating sessions table')
      db!.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          login_at TEXT NOT NULL DEFAULT (datetime('now')),
          logout_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `)
    }

    // Seed permissions if permissions table is empty
    const permCount = db!.exec("SELECT COUNT(*) as count FROM permissions")
    const count = permCount[0]?.values[0]?.[0] || 0

    if (count === 0) {
      console.log('Seeding permissions...')
      await seedPermissions()
    }
  } catch (error) {
    console.error('Auth migration error:', error)
  }
}

function saveDatabase() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

// Call this after any write operation
export function persistDatabase() {
  saveDatabase()
}

export async function checkFirstRun(): Promise<boolean> {
  try {
    const result = db!.exec('SELECT name FROM sqlite_master WHERE type="table" AND name="users"')
    return result.length === 0
  } catch (error) {
    return true
  }
}

async function createSchema() {
  const schema = `
    -- Schema version tracking
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Users table (Authentication)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      last_login TEXT
    );

    -- Permissions table (Available permissions)
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_key TEXT NOT NULL,
      action_type TEXT NOT NULL CHECK(action_type IN ('view', 'create', 'edit', 'delete')),
      display_name TEXT NOT NULL,
      description TEXT,
      UNIQUE(page_key, action_type)
    );

    -- User Permissions table (Assigned permissions)
    CREATE TABLE IF NOT EXISTS user_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
      UNIQUE(user_id, permission_id)
    );

    -- Sessions table (Audit trail)
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      login_at TEXT NOT NULL DEFAULT (datetime('now')),
      logout_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Employees table
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_no TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      national_id TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      birth_date TEXT,
      gender TEXT,
      marital_status TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      department TEXT,
      unit TEXT,
      section TEXT,
      job_title TEXT,
      join_date TEXT,
      hire_date TEXT,
      contract_type TEXT,
      employment_status TEXT DEFAULT 'active',
      status TEXT DEFAULT 'active',
      education_degree TEXT,
      category TEXT,
      grade TEXT,
      basic_salary REAL,
      housing_allowance REAL,
      transport_allowance REAL,
      other_allowances REAL,
      bank_name TEXT,
      bank_account TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      notes TEXT,
      photo_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      deleted_at TEXT
    );

    -- Service Years (Bonuses/Records)
    CREATE TABLE IF NOT EXISTS service_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      year INTEGER,
      service_months INTEGER DEFAULT 12,
      bonus_amount REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Exchange Rates
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency_from TEXT DEFAULT 'USD',
      currency_to TEXT DEFAULT 'TRY',
      rate REAL NOT NULL,
      effective_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Payroll headers
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
      base_min REAL,
      base_min_currency TEXT DEFAULT 'TRY',
      years_of_exp INTEGER,
      max_experience_years INTEGER,
      experience_allowance_amount REAL,
      experience_allowance_currency TEXT DEFAULT 'TRY',
      net_salary REAL DEFAULT 0,
      net_salary_usd REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      UNIQUE(employee_id, period)
    );

    -- Payroll lines
    CREATE TABLE IF NOT EXISTS payroll_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      header_id INTEGER NOT NULL,
      category TEXT CHECK(category IN ('allowance', 'deduction', 'exception', 'reward', 'cash', 'indemnity')) NOT NULL,
      label TEXT NOT NULL,
      currency TEXT DEFAULT 'TRY',
      amount REAL NOT NULL,
      sort_order INTEGER,
      FOREIGN KEY (header_id) REFERENCES payroll_headers(id) ON DELETE CASCADE
    );

    -- Leaves
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      employee_name TEXT,
      leave_type TEXT NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      days_count INTEGER,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Attendance
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      employee_name TEXT,
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      status TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      UNIQUE(employee_id, date)
    );

    -- Absences
    CREATE TABLE IF NOT EXISTS absences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      employee_name TEXT,
      from_date TEXT,
      to_date TEXT,
      days_count INTEGER DEFAULT 1,
      date TEXT, -- Deprecated, kept for backward compat during migration
      type TEXT,
      reason TEXT,
      reported_by TEXT,
      reported_date TEXT,
      status TEXT DEFAULT 'unexcused',
      notes TEXT,
      hours_missed REAL,
      penalty_applied BOOLEAN,
      penalty_amount REAL,
      fine_amount REAL,
      direct_manager_notes TEXT,
      hr_manager_notes TEXT,
      manager_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Rewards
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      employee_name TEXT,
      title TEXT NOT NULL,
      description TEXT,
      kind TEXT,
      amount_usd REAL,
      reward_date TEXT NOT NULL,
      status TEXT DEFAULT 'في الانتظار',
      reward_currency TEXT DEFAULT 'USD',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Promotions
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      employee_name TEXT,
      from_title TEXT,
      to_title TEXT,
      from_grade INTEGER,
      to_grade INTEGER,
      promo_type TEXT,
      status TEXT,
      effective_date TEXT NOT NULL,
      increase_amount_usd REAL,
      increase_percent REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Evaluations
    CREATE TABLE IF NOT EXISTS evaluations (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      employee_name TEXT,
      evaluator_id INTEGER,
      evaluation_date TEXT NOT NULL,
      period TEXT,
      overall_score REAL,
      performance_score REAL,
      behavior_score REAL,
      skills_score REAL,
      goals_achieved INTEGER,
      goals_total INTEGER,
      goals_percent REAL,
      rating TEXT,
      strengths TEXT,
      weaknesses TEXT,
      recommendations TEXT,
      evaluator_name TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (evaluator_id) REFERENCES employees(id)
    );

    -- Departments, Units, Committees (entity tables)
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      department_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS committees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );

    -- Employee multi-role pivot tables
    CREATE TABLE IF NOT EXISTS employee_departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      job_title TEXT,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      job_title TEXT,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_committees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      committee_id INTEGER NOT NULL,
      role_title TEXT,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
    );

    -- Courses
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      instructor TEXT,
      start_date TEXT,
      end_date TEXT,
      duration_hours INTEGER,
      location TEXT,
      max_participants INTEGER,
      status TEXT DEFAULT 'planned',
      category TEXT,
      cost REAL,
      notes TEXT,
      attachment_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );

    -- Course enrollments
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      enrollment_date TEXT NOT NULL DEFAULT (datetime('now')),
      completion_status TEXT DEFAULT 'enrolled',
      completion_date TEXT,
      score REAL,
      grade TEXT,
      result TEXT,
      certificate_issued INTEGER DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      UNIQUE(course_id, employee_id)
    );

    -- Delay records (for tracking late arrivals)
    CREATE TABLE IF NOT EXISTS delay_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      employee_name TEXT,
      date TEXT NOT NULL,
      delay_hours REAL NOT NULL DEFAULT 0,
      delay_minutes INTEGER DEFAULT 0,
      reason TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Operational plans
    CREATE TABLE IF NOT EXISTS operational_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      year INTEGER,
      quarter TEXT,
      department TEXT,
      objectives TEXT,
      kpis TEXT,
      status TEXT DEFAULT 'draft',
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );

    -- Performance indicators
    CREATE TABLE IF NOT EXISTS performance_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operational_plan_id INTEGER,
      employee_id INTEGER,
      indicator_name TEXT NOT NULL,
      target_value REAL,
      actual_value REAL,
      unit TEXT,
      weight REAL,
      status TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (operational_plan_id) REFERENCES operational_plans(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Attachments
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT DEFAULT 'employee',
      entity_id INTEGER,
      employee_id INTEGER,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Delays
    CREATE TABLE IF NOT EXISTS delays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      employee_name TEXT,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Reports metadata (for tracking generated reports)
    CREATE TABLE IF NOT EXISTS reports_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type TEXT NOT NULL,
      report_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      parameters TEXT,
      generated_by TEXT
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Insert initial schema version
    INSERT OR IGNORE INTO schema_version (version) VALUES (1);
  `

  db!.run(schema)
  console.log('Schema created successfully')
}

/**
 * Seed permissions for all pages and actions
 */
async function seedPermissions() {
  const pages = [
    { key: 'dashboard', name: 'لوحة التحكم', nameEn: 'Dashboard' },
    { key: 'employees', name: 'الموظفون', nameEn: 'Employees' },
    { key: 'payroll', name: 'كشف الرواتب', nameEn: 'Payroll' },
    { key: 'leaves', name: 'الإجازات', nameEn: 'Leaves' },
    { key: 'absences', name: 'الغياب والتأخير', nameEn: 'Absences' },
    { key: 'evaluations', name: 'التقييمات', nameEn: 'Evaluations' },
    { key: 'courses', name: 'الدورات', nameEn: 'Courses' },
    { key: 'rewards', name: 'المكافآت', nameEn: 'Rewards' },
    { key: 'promotions', name: 'الترقيات', nameEn: 'Promotions' },
    { key: 'reports', name: 'التقارير', nameEn: 'Reports' },
    { key: 'settings', name: 'الإعدادات', nameEn: 'Settings' },
    { key: 'users', name: 'إدارة المستخدمين', nameEn: 'User Management' }
  ]

  const actions = [
    { type: 'view', name: 'عرض', nameEn: 'View' },
    { type: 'create', name: 'إضافة', nameEn: 'Create' },
    { type: 'edit', name: 'تعديل', nameEn: 'Edit' },
    { type: 'delete', name: 'حذف', nameEn: 'Delete' }
  ]

  const stmt = db!.prepare(`
    INSERT OR IGNORE INTO permissions (page_key, action_type, display_name, description)
    VALUES (?, ?, ?, ?)
  `)

  for (const page of pages) {
    for (const action of actions) {
      const displayName = `${action.name} ${page.name}`
      const description = `${action.nameEn} ${page.nameEn}`
      stmt.run([page.key, action.type, displayName, description])
    }
  }

  stmt.free()
  console.log(`Seeded ${pages.length * actions.length} permissions`)
  saveDatabase()
}

export function closeDatabase() {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}
