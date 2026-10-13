import Database from 'better-sqlite3'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

let db: Database.Database | null = null

const DB_PATH = process.env.SQLITE_PATH || path.resolve(__dirname, '../../employee_management.db')

/**
 * SQLite connection adapter that provides a MSSQL-compatible API.
 * Allows repository code to work unchanged with either MSSQL or SQLite.
 */

export async function getConnection(): Promise<Database.Database> {
    if (db) return db

    console.log(`[sqlite] Opening database at: ${DB_PATH}`)
    db = new Database(DB_PATH)

    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    console.log('[sqlite] Database connected')
    return db
}

/**
 * Convert MSSQL-style SQL to SQLite-compatible SQL:
 * - @param → $param (named parameters)
 * - GETDATE() → CURRENT_TIMESTAMP
 * - SCOPE_IDENTITY() AS id → removed (we use lastInsertRowid)
 * - TOP N → LIMIT N
 * - COALESCE works in both
 * - N'string' → 'string' (Unicode prefix)
 */
function convertSql(sql: string): string {
    let converted = sql

    // Remove SCOPE_IDENTITY() line — we'll add the id from lastInsertRowid
    converted = converted.replace(/;\s*SELECT\s+SCOPE_IDENTITY\(\)\s+AS\s+id\s*;?/gi, ';')

    // GETDATE() → CURRENT_TIMESTAMP
    converted = converted.replace(/GETDATE\(\)/gi, "CURRENT_TIMESTAMP")

    // TOP (@param) → handled separately (need to move to LIMIT)
    converted = converted.replace(
        /SELECT\s+TOP\s*\(\s*@(\w+)\s*\)/gi,
        'SELECT'
    )
    // TOP N (literal number)
    converted = converted.replace(
        /SELECT\s+TOP\s+(\d+)/gi,
        'SELECT'
    )

    // N'string' → 'string'
    converted = converted.replace(/N'/g, "'")

    // @param → $param for named parameters
    converted = converted.replace(/@(\w+)/g, '$$$1')

    // Add LIMIT if we removed TOP
    if (sql.match(/TOP\s*\(\s*@(\w+)\s*\)/i)) {
        const limitParam = sql.match(/TOP\s*\(\s*@(\w+)\s*\)/i)![1]
        if (!converted.includes('LIMIT')) {
            converted = converted.replace(/\s*$/, ` LIMIT $${limitParam}`)
        }
    } else if (sql.match(/TOP\s+(\d+)/i)) {
        const limitVal = sql.match(/TOP\s+(\d+)/i)![1]
        if (!converted.includes('LIMIT')) {
            converted = converted.replace(/\s*$/, ` LIMIT ${limitVal}`)
        }
    }

    return converted
}

/**
 * Convert params: ensure values are not undefined (SQLite doesn't accept undefined)
 * better-sqlite3 expects param keys WITHOUT $ prefix, matching $param in SQL automatically.
 */
function convertParams(params?: Record<string, any>): Record<string, any> | undefined {
    if (!params) return undefined

    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(params)) {
        result[key] = value ?? null
    }
    return result
}

/**
 * Determine if SQL is a SELECT query
 */
function isSelect(sql: string): boolean {
    return /^\s*SELECT/i.test(sql.trim())
}

/**
 * Determine if SQL contains an INSERT
 */
function isInsert(sql: string): boolean {
    return /INSERT\s+INTO/i.test(sql)
}

/**
 * Execute a SQL query with MSSQL-compatible return format.
 * Returns { recordset: [...], rowsAffected: [n] }
 */
export async function query(command: string, params?: Record<string, any>) {
    const conn = await getConnection()
    const convertedSql = convertSql(command)
    const convertedParams = convertParams(params)

    try {
        if (isSelect(convertedSql)) {
            const stmt = conn.prepare(convertedSql)
            const rows = convertedParams ? stmt.all(convertedParams) : stmt.all()
            return {
                recordset: rows as any[],
                rowsAffected: [rows.length]
            }
        } else if (isInsert(convertedSql)) {
            // For INSERT, we need to handle multi-statement (INSERT + SELECT SCOPE_IDENTITY)
            // We already stripped the SCOPE_IDENTITY, so just run the INSERT
            const cleanSql = convertedSql.replace(/;\s*;/g, ';').replace(/;\s*$/, '')
            const stmt = conn.prepare(cleanSql)
            const info = convertedParams ? stmt.run(convertedParams) : stmt.run()
            return {
                recordset: [{ id: info.lastInsertRowid }],
                rowsAffected: [info.changes]
            }
        } else {
            // UPDATE, DELETE, etc.
            // Handle multiple statements by splitting on semicolons
            const statements = convertedSql.split(';').filter(s => s.trim().length > 0)
            let totalChanges = 0

            for (const stmtSql of statements) {
                const stmt = conn.prepare(stmtSql.trim())
                const info = convertedParams ? stmt.run(convertedParams) : stmt.run()
                totalChanges += info.changes
            }

            return {
                recordset: [],
                rowsAffected: [totalChanges]
            }
        }
    } catch (err: any) {
        console.error('[sqlite] Query error:', err.message)
        console.error('[sqlite] Original SQL:', command)
        console.error('[sqlite] Converted SQL:', convertedSql)
        console.error('[sqlite] Params:', convertedParams)
        throw err
    }
}

/**
 * Execute a query and return the first row (or null).
 * MSSQL-compatible.
 */
export async function queryOne(command: string, params?: Record<string, any>) {
    const result = await query(command, params)
    return result.recordset[0] || null
}

export async function close() {
    if (db) {
        console.log('[sqlite] Closing database connection...')
        db.close()
        db = null
        console.log('[sqlite] Database connection closed')
    }
}

export async function reconnect() {
    await close()
    return getConnection()
}
