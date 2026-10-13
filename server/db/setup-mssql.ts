import sql from 'mssql'
import fs from 'fs'
import path from 'path'
import { query } from './connection'

const DB_NAME = process.env.DB_NAME || 'EmployeeManagement'

const masterConfig: sql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Password123!',
  server: process.env.DB_SERVER || 'localhost',
  database: 'master',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
}

export async function initializeDatabase() {
  console.log('[DB] Initializing SQL Server database...')

  // 1. Create Database if not exists
  try {
    const pool = await sql.connect(masterConfig)
    const result = await pool.request().query(`SELECT name FROM sys.databases WHERE name = '${DB_NAME}'`)
    
    if (result.recordset.length === 0) {
      console.log(`[DB] Database ${DB_NAME} not found. Creating...`)
      await pool.request().query(`CREATE DATABASE ${DB_NAME}`)
      console.log(`[DB] Database ${DB_NAME} created.`)
    } else {
      console.log(`[DB] Database ${DB_NAME} already exists.`)
    }
    await pool.close()
  } catch (err) {
    console.error('[DB] Error creating database:', err)
    // Don't throw here, maybe the user user doesn't have master access but the DB exists?
    // But if we can't connect, we can't verify.
    // If the DB connection fails later, it will throw.
  }

  // 2. Run Init Script
  try {
    const initScriptPath = path.join(__dirname, 'mssql-init.sql')
    if (fs.existsSync(initScriptPath)) {
        const initScript = fs.readFileSync(initScriptPath, 'utf-8')
        // Execute the script using the app connection (which connects to the specific DB)
        await query(initScript)
        console.log('[DB] Database schema initialized.')
    } else {
        console.error('[DB] mssql-init.sql not found at', initScriptPath)
    }
  } catch (err) {
    console.error('[DB] Error initializing schema:', err)
    throw err
  }
}
