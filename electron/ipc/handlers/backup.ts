import { IpcMainInvokeEvent, dialog, app } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init.ts'
import { isAdmin } from './auth'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(app.getPath('appData'), 'HRMS')
const BACKUPS_DIR = path.join(DATA_DIR, 'backups', 'auto')
const DB_PATH = path.join(DATA_DIR, 'database', 'hrms.db')

export const backupHandlers = {
    create: async (event: IpcMainInvokeEvent, destination?: string) => {
        try {
            // Ensure database is persisted before backup
            persistDatabase()

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
            const backupName = `backup_${timestamp}.db`

            let backupPath: string

            if (destination) {
                // Manual backup to user-selected location
                backupPath = path.join(destination, backupName)
            } else {
                // Auto backup to default location
                backupPath = path.join(BACKUPS_DIR, backupName)
            }

            // Copy database file
            fs.copyFileSync(DB_PATH, backupPath)

            // Clean up old auto backups (keep last 7)
            if (!destination) {
                cleanOldBackups()
            }

            console.log('Backup created:', backupPath)
            return { success: true, path: backupPath }
        } catch (error) {
            console.error('Error creating backup:', error)
            throw error
        }
    },

    createManual: async () => {
        try {
            // Check admin permission
            if (!isAdmin()) {
                throw new Error('Unauthorized: Admin access required')
            }

            // Show folder selection dialog
            const result = await dialog.showOpenDialog({
                title: 'اختر مجلد النسخ الاحتياطي',
                properties: ['openDirectory', 'createDirectory'],
                buttonLabel: 'حفظ النسخة الاحتياطية'
            })

            if (result.canceled || !result.filePaths.length) {
                return {
                    success: false,
                    error: 'تم إلغاء العملية'
                }
            }

            const destinationPath = result.filePaths[0]

            // Persist current database state
            persistDatabase()

            // Create backup filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const backupFileName = `hrms_backup_${timestamp}.db`
            const fullBackupPath = path.join(destinationPath, backupFileName)

            // Copy database file to destination
            fs.copyFileSync(DB_PATH, fullBackupPath)

            return {
                success: true,
                path: fullBackupPath,
                filename: backupFileName
            }
        } catch (error: any) {
            console.error('Manual backup error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    },

    restore: async (event: IpcMainInvokeEvent, filePath: string) => {
        try {
            // Validate backup file exists
            if (!fs.existsSync(filePath)) {
                throw new Error('Backup file not found')
            }

            // Create pre-restore backup
            const preRestoreBackup = path.join(BACKUPS_DIR, `pre-restore_${Date.now()}.db`)
            persistDatabase()
            fs.copyFileSync(DB_PATH, preRestoreBackup)

            // Restore from backup
            fs.copyFileSync(filePath, DB_PATH)

            console.log('Database restored from:', filePath)

            // App will need to restart
            return { success: true, requiresRestart: true }
        } catch (error) {
            console.error('Error restoring backup:', error)
            throw error
        }
    }
}

function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUPS_DIR)
            .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
            .map(f => ({
                name: f,
                path: path.join(BACKUPS_DIR, f),
                time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time)

        // Keep only last 7 backups
        files.slice(7).forEach(file => {
            fs.unlinkSync(file.path)
            console.log('Deleted old backup:', file.name)
        })
    } catch (error) {
        console.error('Error cleaning old backups:', error)
    }
}
