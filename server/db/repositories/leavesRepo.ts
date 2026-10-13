import { query, queryOne } from '../connection'

export type NewLeave = {
  employee_id: number
  leave_type: string
  type?: string  // Allow both for compatibility
  from_date: string  // ISO yyyy-mm-dd
  to_date: string    // ISO yyyy-mm-dd
  days: number
  status: string
  reason?: string | null
}

export default {
  async list() {
    console.log('[leavesRepo] Finding all leaves')
    const sql = `
      SELECT l.*, e.full_name AS employee_name
      FROM leaves l
      JOIN employees e ON e.id = l.employee_id
      ORDER BY l.from_date DESC, l.id DESC
    `
    const result = await query(sql)
    console.log(`[leavesRepo] Found ${result.recordset.length} leaves`)
    return result.recordset
  },

  async findById(id: number) {
    console.log(`[leavesRepo] Finding leave by ID: ${id}`)
    const sql = `
      SELECT l.*, e.full_name AS employee_name
      FROM leaves l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.id = @id
    `
    const result = await queryOne(sql, { id })
    console.log(`[leavesRepo] Found leave:`, result)
    return result
  },

  async create(data: NewLeave) {
    console.log('[leavesRepo] Creating leave:', data)
    
    const payload = {
      employee_id: data.employee_id,
      leave_type: data.leave_type || data.type, // Handle compatibility
      from_date: data.from_date,
      to_date: data.to_date,
      days: data.days,
      status: data.status,
      reason: data.reason ?? null,
    }

    const sql = `
      INSERT INTO leaves (
        employee_id, leave_type, from_date, to_date, days, status, reason, created_at
      ) VALUES (
        @employee_id, @leave_type, @from_date, @to_date, @days, @status, @reason, GETDATE()
      );
      SELECT SCOPE_IDENTITY() AS id;
    `
    
    console.log('[leavesRepo] SQL payload:', payload)
    const result = await query(sql, payload)
    const id = result.recordset[0].id
    console.log(`[leavesRepo] Leave created with ID: ${id}`)
    return { id }
  },

  async update(id: number, data: Partial<NewLeave>) {
    console.log(`[leavesRepo] Updating leave ${id}:`, data)
    
    const fields = Object.keys(data)
    if (fields.length === 0) return this.findById(id)

    // Filter out 'type' if 'leave_type' is present or just map it
    const cleanData: any = { ...data }
    if (cleanData.type && !cleanData.leave_type) {
      cleanData.leave_type = cleanData.type
      delete cleanData.type
    } else if (cleanData.type) {
      delete cleanData.type
    }

    const updateFields = Object.keys(cleanData)
    const setClause = updateFields.map(key => `${key} = @${key}`).join(', ')

    const sql = `
      UPDATE leaves SET
        ${setClause},
        updated_at = GETDATE()
      WHERE id = @id
    `
    
    await query(sql, { ...cleanData, id })
    console.log(`[leavesRepo] Leave ${id} updated`)
    return this.findById(id)
  },

  async remove(id: number) {
    console.log(`[leavesRepo] Removing leave: ${id}`)
    const sql = `DELETE FROM leaves WHERE id = @id`
    const result = await query(sql, { id })
    console.log(`[leavesRepo] Leave ${id} removed, rows affected: ${result.rowsAffected[0]}`)
    return { changes: result.rowsAffected[0] }
  },

  // Stats for cards + distribution + recent activity
  async stats() {
    console.log('[leavesRepo] Getting leave statistics')
    
    const totalsSql = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status=N'معتمد' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status=N'في الانتظار' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status=N'مرفوض' THEN 1 ELSE 0 END) AS rejected
      FROM leaves
    `

    const byTypeSql = `
      SELECT leave_type AS type, COUNT(*) AS c
      FROM leaves
      GROUP BY leave_type
    `

    // آخر النشاطات (أحدث 5 طلبات)
    const recentSql = `
      SELECT TOP 5 l.id, e.full_name AS employee_name, l.leave_type, l.status,
             l.from_date, l.to_date, l.days
      FROM leaves l
      JOIN employees e ON e.id = l.employee_id
      ORDER BY l.created_at DESC
    `

    const totalsResult = await queryOne(totalsSql)
    const byTypeResult = await query(byTypeSql)
    const recentResult = await query(recentSql)

    const totals = totalsResult || { total: 0, approved: 0, pending: 0, rejected: 0 }
    const byType = byTypeResult.recordset
    const recent = recentResult.recordset

    const stats = { totals, byType, recent }
    console.log('[leavesRepo] Stats:', stats)
    return stats
  },

  // Helper methods for employee profile
  async findByEmployee(employeeId: number, options?: { limit?: number; order?: 'asc' | 'desc' }) {
    console.log(`[leavesRepo] Finding leaves by employee: ${employeeId}`)
    const { limit = 10, order = 'desc' } = options || {}
    
    const dir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    
    const sql = `
      SELECT TOP (@limit) * FROM leaves
      WHERE employee_id = @employeeId
      ORDER BY from_date ${dir}
    `
    const result = await query(sql, { employeeId, limit })
    console.log(`[leavesRepo] Found ${result.recordset.length} leaves for employee ${employeeId}`)
    return result.recordset
  },

  async countByEmployee(employeeId: number) {
    console.log(`[leavesRepo] Counting leaves by employee: ${employeeId}`)
    const sql = 'SELECT COUNT(*) as count FROM leaves WHERE employee_id = @employeeId'
    const result = await queryOne(sql, { employeeId })
    const count = result?.count || 0
    console.log(`[leavesRepo] Found ${count} leaves for employee ${employeeId}`)
    return count
  }
}
