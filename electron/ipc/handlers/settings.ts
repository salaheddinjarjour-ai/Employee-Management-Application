import { IpcMainInvokeEvent } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init.ts'

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

export const settingsHandlers = {
    get: async (event: IpcMainInvokeEvent) => {
        const db = getDatabase()

        try {
            const result = db.exec('SELECT key, value FROM settings')
            const rows = execToObjects(result)

            const settings: Record<string, any> = {}
            rows.forEach(row => {
                try {
                    settings[row.key] = JSON.parse(row.value)
                } catch {
                    settings[row.key] = row.value
                }
            })

            return settings
        } catch (error) {
            console.error('Error getting settings:', error)
            return {}
        }
    },

    save: async (event: IpcMainInvokeEvent, settings: Record<string, any>) => {
        const db = getDatabase()

        try {
            Object.entries(settings).forEach(([key, value]) => {
                const jsonValue = typeof value === 'string' ? value : JSON.stringify(value)

                // Check if key exists
                const existsResult = db.exec('SELECT key FROM settings WHERE key = ?', [key])

                if (existsResult.length > 0 && existsResult[0].values.length > 0) {
                    // Update
                    db.run(`
            UPDATE settings 
            SET value = ?, updated_at = datetime('now')
            WHERE key = ?
          `, [jsonValue, key])
                } else {
                    // Insert
                    db.run(`
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
          `, [key, jsonValue])
                }
            })

            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error saving settings:', error)
            throw error
        }
    }
}
