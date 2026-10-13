import { IpcMainInvokeEvent } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import { logCreate, logUpdate, logDelete, logApprove, logReject } from '../../utils/auditLog'

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

export const leavesHandlers = {
    list: async (event: IpcMainInvokeEvent, filters?: any) => {
        const db = getDatabase()
        try {
            let query = `
                SELECT l.*, e.full_name as employee_name 
                FROM leaves l
                LEFT JOIN employees e ON l.employee_id = e.id
                WHERE 1=1
            `
            const params: any[] = []

            if (filters?.employeeId) {
                query += ' AND l.employee_id = ?'
                params.push(filters.employeeId)
            }

            query += ' ORDER BY l.from_date DESC'

            const result = db.exec(query, params)
            return execToObjects(result)
        } catch (error) {
            console.error('Error listing leaves:', error)
            throw error
        }
    },

    create: async (event: IpcMainInvokeEvent, data: any) => {
        const db = getDatabase()
        try {
            // Validation
            if (!data.employee_id) throw new Error('Employee ID is required')
            if (!data.leave_type) throw new Error('Leave type is required')
            if (!data.from_date || !data.to_date) throw new Error('Date range is required')

            db.run(`
                INSERT INTO leaves (
                    employee_id, leave_type, 
                    from_date, to_date, days_count, 
                    reason, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `, [
                data.employee_id,
                data.leave_type,
                data.from_date,
                data.to_date,
                data.days_count || 1,
                data.reason || null,
                data.status || 'pending'
            ])

            persistDatabase()
            const idRes = db.exec('SELECT last_insert_rowid() as id')
            return { success: true, id: idRes[0].values[0][0] }
        } catch (error) {
            console.error('Error creating leave:', error)
            throw error
        }
    },

    update: async (event: IpcMainInvokeEvent, data: any) => {
        const db = getDatabase()
        try {
            const { id, ...updates } = data
            if (!id) throw new Error('Leave ID is required for update')

            const fields = Object.keys(updates)
            const setClause = fields.map(f => `${f} = ?`).join(', ')
            const values = fields.map(f => updates[f])
            values.push(id)

            db.run(`
                UPDATE leaves 
                SET ${setClause}, updated_at = datetime('now')
                WHERE id = ?
            `, values)

            persistDatabase()

            // Log audit
            const empResult = db.exec(`SELECT full_name FROM employees WHERE id = (SELECT employee_id FROM leaves WHERE id = ${id})`)
            const empName = empResult.length > 0 && empResult[0].values.length > 0
                ? empResult[0].values[0][0] as string
                : 'موظف'

            if (data.status === 'approved') {
                logApprove('leave', id, `إجازة ${empName}`)
            } else if (data.status === 'rejected') {
                logReject('leave', id, `إجازة ${empName}`)
            } else {
                logUpdate('leave', id, `إجازة ${empName}`, undefined, data)
            }

            return { success: true }
        } catch (error) {
            console.error('Error updating leave:', error)
            throw error
        }
    },

    delete: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            db.run(`DELETE FROM leaves WHERE id = ${id}`)
            persistDatabase()

            // Log audit
            logDelete('leave', id, `إجازة رقم ${id}`)

            return { success: true }
        } catch (error) {
            console.error('Error deleting leave:', error)
            throw error
        }
    },

    getStats: async () => {
        const db = getDatabase()
        try {
            const totalsRes = db.exec(`
                SELECT 
                    SUM(CASE WHEN status = 'في الانتظار' OR status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'معتمد' OR status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'مرفوض' OR status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    COUNT(*) as total
                FROM leaves
            `)

            let totals = { pending: 0, approved: 0, rejected: 0, total: 0 }
            if (totalsRes.length > 0 && totalsRes[0].values.length > 0) {
                const row = totalsRes[0].values[0]
                totals = {
                    pending: row[0] as any || 0,
                    approved: row[1] as any || 0,
                    rejected: row[2] as any || 0,
                    total: row[3] as any || 0
                }
            }

            const byTypeRes = db.exec(`
                SELECT leave_type as type, COUNT(*) as c
                FROM leaves
                GROUP BY leave_type
            `)
            const byType = execToObjects(byTypeRes)

            const recentRes = db.exec(`
                SELECT l.*, e.full_name as employee_name
                FROM leaves l
                LEFT JOIN employees e ON l.employee_id = e.id
                ORDER BY l.created_at DESC
                LIMIT 5
            `)
            const recent = execToObjects(recentRes)

            return { totals, byType, recent }
        } catch (e) {
            console.error('Error getting leave stats:', e)
            return {
                totals: { pending: 0, approved: 0, rejected: 0, total: 0 },
                byType: [],
                recent: []
            }
        }
    },

    listTypes: async (event: IpcMainInvokeEvent) => {
        const db = getDatabase()
        try {
            const result = db.exec("SELECT id, name FROM leave_types WHERE is_active = 1 ORDER BY id")
            return execToObjects(result)
        } catch (e) {
            console.error('Error listing leave types:', e)
            return ['سنوية', 'مرضية', 'طارئة', 'بدون راتب', 'أمومة', 'أبوة', 'أخرى'].map((name, id) => ({ id, name }))
        }
    },

    createType: async (event: IpcMainInvokeEvent, data: any) => {
        const db = getDatabase()
        try {
            db.run("INSERT INTO leave_types (name) VALUES (?)", [data.name])
            persistDatabase()
            return { success: true }
        } catch (e: any) {
            if (e.message?.includes('UNIQUE')) throw new Error('هذا النوع موجود مسبقاً')
            throw e
        }
    },

    deleteType: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            db.run("DELETE FROM leave_types WHERE id = ?", [id])
            persistDatabase()
            return { success: true }
        } catch (e) {
            console.error('Error deleting leave type:', e)
            throw e
        }
    },

    listStatuses: async (event: IpcMainInvokeEvent) => {
        const db = getDatabase()
        try {
            const result = db.exec("SELECT id, name FROM leave_statuses WHERE is_active = 1 ORDER BY id")
            return execToObjects(result)
        } catch (e) {
            console.error('Error listing leave statuses:', e)
            return ['في الانتظار', 'معتمد', 'مرفوض'].map((name, id) => ({ id, name }))
        }
    },

    createStatus: async (event: IpcMainInvokeEvent, data: any) => {
        const db = getDatabase()
        try {
            db.run("INSERT INTO leave_statuses (name) VALUES (?)", [data.name])
            persistDatabase()
            return { success: true }
        } catch (e: any) {
            if (e.message?.includes('UNIQUE')) throw new Error('هذه الحالة موجودة مسبقاً')
            throw e
        }
    },

    deleteStatus: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            db.run("DELETE FROM leave_statuses WHERE id = ?", [id])
            persistDatabase()
            return { success: true }
        } catch (e) {
            console.error('Error deleting leave status:', e)
            throw e
        }
    }
}
