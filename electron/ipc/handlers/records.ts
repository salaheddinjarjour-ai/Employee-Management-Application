import { IpcMainInvokeEvent } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'

const ENTITY_TABLES: Record<string, string> = {
    employees: 'employees',
    leaves: 'leaves',
    attendance: 'attendance',
    absences: 'absences',
    rewards: 'rewards',
    promotions: 'promotions',
    evaluations: 'evaluations',
    courses: 'courses',
    course_enrollments: 'course_enrollments',
    service_years: 'service_years',
    exchange_rates: 'exchange_rates',
    departments: 'departments',
    units: 'units',
    committees: 'committees'
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

export const recordsHandlers = {
    list: async (event: IpcMainInvokeEvent, entity: string, filters?: any) => {
        const db = getDatabase()
        const table = ENTITY_TABLES[entity]

        if (!table) {
            throw new Error(`Unknown entity: ${entity}`)
        }

        try {
            if (entity === 'employees') {
                const { employeesHandlers } = await import('./employees')
                return employeesHandlers.list(event, filters)
            }

            if (entity === 'courses') {
                const { coursesHandlers } = await import('./courses')
                return coursesHandlers.list(event)
            }

            if (entity === 'service_years') {
                // Special handling for service years calculation
                const result = db.exec(`
                    SELECT 
                        e.id as employee_id,
                        e.id as id,
                        e.full_name as employee_name,
                        COALESCE(e.join_date, e.hire_date) as hire_date
                    FROM employees e
                    WHERE COALESCE(e.employment_status, e.status) = 'active'
                    ORDER BY COALESCE(e.join_date, e.hire_date) ASC
                `)
                const records = execToObjects(result)

                // Calculate derivation in JS since SQLite doesn't have DATEDIFF easily
                return records.map(r => {
                    const hireDate = new Date(r.hire_date)
                    const now = new Date()
                    const diffTime = Math.abs(now.getTime() - hireDate.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    const years = Math.floor(diffDays / 365)
                    const months = Math.floor((diffDays % 365) / 30) // approx

                    const milestones: string[] = []
                    if (years >= 1) milestones.push('سنة واحدة')
                    if (years >= 3) milestones.push('3 سنوات')
                    if (years >= 5) milestones.push('5 سنوات')
                    if (years >= 10) milestones.push('10 سنوات')

                    const benefits: string[] = []
                    if (years >= 1) benefits.push('تأمين صحي أساسي')
                    if (years >= 5) benefits.push('مكافأة الخدمة')

                    return {
                        ...r,
                        years_of_service: years,
                        months_of_service: months,
                        total_days: diffDays,
                        milestones,
                        benefits_eligible: benefits,
                        next_milestone: 'N/A',
                        days_to_next_milestone: 0
                    }
                })
            }

            // Special handling for rewards to include employee name
            if (entity === 'rewards') {
                const result = db.exec(`
                    SELECT 
                        r.*,
                        e.full_name as employee_name
                    FROM rewards r
                    LEFT JOIN employees e ON r.employee_id = e.id
                    ORDER BY r.created_at DESC
                `)
                return execToObjects(result)
            }

            // Special handling for leaves to include employee name via JOIN
            if (entity === 'leaves') {
                const result = db.exec(`
                    SELECT l.*,
                        COALESCE(e.full_name, l.employee_name) AS employee_name
                    FROM leaves l
                    LEFT JOIN employees e ON l.employee_id = e.id
                    ORDER BY l.created_at DESC
                `)
                return execToObjects(result)
            }

            // Special handling for absences to include employee name via JOIN
            if (entity === 'absences') {
                const result = db.exec(`
                    SELECT a.*,
                        COALESCE(e.full_name, a.employee_name) AS employee_name
                    FROM absences a
                    LEFT JOIN employees e ON a.employee_id = e.id
                    ORDER BY a.created_at DESC
                `)
                return execToObjects(result)
            }

            // Special handling for promotions to include employee name via JOIN
            if (entity === 'promotions') {
                const result = db.exec(`
                    SELECT p.*,
                        COALESCE(e.full_name, p.employee_name) AS employee_name
                    FROM promotions p
                    LEFT JOIN employees e ON p.employee_id = e.id
                    ORDER BY p.created_at DESC
                `)
                return execToObjects(result)
            }

            let query = `SELECT * FROM ${table}`
            const params: any[] = []
            const conditions: string[] = []

            // Add filters based on entity type
            if (filters) {
                Object.keys(filters).forEach(key => {
                    if (filters[key] !== undefined && filters[key] !== null) {
                        conditions.push(`${key} = ?`)
                        params.push(filters[key])
                    }
                })
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ')
            }

            query += ' ORDER BY created_at DESC'

            const result = db.exec(query, params)
            return execToObjects(result)
        } catch (error) {
            console.error(`Error listing ${entity}:`, error)
            throw error
        }
    },

    get: async (event: IpcMainInvokeEvent, entity: string, id: number) => {
        const db = getDatabase()
        const table = ENTITY_TABLES[entity]

        if (!table) {
            throw new Error(`Unknown entity: ${entity}`)
        }

        try {
            const result = db.exec(`SELECT * FROM ${table} WHERE id = ?`, [id])
            const records = execToObjects(result)
            return records.length > 0 ? records[0] : null
        } catch (error) {
            console.error(`Error getting ${entity}:`, error)
            throw error
        }
    },

    delete: async (event: IpcMainInvokeEvent, entity: string, id: number) => {
        if (entity === 'employees') {
            const { employeesHandlers } = await import('./employees')
            return employeesHandlers.delete(event, id)
        }
        const db = getDatabase()
        const table = ENTITY_TABLES[entity]

        if (!table) {
            throw new Error(`Unknown entity: ${entity}`)
        }

        try {
            db.run(`DELETE FROM ${table} WHERE id = ${id}`)
            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error(`Error deleting ${entity}:`, error)
            throw error
        }
    },

    create: async (event: IpcMainInvokeEvent, entity: string, data: any) => {
        if (entity === 'employees') {
            const { employeesHandlers } = await import('./employees')
            return employeesHandlers.create(event, data)
        }
        if (entity === 'courses') {
            const { coursesHandlers } = await import('./courses')
            return coursesHandlers.create(data)
        }
        if (entity === 'leaves') {
            const { leavesHandlers } = await import('./leaves')
            return leavesHandlers.create(event, data)
        }
        if (entity === 'absences') {
            const { absencesHandlers } = await import('./absences')
            return absencesHandlers.create(event, data)
        }
        if (entity === 'evaluations') {
            const { evaluationsHandlers } = await import('./evaluations')
            return evaluationsHandlers.create(event, data)
        }
        if (entity === 'promotions') {
            const { promotionsHandlers } = await import('./promotions')
            return promotionsHandlers.create(event, data)
        }
        if (entity === 'operational-plans') {
            const { operationalPlansHandlers } = await import('./operational-plans')
            return operationalPlansHandlers.create(event, data)
        }
        if (entity === 'performance-indicators') {
            const { performanceIndicatorsHandlers } = await import('./operational-plans')
            return performanceIndicatorsHandlers.create(event, data)
        }

        const db = getDatabase()
        const table = ENTITY_TABLES[entity]

        if (!table) {
            throw new Error(`Unknown entity: ${entity}`)
        }

        try {
            const fields = Object.keys(data)
            const placeholders = fields.map(() => '?').join(', ')
            const fieldNames = fields.join(', ')
            const values = fields.map(f => data[f])

            db.run(`
        INSERT INTO ${table} (${fieldNames})
        VALUES (${placeholders})
      `, values)

            persistDatabase()

            const idResult = db.exec('SELECT last_insert_rowid() as id')
            const id = idResult[0].values[0][0]

            return { id, ...data }
        } catch (error) {
            console.error(`Error creating ${entity}:`, error)
            throw error
        }
    },

    update: async (event: IpcMainInvokeEvent, entity: string, id: number, data: any) => {
        if (entity === 'employees') {
            const { employeesHandlers } = await import('./employees')
            return employeesHandlers.update(event, id, data)
        }
        if (entity === 'courses') {
            const { coursesHandlers } = await import('./courses')
            return coursesHandlers.update(event, id, data)
        }
        if (entity === 'operational-plans') {
            const { operationalPlansHandlers } = await import('./operational-plans')
            return operationalPlansHandlers.update(event, id, data)
        }
        if (entity === 'performance-indicators') {
            const { performanceIndicatorsHandlers } = await import('./operational-plans')
            return performanceIndicatorsHandlers.update(event, id, data)
        }
        const db = getDatabase()
        const table = ENTITY_TABLES[entity]

        if (!table) {
            throw new Error(`Unknown entity: ${entity}`)
        }

        try {
            const fields = Object.keys(data).filter(key => key !== 'id')
            const setClause = fields.map(field => `${field} = ?`).join(', ')
            const values = fields.map(f => data[f])
            values.push(id)

            db.run(`
        UPDATE ${table}
        SET ${setClause}, updated_at = datetime('now')
        WHERE id = ?
      `, values)

            persistDatabase()
            return { id, ...data }
        } catch (error) {
            console.error(`Error updating ${entity}:`, error)
            throw error
        }
    },


    getLeavesStats: async () => {
        const db = getDatabase()
        try {
            const result = db.exec(`
                SELECT 
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    COUNT(*) as total
                FROM leaves
            `)
            if (result.length > 0 && result[0].values.length > 0) {
                const row = result[0].values[0]
                return {
                    pending: row[0] || 0,
                    approved: row[1] || 0,
                    rejected: row[2] || 0,
                    total: row[3] || 0
                }
            }
            return { pending: 0, approved: 0, rejected: 0, total: 0 }
        } catch (error) {
            console.error('Error getting leaves stats:', error)
            throw error
        }
    },

    stats: async (event: IpcMainInvokeEvent, entity: string) => {
        const db = getDatabase()
        const table = ENTITY_TABLES[entity]

        if (!table) {
            throw new Error(`Unknown entity: ${entity}`)
        }

        try {
            if (entity === 'rewards') {
                // Get totals and amounts
                const totalsResult = db.exec(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'مدفوع' THEN amount_usd ELSE 0 END) as paid_amount,
                        SUM(CASE WHEN status != 'مدفوع' THEN amount_usd ELSE 0 END) as pending_amount,
                        SUM(CASE WHEN strftime('%Y-%m', reward_date) = strftime('%Y-%m', 'now') THEN 1 ELSE 0 END) as this_month_count
                    FROM rewards
                `)

                // Get distribution by kind
                const distResult = db.exec(`
                    SELECT kind, COUNT(*) as c
                    FROM rewards
                    GROUP BY kind
                `)

                const totals = totalsResult.length > 0 && totalsResult[0].values.length > 0
                    ? {
                        total: totalsResult[0].values[0][0] || 0,
                        paid_amount: totalsResult[0].values[0][1] || 0,
                        pending_amount: totalsResult[0].values[0][2] || 0,
                        this_month_count: totalsResult[0].values[0][3] || 0
                    }
                    : { total: 0, paid_amount: 0, pending_amount: 0, this_month_count: 0 }

                const dist = distResult.length > 0 && distResult[0].values.length > 0
                    ? distResult[0].values.map(row => ({ kind: row[0], c: row[1] }))
                    : []

                return { totals, dist }
            }

            throw new Error(`Stats not implemented for entity: ${entity}`)
        } catch (error) {
            console.error(`Error getting ${entity} stats:`, error)
            throw error
        }
    }
}
