import { IpcMainInvokeEvent } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import { logCreate, logUpdate, logDelete } from '../../utils/auditLog'
import { computeTotals } from '../../util/payrollCalc'

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

export const payrollHandlers = {
    get: async (event: IpcMainInvokeEvent, employeeId: number, period: string) => {
        const db = getDatabase()
        try {
            const headerResult = db.exec(`
        SELECT * FROM payroll_headers 
        WHERE employee_id = ? AND period = ?
      `, [employeeId, period])

            if (headerResult.length === 0) return null

            const headers = execToObjects(headerResult)
            const header = headers[0]

            const linesResult = db.exec(`
        SELECT * FROM payroll_lines 
        WHERE header_id = ?
        ORDER BY sort_order ASC
      `, [header.id])

            const lines = execToObjects(linesResult)

            return { header, lines }
        } catch (error) {
            console.error('Error getting payroll:', error)
            throw error
        }
    },

    delete: async (event: IpcMainInvokeEvent, id: number) => {
        const db = getDatabase()
        const numId = Number(id)
        try {
            // Lines deleted via cascade if configured? 
            // SQLite safe: delete lines first then header manually to be sure
            db.run('DELETE FROM payroll_lines WHERE header_id = ?', [numId])
            db.run('DELETE FROM payroll_headers WHERE id = ?', [numId])
            persistDatabase()

            // Log audit
            logDelete('payroll', numId, `راتب رقم ${numId}`)

            return { success: true }
        } catch (error) {
            console.error('[Payroll:Delete] Error:', error)
            throw error
        }
    },

    save: async (event: IpcMainInvokeEvent, data: any) => {
        console.log('[Payroll:Save] Handler called', JSON.stringify(data, null, 2))
        const db = getDatabase()
        try {
            const { header, lines, salaryModel, experienceRateTRY } = data

            // Fallback mappings if header is incomplete but salaryModel is present
            if (salaryModel) {
                if (header.base_min_currency === undefined) header.base_min_currency = salaryModel.minBaseCurrency
                if (header.experience_allowance_currency === undefined) header.experience_allowance_currency = salaryModel.experienceAllowanceCurrency
                if (header.experience_allowance_amount === undefined) header.experience_allowance_amount = salaryModel.experienceAllowanceAmount
            }

            // Calculate net salary totals
            const totals = computeTotals(header, lines, experienceRateTRY)
            const netSalaryTRY = totals.net.TRY || 0
            const netSalaryUSD = totals.net.USD || 0

            // Check if header exists
            const existingResult = db.exec(
                'SELECT id FROM payroll_headers WHERE employee_id = ? AND period = ?',
                [header.employee_id, header.period]
            )

            let headerId: number

            const s = (val: any) => val === undefined ? null : val

            if (existingResult.length > 0 && existingResult[0].values.length > 0) {
                // Update existing header
                headerId = existingResult[0].values[0][0] as number

                db.run(`
          UPDATE payroll_headers SET
            id_number = ?, start_date = ?, admin_level = ?, job_title = ?,
            edu_actual = ?, edu_required = ?, base_min = ?, base_min_currency = ?,
            years_of_exp = ?, experience_allowance_amount = ?, 
            experience_allowance_currency = ?, notes = ?, 
            net_salary = ?, net_salary_usd = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [
                    s(header.id_number), s(header.start_date), s(header.admin_level), s(header.job_title),
                    s(header.edu_actual), s(header.edu_required), s(header.base_min), s(header.base_min_currency),
                    s(header.years_of_exp), s(header.experience_allowance_amount),
                    s(header.experience_allowance_currency), s(header.notes),
                    netSalaryTRY, netSalaryUSD, headerId
                ])
            } else {
                // Insert new header
                db.run(`
          INSERT INTO payroll_headers (
            employee_id, period, id_number, start_date, admin_level, job_title,
            edu_actual, edu_required, base_min, base_min_currency, years_of_exp,
            experience_allowance_amount, experience_allowance_currency, notes,
            net_salary, net_salary_usd
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    s(header.employee_id), s(header.period), s(header.id_number), s(header.start_date),
                    s(header.admin_level), s(header.job_title), s(header.edu_actual), s(header.edu_required),
                    s(header.base_min), s(header.base_min_currency), s(header.years_of_exp),
                    s(header.experience_allowance_amount), s(header.experience_allowance_currency),
                    s(header.notes), netSalaryTRY, netSalaryUSD
                ])

                const idResult = db.exec('SELECT last_insert_rowid() as id')
                headerId = idResult[0].values[0][0] as number
            }

            // Delete existing lines
            db.run('DELETE FROM payroll_lines WHERE header_id = ?', [headerId])

            // Insert new lines
            lines.forEach((line: any, index: number) => {
                db.run(`
          INSERT INTO payroll_lines (header_id, category, label, currency, amount, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [headerId, s(line.category), s(line.label), s(line.currency), s(line.amount), index])
            })

            persistDatabase()

            // Log audit
            const empResult = db.exec(`SELECT full_name FROM employees WHERE id = ${header.employee_id}`)
            const empName = empResult.length > 0 && empResult[0].values.length > 0
                ? empResult[0].values[0][0] as string
                : 'موظف'
            logCreate('payroll', headerId as number, `راتب ${empName} - ${header.period}`, { header, lines })

            return { success: true, id: headerId }
        } catch (error) {
            console.error('[Payroll:Save] Error:', error)
            throw error
        }
    },

    listByMonth: async (event: IpcMainInvokeEvent, period: string) => {
        const db = getDatabase()
        const isAll = period === 'all'
        try {
            const headersResult = db.exec(`
        SELECT ph.*, e.full_name as employee_name
        FROM payroll_headers ph
        LEFT JOIN employees e ON e.id = ph.employee_id
        ${isAll ? '' : 'WHERE ph.period = ?'}
        ORDER BY ph.period DESC, e.full_name ASC
      `, isAll ? [] : [period])

            const headers = execToObjects(headersResult)

            const payrolls = headers.map((header: any) => {
                const linesResult = db.exec(`
          SELECT * FROM payroll_lines
          WHERE header_id = ?
          ORDER BY sort_order ASC
        `, [header.id])

                const lines = execToObjects(linesResult)
                return { header, lines }
            })

            return payrolls
        } catch (error) {
            console.error('Error listing payroll by month:', error)
            throw error
        }
    },

    listPeriods: async (event: IpcMainInvokeEvent) => {
        const db = getDatabase()
        try {
            const result = db.exec(`
        SELECT DISTINCT period
        FROM payroll_headers
        ORDER BY period DESC
      `)

            const periods = execToObjects(result)
            return periods.map((p: any) => p.period)
        } catch (error) {
            console.error('Error listing periods:', error)
            throw error
        }
    },

    listByEmployee: async (event: IpcMainInvokeEvent, employeeId: number, period?: string, limit: number = 10) => {
        const db = getDatabase()
        try {
            let query = `
        SELECT ph.*, e.full_name as employee_name
        FROM payroll_headers ph
        LEFT JOIN employees e ON e.id = ph.employee_id
        WHERE ph.employee_id = ?
      `
            const params: any[] = [employeeId]

            if (period) {
                query += ' AND ph.period = ?'
                params.push(period)
            }

            query += ' ORDER BY ph.period DESC LIMIT ?'
            params.push(limit)

            const headersResult = db.exec(query, params)
            const headers = execToObjects(headersResult)

            const payrolls = headers.map((header: any) => {
                const linesResult = db.exec(`
          SELECT * FROM payroll_lines
          WHERE header_id = ?
          ORDER BY sort_order ASC
        `, [header.id])

                const lines = execToObjects(linesResult)
                return { header, lines }
            })

            return payrolls
        } catch (error) {
            console.error('Error listing payroll by employee:', error)
            throw error
        }
    },

    getTotalsByEmployee: async (event: IpcMainInvokeEvent, employeeId: number, period?: string) => {
        const db = getDatabase()
        try {
            // Re-query full headers for calculation
            let fullQuery = `
                SELECT ph.* 
                FROM payroll_headers ph
                WHERE ph.employee_id = ?
             `
            const fullParams: any[] = [employeeId]
            if (period) {
                fullQuery += ' AND ph.period = ?'
                fullParams.push(period)
            }

            const fullHeadersRes = db.exec(fullQuery, fullParams)
            const fullHeaders = execToObjects(fullHeadersRes)

            // Group by currency
            const totalsMap = new Map<string, { currency: string, base: number, add: number, ded: number, net: number }>()

            fullHeaders.forEach(header => {
                const linesRes = db.exec(`SELECT * FROM payroll_lines WHERE header_id = ?`, [header.id])
                const lines = execToObjects(linesRes)

                const basic = Number(header.base_min || 0)
                const expAllowance = (Number(header.experience_allowance_amount) || 0) * (Number(header.years_of_exp) || 0)

                const allowances = lines
                    .filter((l: any) => l.category === 'allowance' || l.category === 'exception' || l.category === 'reward')
                    .reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0)

                const deductions = lines
                    .filter((l: any) => l.category === 'deduction')
                    .reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0)

                const net = basic + expAllowance + allowances - deductions
                const currency = header.base_min_currency || 'TRY'

                if (!totalsMap.has(currency)) {
                    totalsMap.set(currency, { currency, base: 0, add: 0, ded: 0, net: 0 })
                }
                const t = totalsMap.get(currency)!
                t.base += basic
                t.add += (expAllowance + allowances)
                t.ded += deductions
                t.net += net
            })

            const resultArray = Array.from(totalsMap.values()).map(t => ({
                currency: t.currency,
                sum_base: t.base,
                sum_add: t.add,
                sum_ded: t.ded,
                sum_net: t.net
            }))

            return resultArray
        } catch (error) {
            console.error('Error getting payroll totals:', error)
            throw error
        }
    },

    calcPreview: async (event: IpcMainInvokeEvent, data: any) => {
        try {
            const { header, lines, experienceRateTRY } = data
            const result = computeTotals(header, lines, experienceRateTRY)
            return result
        } catch (error) {
            console.error('Error calculating payroll preview:', error)
            throw error
        }
    }
}
