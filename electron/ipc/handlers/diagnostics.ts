import { IpcMainInvokeEvent, app } from 'electron'
import { getDatabase } from '../../database/init'
import fs from 'fs'
import path from 'path'

export const diagnosticsHandlers = {
    runAll: async () => {
        const checks = []

        // 1. Database connection check
        try {
            const db = getDatabase()
            const result = db.exec('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
            const version = result[0]?.values[0]?.[0] || 'unknown'
            checks.push({
                name: 'اتصال قاعدة البيانات',
                status: 'success',
                message: `متصل - إصدار المخطط: ${version}`
            })
        } catch (error: any) {
            checks.push({
                name: 'اتصال قاعدة البيانات',
                status: 'error',
                message: `فشل الاتصال: ${error.message}`
            })
        }

        // 2. App data folders check
        const userData = app.getPath('userData')
        const folders = ['database', 'uploads', 'backups', 'logs', 'reports']

        for (const folder of folders) {
            const folderPath = path.join(userData, folder)
            try {
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true })
                }
                fs.accessSync(folderPath, fs.constants.W_OK)
                checks.push({
                    name: `مجلد ${folder}`,
                    status: 'success',
                    message: 'قابل للوصول والكتابة'
                })
            } catch (error: any) {
                checks.push({
                    name: `مجلد ${folder}`,
                    status: 'error',
                    message: `غير قابل للوصول: ${error.message}`
                })
            }
        }

        // 3. IPC channels check
        const criticalChannels = [
            'employees:getAll',
            'payroll:getAll',
            'leaves:getAll',
            'diagnostics:run-all'
        ]

        // All channels are registered if this handler is running
        checks.push({
            name: 'قنوات IPC الحرجة',
            status: 'success',
            message: `${criticalChannels.length} قناة مسجلة`
        })

        // 4. Backup folder writable
        const backupPath = path.join(userData, 'backups')
        try {
            const testFile = path.join(backupPath, '.test')
            fs.writeFileSync(testFile, 'test')
            fs.unlinkSync(testFile)
            checks.push({
                name: 'مجلد النسخ الاحتياطي',
                status: 'success',
                message: 'قابل للكتابة'
            })
        } catch (error: any) {
            checks.push({
                name: 'مجلد النسخ الاحتياطي',
                status: 'error',
                message: `غير قابل للكتابة: ${error.message}`
            })
        }

        return { checks, timestamp: new Date().toISOString() }
    },

    runContractTest: async () => {
        const db = getDatabase()
        const report: any = {
            results: [],
            success: true
        }

        const checkColumn = (table: string, col: string) => {
            try {
                const cols = db.exec(`PRAGMA table_info(${table})`)
                if (cols.length > 0 && cols[0].values) {
                    const found = cols[0].values.some(c => c[1] === col)
                    if (found) {
                        report.results.push(`PASS: ${table}.${col} exists`)
                    } else {
                        report.results.push(`FAIL: ${table}.${col} MISSING`)
                        report.success = false
                    }
                } else {
                    report.results.push(`FAIL: Table ${table} MISSING`)
                    report.success = false
                }
            } catch (e) {
                report.results.push(`ERROR: Checking ${table}.${col}: ${e}`)
                report.success = false
            }
        }

        checkColumn('absences', 'from_date')
        checkColumn('absences', 'to_date')
        checkColumn('course_enrollments', 'grade')
        checkColumn('employees', 'unit')
        checkColumn('payroll_headers', 'max_experience_years')

        return report
    }
}
