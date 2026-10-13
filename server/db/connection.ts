/**
 * Database connection switcher.
 * Uses SQLite when USE_SQLITE=true, MSSQL otherwise.
 * All repositories import from this file.
 * 
 * IMPORTANT: We use conditional require() here on purpose.
 * When USE_SQLITE=true, mssql-connection.ts is never loaded (avoids 'mssql' dependency).
 */
import dotenv from 'dotenv'
dotenv.config()

const useSqlite = process.env.USE_SQLITE === 'true'

// Re-export functions based on which backend we're using
let _query: any
let _queryOne: any
let _getConnection: any
let _close: any
let _reconnect: any
let _sql: any

if (useSqlite) {
  const sqliteConn = require('./sqlite-connection')
  _query = sqliteConn.query
  _queryOne = sqliteConn.queryOne
  _getConnection = sqliteConn.getConnection
  _close = sqliteConn.close
  _reconnect = sqliteConn.reconnect
  _sql = {} // No MSSQL sql module needed
  console.log('[db] Using SQLite backend')
} else {
  const mssqlConn = require('./mssql-connection')
  _query = mssqlConn.query
  _queryOne = mssqlConn.queryOne
  _getConnection = mssqlConn.getConnection
  _close = mssqlConn.close
  _reconnect = mssqlConn.reconnect
  _sql = mssqlConn.sql
  console.log('[db] Using MSSQL backend')
}

export const query = _query
export const queryOne = _queryOne
export const getConnection = _getConnection
export const close = _close
export const reconnect = _reconnect
export const sql = _sql
