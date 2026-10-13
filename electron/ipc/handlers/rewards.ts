import { IpcMainInvokeEvent } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'

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

export const rewardsHandlers = {
    listTypes: async (_event: IpcMainInvokeEvent) => {
        const db = getDatabase()
        try {
            const result = db.exec("SELECT id, name FROM reward_types WHERE is_active = 1 ORDER BY id")
            return execToObjects(result)
        } catch (e) {
            console.error('Error listing reward types:', e)
            return ['مكافأة', 'تقدير', 'إنجاز', 'ابتكار', 'خاص'].map((name, id) => ({ id, name }))
        }
    },

    createType: async (_event: IpcMainInvokeEvent, data: any) => {
        const db = getDatabase()
        try {
            db.run("INSERT INTO reward_types (name) VALUES (?)", [data.name])
            persistDatabase()
            return { success: true }
        } catch (e: any) {
            if (e.message?.includes('UNIQUE')) throw new Error('هذا النوع موجود مسبقاً')
            throw e
        }
    },

    deleteType: async (_event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            db.run("DELETE FROM reward_types WHERE id = ?", [id])
            persistDatabase()
            return { success: true }
        } catch (e) {
            console.error('Error deleting reward type:', e)
            throw e
        }
    },

    listStatuses: async (_event: IpcMainInvokeEvent) => {
        const db = getDatabase()
        try {
            const result = db.exec("SELECT id, name FROM reward_statuses WHERE is_active = 1 ORDER BY id")
            return execToObjects(result)
        } catch (e) {
            console.error('Error listing reward statuses:', e)
            return ['مدفوع', 'في الانتظار', 'معتمد'].map((name, id) => ({ id, name }))
        }
    },

    createStatus: async (_event: IpcMainInvokeEvent, data: any) => {
        const db = getDatabase()
        try {
            db.run("INSERT INTO reward_statuses (name) VALUES (?)", [data.name])
            persistDatabase()
            return { success: true }
        } catch (e: any) {
            if (e.message?.includes('UNIQUE')) throw new Error('هذه الحالة موجودة مسبقاً')
            throw e
        }
    },

    deleteStatus: async (_event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            db.run("DELETE FROM reward_statuses WHERE id = ?", [id])
            persistDatabase()
            return { success: true }
        } catch (e) {
            console.error('Error deleting reward status:', e)
            throw e
        }
    },

    syncToPayroll: async (_event: IpcMainInvokeEvent, rewardId: number) => {
        const db = getDatabase()
        try {
            // Get reward details
            const rewardRes = db.exec(`
                SELECT r.*, e.full_name as employee_name
                FROM rewards r
                LEFT JOIN employees e ON r.employee_id = e.id
                WHERE r.id = ?
            `, [rewardId])
            if (rewardRes.length === 0 || rewardRes[0].values.length === 0) {
                throw new Error('المكافأة غير موجودة')
            }
            const reward = execToObjects(rewardRes)[0]

            if (!reward.amount_usd || Number(reward.amount_usd) === 0) {
                throw new Error('لا يمكن إضافة مكافأة بمبلغ صفر إلى الراتب')
            }

            if (reward.payroll_synced) {
                throw new Error('تم إضافة هذه المكافأة إلى الراتب مسبقاً')
            }

            // Determine target payroll month (next month if not specified)
            let targetPeriod = reward.payroll_month
            if (!targetPeriod) {
                const now = new Date()
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                targetPeriod = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
            }

            // Find existing payroll header for this employee + period
            const headerRes = db.exec(
                `SELECT id FROM payroll_headers WHERE employee_id = ? AND period = ?`,
                [reward.employee_id, targetPeriod]
            )

            let headerId: number
            if (headerRes.length > 0 && headerRes[0].values.length > 0) {
                headerId = headerRes[0].values[0][0] as number
            } else {
                // Create a minimal payroll header so the line has a home
                db.run(`
                    INSERT INTO payroll_headers (employee_id, period, base_min, base_min_currency, years_of_exp, experience_allowance_amount, experience_allowance_currency, created_at, updated_at)
                    VALUES (?, ?, 0, 'TRY', 0, 0, 'TRY', datetime('now'), datetime('now'))
                `, [reward.employee_id, targetPeriod])
                const newHeaderRes = db.exec('SELECT last_insert_rowid() as id')
                headerId = newHeaderRes[0].values[0][0] as number
            }

            // Insert payroll line for the reward (as a one-time exception/allowance)
            const currency = reward.reward_currency || 'USD'
            const label = reward.title || 'مكافأة'
            db.run(`
                INSERT INTO payroll_lines (header_id, category, label, currency, amount, sort_order, created_at)
                VALUES (?, 'exception', ?, ?, ?, 99, datetime('now'))
            `, [headerId, label, currency, Number(reward.amount_usd)])

            // Mark reward as synced
            db.run(`UPDATE rewards SET payroll_synced = 1, status = 'مدفوع', updated_at = datetime('now') WHERE id = ?`, [rewardId])

            persistDatabase()
            return { success: true, period: targetPeriod }
        } catch (e) {
            console.error('Error syncing reward to payroll:', e)
            throw e
        }
    },
}
