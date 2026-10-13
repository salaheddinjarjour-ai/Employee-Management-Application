import { query, queryOne } from '../connection'

export default {
  async findAll(filters?: any) {
    let sql = `
      SELECT p.*, e.full_name as employee_name 
      FROM penalties p
      LEFT JOIN employees e ON p.employee_id = e.id
    `
    const params: any = {}

    if (filters?.employee_id) {
      sql += ' WHERE p.employee_id = @employee_id'
      params.employee_id = filters.employee_id
    }

    if (filters?.period) {
      const whereClause = filters.employee_id ? ' AND' : ' WHERE'
      sql += `${whereClause} FORMAT(p.date, 'yyyy-MM') = @period`
      params.period = filters.period
    }

    sql += ' ORDER BY p.date DESC'
    const result = await query(sql, params)
    return result.recordset
  },

  async findById(id: number) {
    const result = await queryOne('SELECT * FROM penalties WHERE id = @id', { id })
    return result
  },

  async create(data: any) {
    const sql = `
      INSERT INTO penalties (employee_id, date, amount, currency, reason, status)
      VALUES (@employee_id, @date, @amount, @currency, @reason, @status);
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await queryOne(sql, { 
      employee_id: data.employee_id,
      date: data.date,
      amount: data.amount,
      currency: data.currency || 'USD',
      reason: data.reason || null,
      status: data.status || 'pending'
    })
    return result.id
  },

  async update(id: number, data: any) {
    const sql = `
      UPDATE penalties
      SET amount = @amount, currency = @currency, reason = @reason, 
          status = @status, date = @date
      WHERE id = @id
    `
    await query(sql, { 
      id, 
      amount: data.amount,
      currency: data.currency,
      reason: data.reason,
      status: data.status,
      date: data.date
    })
    return 1
  },

  async remove(id: number) {
    const sql = 'DELETE FROM penalties WHERE id = @id'
    const result = await query(sql, { id })
    return result.rowsAffected[0]
  }
}
