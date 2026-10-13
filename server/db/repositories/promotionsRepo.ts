import { query, queryOne } from '../connection'

export type NewPromotion = {
  employee_id: number
  from_title?: string
  to_title?: string
  from_grade?: number
  to_grade?: number
  promo_type: string
  status: string
  effective_date: string
  increase_amount_usd?: number
  increase_percent?: number
  notes?: string
}

export default {
  async list({ type }: { type?: string } = {}) {
    console.log('[promotionsRepo] Finding promotions with type filter:', type)

    const where = type ? 'WHERE p.promo_type = @type' : ''
    const sql = `
      SELECT p.*, e.full_name AS employee_name
      FROM promotions p
      JOIN employees e ON e.id = p.employee_id
      ${where}
      ORDER BY p.effective_date DESC, p.id DESC
    `

    const result = await query(sql, { type })
    console.log('[promotionsRepo] Found', result.recordset.length, 'promotions')
    return result.recordset
  },

  async findById(id: number) {
    console.log('[promotionsRepo] Finding promotion by ID:', id)

    const sql = `
      SELECT p.*, e.full_name AS employee_name
      FROM promotions p
      JOIN employees e ON e.id = p.employee_id
      WHERE p.id = @id
    `

    const result = await queryOne(sql, { id })
    console.log('[promotionsRepo] Found promotion:', result)
    return result
  },

  async create(data: NewPromotion) {
    console.log('[promotionsRepo] Creating promotion:', data)

    const sql = `
      INSERT INTO promotions
      (employee_id, from_title, to_title, from_grade, to_grade, promo_type, status, effective_date,
       increase_amount_usd, increase_percent, notes, created_at)
      VALUES (@employee_id, @from_title, @to_title, @from_grade, @to_grade, @promo_type, @status, @effective_date,
              @increase_amount_usd, @increase_percent, @notes, GETDATE());
      SELECT SCOPE_IDENTITY() AS id;
    `

    // Ensure all optional fields are at least null
    const params = {
      employee_id: data.employee_id,
      from_title: data.from_title ?? null,
      to_title: data.to_title ?? null,
      from_grade: data.from_grade ?? null,
      to_grade: data.to_grade ?? null,
      promo_type: data.promo_type,
      status: data.status,
      effective_date: data.effective_date,
      increase_amount_usd: data.increase_amount_usd ?? null,
      increase_percent: data.increase_percent ?? null,
      notes: data.notes ?? null
    }

    const result = await query(sql, params)
    const id = result.recordset[0].id
    console.log('[promotionsRepo] Promotion created with ID:', id)
    return this.findById(id)
  },

  async update(id: number, data: Partial<NewPromotion>) {
    console.log('[promotionsRepo] Updating promotion with ID:', id, 'data:', data)

    const fields = Object.keys(data)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map(key => `${key} = @${key}`).join(', ')

    const sql = `
      UPDATE promotions SET
        ${setClause},
        updated_at = GETDATE()
      WHERE id = @id
    `

    await query(sql, { ...data, id })
    console.log('[promotionsRepo] Updated promotion')
    return this.findById(id)
  },

  async remove(id: number) {
    console.log('[promotionsRepo] Deleting promotion with ID:', id)

    const sql = 'DELETE FROM promotions WHERE id = @id'
    const result = await query(sql, { id })

    console.log('[promotionsRepo] Deleted promotion, rows affected:', result.rowsAffected[0])
    return result.rowsAffected[0]
  },

  // ---------- Stats (cards + distribution) ----------
  async stats() {
    console.log('[promotionsRepo] Getting promotion statistics')

    const totalsSql = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status=N'منفذ' THEN 1 ELSE 0 END) AS executed_count,
        SUM(CASE WHEN status=N'في الانتظار' THEN 1 ELSE 0 END) AS pending_count,
        COALESCE(SUM(increase_amount_usd), 0) AS total_raise_usd
      FROM promotions
    `

    const distSql = `
      SELECT status, COUNT(*) AS c FROM promotions GROUP BY status
    `

    const totalsResult = await queryOne(totalsSql)
    const distResult = await query(distSql)

    const totals = totalsResult || { total: 0, executed_count: 0, pending_count: 0, total_raise_usd: 0 }
    const dist = distResult.recordset

    console.log('[promotionsRepo] Stats:', { totals, dist })
    return { totals, dist }
  },

  // Legacy methods for compatibility
  async findAll(filters?: any) {
    console.log('[promotionsRepo] Finding all promotions with filters:', filters)
    return this.list({})
  },

  async findByEmployee(empId: number, { limit = 10, order = 'desc' } = {}) {
    console.log('[promotionsRepo] Finding promotions by employee:', empId)

    const dir = order === 'asc' ? 'ASC' : 'DESC'
    const sql = `
      SELECT TOP (@limit) p.*, e.full_name AS employee_name
      FROM promotions p
      LEFT JOIN employees e ON p.employee_id = e.id
      WHERE p.employee_id = @empId
      ORDER BY p.effective_date ${dir}, p.id ${dir}
    `

    const result = await query(sql, { empId, limit })
    console.log('[promotionsRepo] Found', result.recordset.length, 'promotions for employee', empId)
    return result.recordset
  },

  async countByEmployee(empId: number): Promise<number> {
    console.log('[promotionsRepo] Counting promotions by employee:', empId)

    const sql = 'SELECT COUNT(*) as c FROM promotions WHERE employee_id = @empId'
    const result = await queryOne(sql, { empId })
    const count = result?.c || 0

    console.log('[promotionsRepo] Found', count, 'promotions for employee', empId)
    return count
  }
}
