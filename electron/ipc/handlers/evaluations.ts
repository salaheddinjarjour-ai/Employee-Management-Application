import { IpcMainInvokeEvent } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import { logCreate, logUpdate, logDelete } from '../../utils/auditLog'

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

export const evaluationsHandlers = {
    create: async (event: IpcMainInvokeEvent, data: any) => {
        const db = getDatabase()
        try {
            if (!data.employee_id) throw new Error('Employee ID is required')
            const fields = Object.keys(data)
            const placeholders = fields.map(() => '?').join(', ')
            const fieldNames = fields.join(', ')
            const values = fields.map(f => data[f])

            db.run(`
                INSERT INTO evaluations (${fieldNames}, created_at)
                VALUES (${placeholders}, datetime('now'))
            `, values)

            persistDatabase()
            const idRes = db.exec('SELECT last_insert_rowid() as id')
            return { success: true, id: idRes[0].values[0][0] }
        } catch (error) {
            console.error('Error creating evaluation:', error)
            throw error
        }
    },

    list: async (event: IpcMainInvokeEvent, filters?: any) => {
        const db = getDatabase()
        try {
            const query = `
                SELECT ev.*, 
                       e.full_name as employee_name, 
                       e.employee_no as employee_no,
                       e.job_title as employee_job_title,
                       e.department as employee_department,
                       evaluator.full_name as evaluator_name
                FROM evaluations ev
                LEFT JOIN employees e ON ev.employee_id = e.id
                LEFT JOIN employees evaluator ON ev.evaluator_id = evaluator.id
                ORDER BY ev.created_at DESC
            `
            const result = db.exec(query)
            return execToObjects(result)
        } catch (error) {
            console.error('Error listing evaluations:', error)
            throw error
        }
    },

    update: async (event: IpcMainInvokeEvent, id: number, data: any) => {
        const db = getDatabase()
        try {
            const fields = Object.keys(data)
            const sets = fields.map(f => `${f} = ?`).join(', ')
            const values = [...fields.map(f => data[f]), id]

            db.run(`UPDATE evaluations SET ${sets}, updated_at = datetime('now') WHERE id = ?`, values)
            persistDatabase()

            // Log audit
            const currentEval = db.exec(`SELECT employee_id FROM evaluations WHERE id = ${id}`)
            const employeeId = currentEval.length > 0 && currentEval[0].values.length > 0
                ? currentEval[0].values[0][0] as number
                : null

            let empName = 'موظف'
            if (employeeId) {
                const empResult = db.exec(`SELECT full_name FROM employees WHERE id = ${employeeId}`)
                empName = empResult.length > 0 && empResult[0].values.length > 0
                    ? empResult[0].values[0][0] as string
                    : 'موظف'
            }
            logUpdate('evaluation', id, `تقييم ${empName}`, data)

            return { success: true }
        } catch (error) {
            console.error('Error updating evaluation:', error)
            throw error
        }
    },

    delete: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        try {
            db.run(`DELETE FROM evaluations WHERE id = ${id}`)
            persistDatabase()

            // Log audit
            logDelete('evaluation', id, `تقييم رقم ${id}`)

            return { success: true }
        } catch (error) {
            console.error('Error deleting evaluation:', error)
            throw error
        }
    },

    getStats: async (event: IpcMainInvokeEvent) => {
        const db = getDatabase()
        try {
            const stats = db.exec(`
                SELECT 
                    COUNT(*) as total,
                    AVG(overall_score) as avg_score,
                    SUM(CASE WHEN status = 'معتمد' THEN 1 ELSE 0 END) as approved_count,
                    SUM(CASE WHEN rating = 'ممتاز' THEN 1 ELSE 0 END) as excellent_count
                FROM evaluations
            `)

            const dist = db.exec(`
                SELECT rating, COUNT(*) as c 
                FROM evaluations 
                GROUP BY rating
            `)

            return {
                totals: execToObjects(stats)[0] || { total: 0, avg_score: 0, approved_count: 0, excellent_count: 0 },
                dist: execToObjects(dist)
            }
        } catch (error) {
            console.error('Error getting evaluation stats:', error)
            throw error
        }
    }
}
