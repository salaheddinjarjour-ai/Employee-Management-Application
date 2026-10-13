import { IpcMainInvokeEvent } from 'electron'
import { getDatabase } from '../../database/init'
import { getRecentAuditLogs } from '../../utils/auditLog'

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

export const dashboardHandlers = {
    getSummary: async (event: IpcMainInvokeEvent, period?: string) => {
        const db = getDatabase()

        try {
            // Total employees
            const totalEmployeesResult = db.exec(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE deleted_at IS NULL AND employment_status = 'active'
      `)
            const totalEmployees = totalEmployeesResult[0].values[0][0]

            // Total departments
            const totalDepartmentsResult = db.exec(`
        SELECT COUNT(DISTINCT department) as count 
        FROM employees 
        WHERE deleted_at IS NULL AND department IS NOT NULL
      `)
            const totalDepartments = totalDepartmentsResult[0].values[0][0]

            // Recent hires (last 30 days)
            const recentHiresResult = db.exec(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE deleted_at IS NULL 
        AND date(join_date) >= date('now', '-30 days')
      `)
            const recentHires = recentHiresResult[0].values[0][0]

            // Pending leaves
            const pendingLeavesResult = db.exec(`
        SELECT COUNT(*) as count 
        FROM leaves 
        WHERE status = 'pending'
      `)
            const pendingLeaves = pendingLeavesResult[0].values[0][0]

            // Current month payroll count
            const currentMonth = new Date().toISOString().slice(0, 7)
            const payrollCountResult = db.exec(`
        SELECT COUNT(*) as count 
        FROM payroll_headers 
        WHERE period = '${currentMonth}'
      `)
            const payrollCount = payrollCountResult[0].values[0][0]

            // Exchange rate (latest)
            let exchange = null
            try {
                const exchangeResult = db.exec(`
                    SELECT rate, effective_date 
                    FROM exchange_rates 
                    WHERE is_active = 1
                    LIMIT 1
                `)
                if (exchangeResult.length > 0 && exchangeResult[0].values.length > 0) {
                    const row = exchangeResult[0].values[0]
                    exchange = {
                        rate: row[0],
                        effective_at: row[1]
                    }
                }
            } catch (e) {
                // table might not exist
            }

            // Payroll stats for the requested period
            // Handle both string and object format from frontend
            const targetPeriod = (typeof period === 'object' && period !== null && 'period' in period)
                ? (period as any).period
                : (period || new Date().toISOString().slice(0, 7))

            let payrollStats = { total_try: 0, total_usd: 0, avg_try: 0, avg_usd: 0 }

            try {
                console.log('[Dashboard] Calculating payroll stats for period:', targetPeriod)

                // First check if there are ANY payroll records
                const allPayrollResult = db.exec(`SELECT COUNT(*) as total FROM payroll_headers`)
                console.log('[Dashboard] Total payroll records in database:', allPayrollResult[0]?.values[0]?.[0])

                // Check what periods exist
                const periodsResult = db.exec(`SELECT DISTINCT period FROM payroll_headers ORDER BY period DESC LIMIT 5`)
                console.log('[Dashboard] Available periods:', periodsResult[0]?.values || [])

                // Calculate totals and averages - use COALESCE to convert NULL to 0
                const payrollResult = db.exec(`
                    SELECT 
                        count(*) as count,
                        COALESCE(sum(net_salary), 0) as sum_try,
                        COALESCE(sum(net_salary_usd), 0) as sum_usd,
                        COALESCE(avg(net_salary), 0) as avg_try,
                        COALESCE(avg(net_salary_usd), 0) as avg_usd
                    FROM payroll_headers
                    WHERE period = '${targetPeriod}'
                `)

                console.log('[Dashboard] Payroll query result:', payrollResult)

                if (payrollResult.length > 0 && payrollResult[0].values.length > 0) {
                    const row = payrollResult[0].values[0]
                    const count = row[0] as number

                    console.log('[Dashboard] Payroll count:', count)
                    console.log('[Dashboard] Raw values:', row)

                    // Always set stats if there are records, even if totals are 0
                    if (count > 0) {
                        payrollStats = {
                            total_try: (row[1] as number) || 0,
                            total_usd: (row[2] as number) || 0,
                            avg_try: (row[3] as number) || 0,
                            avg_usd: (row[4] as number) || 0
                        }
                        console.log('[Dashboard] Payroll stats:', payrollStats)
                    } else {
                        console.log('[Dashboard] No payroll records found for period:', targetPeriod)
                    }
                }
            } catch (err) {
                console.error('Error calculating payroll stats:', err)
            }

            // Evaluations stats
            let evaluationsStats = { completed: 0, assigned: 0, percent: 0 }
            try {
                console.log('[Dashboard] Calculating evaluations stats...')

                // First check what statuses exist
                const statusCheck = db.exec(`SELECT DISTINCT status FROM evaluations WHERE deleted_at IS NULL`)
                console.log('[Dashboard] Available evaluation statuses:', statusCheck[0]?.values || [])

                const evalResult = db.exec(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'معتمد' THEN 1 ELSE 0 END) as completed
                    FROM evaluations
                    WHERE deleted_at IS NULL
                `)

                console.log('[Dashboard] Evaluations query result:', evalResult)

                if (evalResult.length > 0 && evalResult[0].values.length > 0) {
                    const row = evalResult[0].values[0]
                    const total = row[0] as number
                    const completed = row[1] as number

                    console.log('[Dashboard] Total evaluations:', total, 'Completed:', completed)

                    evaluationsStats = {
                        completed: completed,
                        assigned: total,
                        percent: total > 0 ? Math.round((completed / total) * 100) : 0
                    }

                    console.log('[Dashboard] Evaluations stats:', evaluationsStats)
                }
            } catch (err) {
                console.error('Error calculating evaluations stats:', err)
            }

            // Recent activities from audit logs
            let recentActivities: any[] = []
            try {
                console.log('[Dashboard] Fetching recent audit logs...')
                const logs = getRecentAuditLogs(15)

                // Map to include both old format (kind/message) and new format (entity_type/description)
                // for backward compatibility with frontend
                // Also convert SQLite datetime to ISO 8601 format for proper JavaScript parsing
                recentActivities = logs.map(log => ({
                    ...log,
                    kind: log.entity_type,  // Map entity_type to kind for old frontend
                    message: log.description,  // Map description to message for old frontend
                    created_at: log.created_at ? log.created_at.replace(' ', 'T') + 'Z' : new Date().toISOString()  // Convert "2026-01-19 22:57:44" to "2026-01-19T22:57:44Z"
                }))

                console.log('[Dashboard] Got', recentActivities.length, 'audit log entries')
                console.log('[Dashboard] Recent activities:', JSON.stringify(recentActivities, null, 2))
            } catch (err) {
                console.error('Error fetching audit logs:', err)
                recentActivities = []
            }

            // Absences stats for the current period
            let absencesStats = { total: 0, finesTRY: 0, finesUSD: 0 }
            try {
                const absResult = db.exec(`
                    SELECT
                        COUNT(*) as total,
                        COALESCE(SUM(CASE WHEN fine_currency = 'TRY' OR fine_currency IS NULL THEN COALESCE(fine_amount, 0) ELSE 0 END), 0) as fines_try,
                        COALESCE(SUM(CASE WHEN fine_currency = 'USD' THEN COALESCE(fine_amount, 0) ELSE 0 END), 0) as fines_usd
                    FROM absences
                    WHERE strftime('%Y-%m', from_date) = '${targetPeriod}'
                `)
                if (absResult.length > 0 && absResult[0].values.length > 0) {
                    const row = absResult[0].values[0]
                    absencesStats = { total: Number(row[0]) || 0, finesTRY: Number(row[1]) || 0, finesUSD: Number(row[2]) || 0 }
                }
            } catch (e) { /* table might not exist */ }

            // Leaves stats
            let leavesStats = { pending: Number(pendingLeaves) || 0, total: 0 }
            try {
                const totalLeavesResult = db.exec(`SELECT COUNT(*) FROM leaves WHERE strftime('%Y-%m', from_date) = '${targetPeriod}' AND deleted_at IS NULL`)
                if (totalLeavesResult.length > 0 && totalLeavesResult[0].values.length > 0) {
                    leavesStats.total = Number(totalLeavesResult[0].values[0][0]) || 0
                }
            } catch (e) { /* table might not exist */ }

            const dashboardData = {
                period: targetPeriod,
                totals: {
                    sum_try: payrollStats.total_try,
                    sum_usd: payrollStats.total_usd
                },
                employeeCount: totalEmployees,
                avg: {
                    avg_usd: Math.round(payrollStats.avg_usd),
                    avg_try: Math.round(payrollStats.avg_try)
                },
                evaluations: evaluationsStats,
                exchange: exchange,
                absences: absencesStats,
                leaves: leavesStats,
                recent: recentActivities
            }

            console.log('[Dashboard] Returning data:', JSON.stringify(dashboardData, null, 2))

            return {
                ok: true,
                data: dashboardData,
                reasons: []
            }
        } catch (error) {
            console.error('Error getting dashboard summary:', error)
            throw error
        }
    }
}
