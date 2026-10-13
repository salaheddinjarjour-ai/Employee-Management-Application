import { IpcMainInvokeEvent, shell } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const UPLOADS_DIR = path.join(app.getPath('userData'), 'uploads')
const ATTACHMENTS_DIR = path.join(UPLOADS_DIR, 'attachments')

// Ensure directory exists
if (!fs.existsSync(ATTACHMENTS_DIR)) {
    fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true })
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

export const attachmentHandlers = {
    list: async (event: IpcMainInvokeEvent, entityType: string, entityId: number) => {
        const db = getDatabase()
        try {
            const res = db.exec(`SELECT * FROM attachments WHERE entity_type = '${entityType}' AND entity_id = ${entityId} AND deleted_at IS NULL`)
            return execToObjects(res)
        } catch (error) {
            console.error('Error listing attachments:', error)
            // If table doesn't exist yet, return empty
            return []
        }
    },

    save: async (event: IpcMainInvokeEvent, data: { entityType: string, entityId: number, fileName: string, filePath: string, size: number }) => {
        const db = getDatabase()
        try {
            console.log('[Attachments] Save called with data:', JSON.stringify(data, null, 2))
            console.log('[Attachments] filePath type:', typeof data.filePath)
            console.log('[Attachments] filePath value:', data.filePath)

            // Validate filePath
            if (!data.filePath || typeof data.filePath !== 'string') {
                console.error('[Attachments] Invalid filePath - data received:', data)
                throw new Error('File path is required and must be a valid string')
            }

            if (!fs.existsSync(data.filePath)) {
                throw new Error(`Source file does not exist: ${data.filePath}`)
            }

            const ext = path.extname(data.fileName)
            const safeName = `${data.entityType}_${data.entityId}_${Date.now()}${ext}`
            const destPath = path.join(ATTACHMENTS_DIR, safeName)

            fs.copyFileSync(data.filePath, destPath)

            // Get file type/MIME type
            const mimeType = ext.toLowerCase().replace('.', '')

            db.run(`
                INSERT INTO attachments (entity_type, entity_id, file_name, file_path, file_type, file_size, uploaded_at)
                VALUES ('${data.entityType}', ${data.entityId}, '${data.fileName.replace(/'/g, "''")}', '${safeName}', '${mimeType}', ${data.size}, datetime('now'))
            `)
            persistDatabase()

            return { success: true, fileName: safeName }
        } catch (error) {
            console.error('Error saving attachment:', error)
            throw error
        }
    },

    delete: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            const res = db.exec(`SELECT file_path FROM attachments WHERE id = ${id}`)
            if (res.length > 0) {
                const attachment = execToObjects(res)[0]
                const filePath = path.join(ATTACHMENTS_DIR, attachment.file_path)
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                }
            }
            db.run(`DELETE FROM attachments WHERE id = ${id}`)
            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error deleting attachment:', error)
            throw error
        }
    },

    open: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            console.log('[Attachments] Opening attachment with id:', id)

            const res = db.exec(`SELECT * FROM attachments WHERE id = ${id}`)
            console.log('[Attachments] Query result:', res)

            if (res.length > 0 && res[0].values.length > 0) {
                const attachments = execToObjects(res)
                console.log('[Attachments] Parsed attachment:', attachments[0])

                const attachment = attachments[0]

                // Get the file path - could be in file_path or attachment_path column
                const fileName = attachment.file_path || attachment.attachment_path

                if (!fileName) {
                    console.error('[Attachments] No file path found in attachment record')
                    return { success: false, error: 'File path not found in database' }
                }

                const filePath = path.join(ATTACHMENTS_DIR, fileName)
                console.log('[Attachments] Full file path:', filePath)

                // Check if file exists
                if (!fs.existsSync(filePath)) {
                    console.error('[Attachments] File does not exist:', filePath)
                    return { success: false, error: 'File not found on disk' }
                }

                // Open the file with the default application
                const result = await shell.openPath(filePath)

                if (result) {
                    console.error('[Attachments] Error opening file:', result)
                    return { success: false, error: result }
                }

                console.log('[Attachments] File opened successfully')
                return { success: true }
            }

            console.error('[Attachments] No attachment found with id:', id)
            return { success: false, error: 'Attachment not found in database' }
        } catch (error) {
            console.error('[Attachments] Error opening attachment:', error)
            return { success: false, error: String(error) }
        }
    }
}
