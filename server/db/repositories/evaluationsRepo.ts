import { query, queryOne } from '../connection'

export type NewEvaluation = {
  employee_id: number
  evaluator_id: number
  period: string
  overall_score: number
  rating: string
  goals_percent: number
  status: string
}

export default {
  async listAll() {
    console.log('[evaluationsRepo] Finding all evaluations')
    
    const sql = `
      SELECT ev.*, e1.full_name AS employee_name, e2.full_name AS evaluator_name
      FROM evaluations ev
      LEFT JOIN employees e1 ON e1.id = ev.employee_id
      LEFT JOIN employees e2 ON e2.id = ev.evaluator_id
      ORDER BY ev.created_at DESC
    `
    
    const result = await query(sql)
    console.log('[evaluationsRepo] Found', result.recordset.length, 'evaluations')
    return result.recordset
  },

  async create(data: NewEvaluation) {
    console.log('[evaluationsRepo] Creating evaluation:', data)
    
    const sql = `
      INSERT INTO evaluations (
        employee_id, evaluator_id, period, overall_score, rating, goals_percent, status, created_at
      )
      VALUES (
        @employee_id, @evaluator_id, @period, @overall_score, @rating, @goals_percent, @status, GETDATE()
      );
      SELECT SCOPE_IDENTITY() AS id;
    `
    
    const result = await query(sql, data)
    const id = result.recordset[0].id
    console.log('[evaluationsRepo] Evaluation created with ID:', id)
    return this.findById(id)
  },

  async update(id: number, data: Partial<NewEvaluation>) {
    console.log('[evaluationsRepo] Updating evaluation with ID:', id, 'data:', data)
    
    const fields = Object.keys(data)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map(key => `${key} = @${key}`).join(', ')
    
    const sql = `
      UPDATE evaluations SET
        ${setClause},
        updated_at = GETDATE()
      WHERE id = @id
    `
    
    await query(sql, { ...data, id })
    console.log('[evaluationsRepo] Updated evaluation')
    return this.findById(id)
  },

  async remove(id: number) {
    console.log('[evaluationsRepo] Deleting evaluation with ID:', id)
    
    const sql = 'DELETE FROM evaluations WHERE id = @id'
    const result = await query(sql, { id })
    
    console.log('[evaluationsRepo] Deleted evaluation, rows affected:', result.rowsAffected[0])
    return result.rowsAffected[0]
  },

  async findById(id: number) {
    console.log('[evaluationsRepo] Finding evaluation by ID:', id)
    
    const sql = `
      SELECT ev.*, e1.full_name AS employee_name, e2.full_name AS evaluator_name
      FROM evaluations ev
      LEFT JOIN employees e1 ON e1.id = ev.employee_id
      LEFT JOIN employees e2 ON e2.id = ev.evaluator_id
      WHERE ev.id = @id
    `
    
    const result = await queryOne(sql, { id })
    console.log('[evaluationsRepo] Found evaluation:', result)
    return result
  },

  // ---------- Stats for the dashboard ----------
  async stats() {
    console.log('[evaluationsRepo] Getting evaluation statistics')
    
    const totalsSql = `
      SELECT
        COUNT(*) AS total,
        AVG(overall_score) AS avg_score,
        SUM(CASE WHEN status=N'معتمد' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN rating=N'ممتاز' THEN 1 ELSE 0 END) AS excellent_count
      FROM evaluations
    `

    const distSql = `
      SELECT rating, COUNT(*) AS c FROM evaluations GROUP BY rating
    `

    const totalsResult = await queryOne(totalsSql)
    const distResult = await query(distSql)

    const totals = totalsResult || { total: 0, avg_score: 0, approved_count: 0, excellent_count: 0 }
    const dist = distResult.recordset

    console.log('[evaluationsRepo] Stats:', { totals, dist })
    return { totals, dist }
  },

  // Legacy methods for compatibility
  async findAll(filters?: any) {
    console.log('[evaluationsRepo] Finding all evaluations with filters:', filters)
    return this.listAll()
  },

  async findByEmployee(empId: number, { limit = 10, order = 'desc' } = {}) {
    console.log('[evaluationsRepo] Finding evaluations by employee:', empId)
    
    const dir = order === 'asc' ? 'ASC' : 'DESC'
    const sql = `
      SELECT TOP (@limit) ev.*, e1.full_name AS employee_name, e2.full_name AS evaluator_name
      FROM evaluations ev
      LEFT JOIN employees e1 ON e1.id = ev.employee_id
      LEFT JOIN employees e2 ON e2.id = ev.evaluator_id
      WHERE ev.employee_id = @empId
      ORDER BY ev.created_at ${dir}
    `
    
    const result = await query(sql, { empId, limit })
    console.log('[evaluationsRepo] Found', result.recordset.length, 'evaluations for employee', empId)
    return result.recordset
  },

  async countByEmployee(empId: number): Promise<number> {
    console.log('[evaluationsRepo] Counting evaluations by employee:', empId)
    
    const sql = 'SELECT COUNT(*) as c FROM evaluations WHERE employee_id = @empId'
    const result = await queryOne(sql, { empId })
    const count = result?.c || 0
    
    console.log('[evaluationsRepo] Found', count, 'evaluations for employee', empId)
    return count
  }
}
