import { query, queryOne } from '../connection'

export default {
  async findAll(filters?: any) {
    let sql = `
      SELECT o.*, e.full_name as employee_name 
      FROM overtime o
      LEFT JOIN employees e ON o.employee_id = e.id
    `
    const params: any = {}

    if (filters?.employee_id) {
      sql += ' WHERE o.employee_id = @employee_id'
      params.employee_id = filters.employee_id
    }
    
    if (filters?.period) {
      const whereClause = filters.employee_id ? ' AND' : ' WHERE'
      sql += `${whereClause} FORMAT(o.date, 'yyyy-MM') = @period`
      params.period = filters.period
    }

    sql += ' ORDER BY o.date DESC'
    const result = await query(sql, params)
    return result.recordset
  },

  async findById(id: number) {
    const result = await queryOne('SELECT * FROM overtime WHERE id = @id', { id })
    return result
  },

  async create(data: any) {
    const sql = `
      INSERT INTO overtime (employee_id, date, hours, rate_multiplier, amount, status, reason)
      VALUES (@employee_id, @date, @hours, @rate_multiplier, @amount, @status, @reason);
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await queryOne(sql, { 
      employee_id: data.employee_id,
      date: data.date,
      hours: data.hours,
      rate_multiplier: data.rate_multiplier || 1.5,
      amount: data.amount || 0,
      status: data.status || 'pending',
      reason: data.reason || null
    })
    return result.id
  },

  async update(id: number, data: any) {
    const sql = `
      UPDATE overtime
      SET hours = @hours, rate_multiplier = @rate_multiplier, amount = @amount, 
          status = @status, reason = @reason, date = @date
      WHERE id = @id
    `
    await query(sql, { 
      id, 
      hours: data.hours,
      rate_multiplier: data.rate_multiplier,
      amount: data.amount,
      status: data.status,
      reason: data.reason,
      date: data.date
    })
    return 1
  },

  async remove(id: number) {
    const sql = 'DELETE FROM overtime WHERE id = @id'
    const result = await query(sql, { id })
    return result.rowsAffected[0]
  }
}
