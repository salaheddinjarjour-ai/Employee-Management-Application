import { query, queryOne } from '../connection'

export type NewReward = {
  employee_id: number
  title: string
  description?: string
  kind: 'مكافأة' | 'تقدير' | 'إنجاز' | 'ابتكار' | 'خاص'
  category: 'شهري' | 'سنوي' | 'ربع سنوي' | 'خاص'
  amount_usd?: number
  reward_date: string
  status: 'مدفوع' | 'في الانتظار' | 'معتمد'
}

export default {
  async list(filters?: { kind?: string; status?: string; from?: string; to?: string }) {
    console.log('[rewardsRepo] Finding rewards with filters:', filters)

    const where: string[] = []
    const params: any = {}

    if (filters?.kind) {
      where.push('r.kind = @kind')
      params.kind = filters.kind
    }
    if (filters?.status) {
      where.push('r.status = @status')
      params.status = filters.status
    }
    if (filters?.from) {
      where.push('r.reward_date >= @from')
      params.from = filters.from
    }
    if (filters?.to) {
      where.push('r.reward_date <= @to')
      params.to = filters.to
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const sql = `
      SELECT r.*, e.full_name AS employee_name
      FROM rewards r
      JOIN employees e ON e.id = r.employee_id
      ${clause}
      ORDER BY r.reward_date DESC, r.id DESC
    `

    const result = await query(sql, params)
    console.log('[rewardsRepo] Found', result.recordset.length, 'rewards')
    return result.recordset
  },

  async findById(id: number) {
    console.log('[rewardsRepo] Finding reward by ID:', id)
    const sql = `
      SELECT r.*, e.full_name AS employee_name
      FROM rewards r
      JOIN employees e ON e.id = r.employee_id
      WHERE r.id = @id
    `
    const result = await queryOne(sql, { id })
    console.log('[rewardsRepo] Found reward:', result)
    return result
  },

  async create(data: NewReward) {
    console.log('[rewardsRepo] Creating reward:', data)
    const sql = `
      INSERT INTO rewards
        (employee_id, title, description, kind, category, amount_usd, reward_date, status, created_at)
      VALUES
        (@employee_id, @title, @description, @kind, @category, @amount_usd, @reward_date, @status, GETDATE());
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await query(sql, data)
    const id = result.recordset[0].id
    console.log('[rewardsRepo] Reward created with ID:', id)
    return this.findById(id)
  },

  async update(id: number, data: Partial<NewReward>) {
    console.log('[rewardsRepo] Updating reward with ID:', id, 'data:', data)

    const fields = Object.keys(data)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map(key => `${key} = @${key}`).join(', ')

    const sql = `
      UPDATE rewards SET
        ${setClause},
        updated_at = GETDATE()
      WHERE id = @id
    `
    await query(sql, { ...data, id })
    console.log('[rewardsRepo] Updated reward')
    return this.findById(id)
  },

  async remove(id: number) {
    console.log('[rewardsRepo] Removing reward with ID:', id)
    const sql = `DELETE FROM rewards WHERE id = @id`
    const result = await query(sql, { id })
    console.log('[rewardsRepo] Removed reward, rows affected:', result.rowsAffected[0])
    return { changes: result.rowsAffected[0] }
  },

  // ---------- Stats for dashboard ----------
  async stats() {
    console.log('[rewardsRepo] Getting reward statistics')

    const totalsSql = `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status=N'مدفوع' THEN amount_usd ELSE 0 END), 0) AS paid_amount,
        COALESCE(SUM(CASE WHEN status=N'في الانتظار' THEN amount_usd ELSE 0 END), 0) AS pending_amount,
        SUM(CASE WHEN reward_date LIKE strftime('%Y-%m', 'now') || '%' THEN 1 ELSE 0 END) AS this_month_count
      FROM rewards
    `

    const distSql = `
      SELECT kind, COUNT(*) AS c
      FROM rewards
      GROUP BY kind
    `

    const totalsResult = await queryOne(totalsSql)
    const distResult = await query(distSql)

    const totals = totalsResult || { total: 0, paid_amount: 0, pending_amount: 0, this_month_count: 0 }
    const dist = distResult.recordset

    const result = { totals, dist }
    console.log('[rewardsRepo] Stats:', result)
    return result
  },

  // Helper methods for employee profile
  async findByEmployee(employeeId: number) {
    console.log('[rewardsRepo] Finding rewards by employee:', employeeId)
    const sql = `
      SELECT * FROM rewards
      WHERE employee_id = @employeeId
      ORDER BY reward_date DESC
    `
    const result = await query(sql, { employeeId })
    console.log('[rewardsRepo] Found', result.recordset.length, 'rewards for employee', employeeId)
    return result.recordset
  },

  async countByEmployee(employeeId: number) {
    console.log('[rewardsRepo] Counting rewards by employee:', employeeId)
    const sql = `
      SELECT COUNT(*) as count FROM rewards WHERE employee_id = @employeeId
    `
    const result = await queryOne(sql, { employeeId })
    const count = result?.count || 0
    console.log('[rewardsRepo] Found', count, 'rewards for employee', employeeId)
    return count
  }
}
