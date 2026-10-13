import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { getDatabase, persistDatabase } from '../database/init'

export function getBackupDir(): string {
    // Use userData per requirements
    const userDataPath = app.getPath('userData')
    const backupPath = path.join(userDataPath, 'backups')

    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true })
    }
    return backupPath
}

export function createBackup(prefix: string = 'backup'): string {
    try {
        // Ensure DB is saved to disk first
        persistDatabase()

        // Get paths
        const userDataPath = app.getPath('userData')
        const dbPath = path.join(userDataPath, 'database', 'hrms.db')
        const backupDir = getBackupDir()

        if (!fs.existsSync(dbPath)) {
            console.warn('No database found to backup at:', dbPath)
            return ''
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `${prefix}_${timestamp}.db`
        const backupPath = path.join(backupDir, filename)

        fs.copyFileSync(dbPath, backupPath)
        console.log(`Backup created at: ${backupPath}`)
        return backupPath
    } catch (error) {
        console.error('Backup failed:', error)
        return ''
    }
}

export function performDailyBackup() {
    const today = new Date().toISOString().split('T')[0]
    const backupDir = getBackupDir()

    // Check if we already have a backup for today (starts with auto_daily_YYYY-MM-DD...)
    const files = fs.readdirSync(backupDir)
    const hasDailyBackup = files.some(f => f.startsWith(`auto_daily_${today}`))

    if (!hasDailyBackup) {
        console.log(' performing daily backup...')
        createBackup(`auto_daily_${today}`)
    } else {
        console.log('Daily backup already exists for today.')
    }
}
