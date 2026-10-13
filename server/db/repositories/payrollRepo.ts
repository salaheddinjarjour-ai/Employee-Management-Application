import { query, queryOne, getConnection } from '../connection'

export default {
  async upsertHeader(h: any) {
    console.log('[payrollRepo] Upserting header:', h)

    const params = {
      ...h,
      base_min_currency: h.base_min_currency || 'TRY',
      experience_allowance_amount: h.experience_allowance_amount || 0,
      experience_allowance_currency: h.experience_allowance_currency || 'TRY'
    }

    // Check if header exists
    const existing = await queryOne(
      'SELECT id FROM payroll_headers WHERE employee_id = @employee_id AND period = @period',
      { employee_id: params.employee_id, period: params.period }
    )

    if (existing) {
      // Update existing header
      await query(`
        UPDATE payroll_headers SET
          id_number = @id_number,
          start_date = @start_date,
          admin_level = @admin_level,
          job_title = @job_title,
          edu_actual = @edu_actual,
          edu_required = @edu_required,
          base_min = @base_min,
          base_min_currency = @base_min_currency,
          years_of_exp = @years_of_exp,
          experience_allowance_amount = @experience_allowance_amount,
          experience_allowance_currency = @experience_allowance_currency,
          notes = @notes,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = @employee_id AND period = @period
      `, params)

      console.log(`[payrollRepo] Header updated with ID: ${existing.id}`)
      return existing.id
    } else {
      // Insert new header
      const insertSql = `
        INSERT INTO payroll_headers (
          employee_id, period, id_number, start_date, admin_level, job_title,
          edu_actual, edu_required, base_min, base_min_currency, years_of_exp,
          experience_allowance_amount, experience_allowance_currency, notes, created_at
        ) VALUES (
          @employee_id, @period, @id_number, @start_date, @admin_level, @job_title,
          @edu_actual, @edu_required, @base_min, @base_min_currency, @years_of_exp,
          @experience_allowance_amount, @experience_allowance_currency, @notes, CURRENT_TIMESTAMP
        )
      `
      const result = await query(insertSql, params)
      const id = result.recordset[0].id
      console.log(`[payrollRepo] Header inserted with ID: ${id}`)
      return id
    }
  },

  async replaceLines(header_id: number, lines: any[]) {
    console.log(`[payrollRepo] Replacing lines for header ${header_id}:`, lines)

    // Delete existing lines
    await query('DELETE FROM payroll_lines WHERE header_id = @header_id', { header_id })

    // Insert new lines one by one
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      await query(`
        INSERT INTO payroll_lines (header_id, line_key, label, currency, amount, sort_order)
        VALUES (@header_id, @line_key, @label, @currency, @amount, @sort_order)
      `, {
        header_id,
        line_key: l.category || l.line_key || '',
        label: l.label,
        currency: l.currency,
        amount: l.amount,
        sort_order: i
      })
    }

    console.log(`[payrollRepo] Replaced ${lines.length} lines for header ${header_id}`)
  },

  async getFull(headerQuery: { employee_id: number; period: string }) {
    console.log('[payrollRepo] Getting full payroll:', headerQuery)

    const headerSql = `SELECT * FROM payroll_headers WHERE employee_id = @employee_id AND period = @period`
    const header = await queryOne(headerSql, headerQuery)

    if (!header) {
      console.log('[payrollRepo] No header found')
      return null
    }

    const linesSql = `SELECT * FROM payroll_lines WHERE header_id = @header_id ORDER BY sort_order ASC`
    const linesResult = await query(linesSql, { header_id: header.id })

    console.log(`[payrollRepo] Found header with ${linesResult.recordset.length} lines`)
    return { header, lines: linesResult.recordset }
  },

  async listByPeriod(period: string) {
    console.log(`[payrollRepo] Listing payrolls for period: ${period}`)

    const headersSql = `
      SELECT ph.*,
             COALESCE(e.full_name, '') AS employee_name
      FROM payroll_headers ph
      LEFT JOIN employees e ON e.id = ph.employee_id
      WHERE ph.period = @period
      ORDER BY e.full_name ASC, ph.id DESC
    `
    const headersResult = await query(headersSql, { period })
    const headers = headersResult.recordset

    console.log(`[payrollRepo] Found ${headers.length} payroll headers for period ${period}`)

    if (headers.length === 0) {
      const periodsResult = await query(`SELECT DISTINCT period FROM payroll_headers ORDER BY period DESC`)
      console.log('[payrollRepo] existing periods:', periodsResult.recordset.map((p: any) => p.period))

      const totalResult = await queryOne(`SELECT COUNT(*) as count FROM payroll_headers`)
      console.log('[payrollRepo] total headers in DB:', totalResult.count)
    }

    // For each header, get lines. N+1 problem but fine for now or optimize later
    const payrolls = await Promise.all(headers.map(async (header: any) => {
      const linesSql = `
        SELECT * FROM payroll_lines 
        WHERE header_id = @header_id 
        ORDER BY sort_order ASC
      `
      const linesResult = await query(linesSql, { header_id: header.id })

      return {
        header,
        lines: linesResult.recordset
      }
    }))

    if (payrolls.length > 0) {
      console.log(`[payrollRepo] Sample structured payroll:`, JSON.stringify(payrolls[0], null, 2))
    }

    console.log(`[payrollRepo] Returning ${payrolls.length} structured payrolls`)
    return payrolls
  },

  async listPeriods() {
    console.log('[payrollRepo] Listing all periods')
    const sql = `
      SELECT DISTINCT period 
      FROM payroll_headers 
      ORDER BY period DESC
    `
    const result = await query(sql)

    console.log(`[payrollRepo] Found ${result.recordset.length} periods`)
    return result.recordset.map((p: any) => p.period)
  },

  async deletePeriod(period: string) {
    console.log(`[payrollRepo] Deleting all payrolls for period ${period}`)
    const sql = `DELETE FROM payroll_headers WHERE period = @period`
    const result = await query(sql, { period })

    console.log(`[payrollRepo] Deleted ${result.rowsAffected[0]} payroll records for period ${period}`)
    return result.rowsAffected[0]
  },

  async delete(employee_id: number, period: string) {
    console.log(`[payrollRepo] Deleting payroll for employee ${employee_id}, period ${period}`)
    const sql = `DELETE FROM payroll_headers WHERE employee_id = @employee_id AND period = @period`
    const result = await query(sql, { employee_id, period })

    console.log(`[payrollRepo] Deleted ${result.rowsAffected[0]} payroll records`)
    return { changes: result.rowsAffected[0] }
  },

  // Helper method for Excel import compatibility
  async findByEmployeeMonth(employee_id: number, period: string) {
    console.log(`[payrollRepo] Finding payroll for employee ${employee_id}, period ${period}`)
    return this.getFull({ employee_id, period })
  },

  // New methods for employee payroll preview
  async listByEmployee(opts: { employeeId: number; period?: string; limit?: number }) {
    const { employeeId, period, limit = 10 } = opts
    console.log('[Repo] listByEmployee()', { employeeId, period, limit })

    let safeEmployeeId = Number(employeeId)
    if (isNaN(safeEmployeeId)) {
      console.warn('[payrollRepo] Invalid employeeId:', employeeId)
      return []
    }

    let sqlQuery = `
      SELECT TOP (@limit)
        ph.id,
        ph.employee_id,
        ph.period,
        ph.base_min,
        ph.base_min_currency,
        ph.experience_allowance_amount,
        ph.experience_allowance_currency,
        ph.years_of_exp,
        ph.created_at,
        ph.updated_at,
        e.full_name as employee_name
      FROM payroll_headers ph
      LEFT JOIN employees e ON e.id = ph.employee_id
      WHERE ph.employee_id = @employeeId
    `

    const params: any = { employeeId: safeEmployeeId, limit }

    if (period) {
      sqlQuery += ` AND ph.period = @period`
      params.period = period
    }

    sqlQuery += ` ORDER BY ph.period DESC, ph.created_at DESC`

    const headersResult = await query(sqlQuery, params)
    const headers = headersResult.recordset

    // For each header, calculate totals from lines
    const payrolls = await Promise.all(headers.map(async (header: any) => {
      const linesSql = `
        SELECT line_key AS category, label, currency, amount 
        FROM payroll_lines 
        WHERE header_id = @header_id
        ORDER BY sort_order ASC
      `
      const linesResult = await query(linesSql, { header_id: header.id })
      const lines = linesResult.recordset

      // Calculate totals by currency
      const totals = { TRY: { base: 0, additions: 0, deductions: 0, net: 0 }, USD: { base: 0, additions: 0, deductions: 0, net: 0 } }

      // Add base salary
      const baseCurrency = (header.base_min_currency === 'USD' ? 'USD' : 'TRY') as 'TRY' | 'USD'
      totals[baseCurrency].base += Number(header.base_min || 0)

      // Add experience allowance
      const expAmount = (header.experience_allowance_amount || 0) * (header.years_of_exp || 0)
      const expCurrency = (header.experience_allowance_currency === 'USD' ? 'USD' : 'TRY') as 'TRY' | 'USD'
      totals[expCurrency].additions += expAmount

      // Process lines
      lines.forEach((line: any) => {
        const amount = Number(line.amount || 0)
        const currency = line.currency === 'USD' ? 'USD' : 'TRY'

        if (line.category === 'allowance' || line.category === 'exception') {
          totals[currency].additions += amount
        } else if (line.category === 'deduction') {
          totals[currency].deductions += amount
        }
      })

      // Calculate net for each currency
      totals.TRY.net = totals.TRY.base + totals.TRY.additions - totals.TRY.deductions
      totals.USD.net = totals.USD.base + totals.USD.additions - totals.USD.deductions

      // Return both currencies as separate rows
      const results = []
      if (totals.TRY.base > 0 || totals.TRY.additions > 0 || totals.TRY.deductions > 0) {
        results.push({
          id: header.id,
          employee_id: header.employee_id,
          period: header.period,
          currency: 'TRY',
          base_amount: totals.TRY.base,
          additions: totals.TRY.additions,
          deductions: totals.TRY.deductions,
          net_amount: totals.TRY.net,
          created_at: header.created_at,
          updated_at: header.updated_at
        })
      }
      if (totals.USD.base > 0 || totals.USD.additions > 0 || totals.USD.deductions > 0) {
        results.push({
          id: header.id + 0.1, // Slight offset to make unique
          employee_id: header.employee_id,
          period: header.period,
          currency: 'USD',
          base_amount: totals.USD.base,
          additions: totals.USD.additions,
          deductions: totals.USD.deductions,
          net_amount: totals.USD.net,
          created_at: header.created_at,
          updated_at: header.updated_at
        })
      }
      return results
    }))

    const flattenedPayrolls = payrolls.flat()
    console.log(`[payrollRepo] Found ${flattenedPayrolls.length} payroll rows for employee ${employeeId}`)

    // Safety check to ensure array return
    if (!Array.isArray(flattenedPayrolls)) {
      console.error('[payrollRepo] flattenedPayrolls is NOT an array:', flattenedPayrolls)
      return []
    }

    return flattenedPayrolls
  },

  async totalsByEmployee(opts: { employeeId: number; period?: string }) {
    const { employeeId, period } = opts
    console.log('[Repo] totalsByEmployee()', { employeeId, period })

    let safeEmployeeId = Number(employeeId)
    if (isNaN(safeEmployeeId)) {
      console.warn('[payrollRepo] Invalid employeeId:', employeeId)
      return []
    }

    let sqlQuery = `
      SELECT 
        ph.id,
        ph.base_min,
        ph.base_min_currency,
        ph.experience_allowance_amount,
        ph.experience_allowance_currency,
        ph.years_of_exp
      FROM payroll_headers ph
      WHERE ph.employee_id = @employeeId
    `

    const params: any = { employeeId: safeEmployeeId }

    if (period) {
      sqlQuery += ` AND ph.period = @period`
      params.period = period
    }

    const headersResult = await query(sqlQuery, params)
    const headers = headersResult.recordset

    // Aggregate totals by currency
    const totals = { TRY: { sum_base: 0, sum_add: 0, sum_ded: 0, sum_net: 0 }, USD: { sum_base: 0, sum_add: 0, sum_ded: 0, sum_net: 0 } }

    await Promise.all(headers.map(async (header: any) => {
      const linesSql = `
        SELECT line_key AS category, currency, amount 
        FROM payroll_lines 
        WHERE header_id = @header_id
      `
      const linesResult = await query(linesSql, { header_id: header.id })
      const lines = linesResult.recordset

      // Add base salary
      const baseCurrency = (header.base_min_currency === 'USD' ? 'USD' : 'TRY') as 'TRY' | 'USD'
      totals[baseCurrency].sum_base += Number(header.base_min || 0)

      // Add experience allowance
      const expAmount = (header.experience_allowance_amount || 0) * (header.years_of_exp || 0)
      const expCurrency = (header.experience_allowance_currency === 'USD' ? 'USD' : 'TRY') as 'TRY' | 'USD'
      totals[expCurrency].sum_add += expAmount

      // Process lines
      lines.forEach((line: any) => {
        const amount = Number(line.amount || 0)
        const currency = line.currency === 'USD' ? 'USD' : 'TRY'

        if (line.category === 'allowance' || line.category === 'exception') {
          totals[currency].sum_add += amount
        } else if (line.category === 'deduction') {
          totals[currency].sum_ded += amount
        }
      })
    }))

    // Calculate net for each currency
    totals.TRY.sum_net = totals.TRY.sum_base + totals.TRY.sum_add - totals.TRY.sum_ded
    totals.USD.sum_net = totals.USD.sum_base + totals.USD.sum_add - totals.USD.sum_ded

    // Return as array with currency info
    const result = []
    if (totals.TRY.sum_base > 0 || totals.TRY.sum_add > 0 || totals.TRY.sum_ded > 0) {
      result.push({ currency: 'TRY', ...totals.TRY })
    }
    if (totals.USD.sum_base > 0 || totals.USD.sum_add > 0 || totals.USD.sum_ded > 0) {
      result.push({ currency: 'USD', ...totals.USD })
    }

    console.log(`[payrollRepo] Calculated totals:`, result)
    return result
  }
}
