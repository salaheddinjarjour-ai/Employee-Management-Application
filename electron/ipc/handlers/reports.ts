import { IpcMainInvokeEvent } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const REPORTS_DIR = path.join(app.getPath('userData'), 'reports')

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
}

function execToObjects(result: any[]): any[] {
    if (result.length === 0) return []
    const columns = result[0].columns
    const values = result[0].values
    return values.map(row => {
        const obj: any = {}
        columns.forEach((col, idx) => {
            obj[col] = row[idx]
        })
        return obj
    })
}

export const reportsHandlers = {
    /**
     * Save report metadata to database
     */
    saveReportMetadata: async (
        event: IpcMainInvokeEvent,
        metadata: {
            report_type: string
            report_name: string
            file_path: string
            file_size?: number
            parameters?: any
            generated_by?: string
        }
    ) => {
        const db = getDatabase()

        try {
            const params = [
                metadata.report_type,
                metadata.report_name,
                metadata.file_path || '',
                metadata.file_size || 0,
                typeof metadata.parameters === 'string' ? metadata.parameters : (metadata.parameters ? JSON.stringify(metadata.parameters) : null),
                metadata.generated_by || 'system'
            ]

            db.run(`
        INSERT INTO reports_metadata 
        (report_type, report_name, file_path, file_size, parameters, generated_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, params)

            persistDatabase()

            const idResult = db.exec('SELECT last_insert_rowid() as id')
            const id = idResult[0].values[0][0]

            return { success: true, id }
        } catch (error) {
            console.error('Error saving report metadata:', error)
            throw error
        }
    },

    /**
     * Get all reports metadata
     */
    listReports: async (event: IpcMainInvokeEvent, filters?: { report_type?: string; limit?: number }) => {
        const db = getDatabase()

        try {
            let query = 'SELECT * FROM reports_metadata'
            const params: any[] = []

            if (filters?.report_type) {
                query += ' WHERE report_type = ?'
                params.push(filters.report_type)
            }

            query += ' ORDER BY generated_at DESC'

            if (filters?.limit) {
                query += ' LIMIT ?'
                params.push(filters.limit)
            }

            const result = db.exec(query, params)
            const reports = execToObjects(result)

            // Parse parameters JSON
            return reports.map(report => ({
                ...report,
                parameters: report.parameters ? JSON.parse(report.parameters) : null
            }))
        } catch (error) {
            console.error('Error listing reports:', error)
            throw error
        }
    },

    /**
     * Get recent reports (last 10)
     */
    getRecentReports: async (event: IpcMainInvokeEvent) => {
        return reportsHandlers.listReports(event, { limit: 10 })
    },

    /**
     * Get report metadata by ID
     */
    getReport: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()

        try {
            const result = db.exec('SELECT * FROM reports_metadata WHERE id = ?', [id])
            const reports = execToObjects(result)

            if (reports.length === 0) {
                return null
            }

            const report = reports[0]
            return {
                ...report,
                parameters: report.parameters ? JSON.parse(report.parameters) : null
            }
        } catch (error) {
            console.error('Error getting report:', error)
            throw error
        }
    },

    /**
     * Delete report metadata and file
     */
    deleteReport: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()

        try {
            // Get report metadata first
            const result = db.exec('SELECT file_path FROM reports_metadata WHERE id = ?', [id])
            const reports = execToObjects(result)

            if (reports.length > 0 && reports[0].file_path) {
                // Delete file if it exists
                if (fs.existsSync(reports[0].file_path)) {
                    fs.unlinkSync(reports[0].file_path)
                }
            }

            // Delete metadata
            db.run('DELETE FROM reports_metadata WHERE id = ?', [id])
            persistDatabase()

            return { success: true }
        } catch (error) {
            console.error('Error deleting report:', error)
            throw error
        }
    },

    /**
     * Get reports directory path
     */
    getReportsDirectory: async () => {
        return REPORTS_DIR
    },

    /**
     * Get report statistics
     */
    getReportsStats: async (event: IpcMainInvokeEvent) => {
        const db = getDatabase()

        try {
            const result = db.exec(`
        SELECT 
          report_type,
          COUNT(*) as count,
          SUM(file_size) as total_size
        FROM reports_metadata
        GROUP BY report_type
      `)

            const stats = execToObjects(result)

            const totalResult = db.exec('SELECT COUNT(*) as total FROM reports_metadata')
            const total = totalResult[0]?.values[0]?.[0] || 0

            return {
                by_type: stats,
                total
            }
        } catch (error) {
            console.error('Error getting reports stats:', error)
            throw error
        }
    }
}
