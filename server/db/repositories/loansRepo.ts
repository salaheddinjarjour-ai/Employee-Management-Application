import { query, queryOne } from '../connection'

export default {
  async findAll(filters?: any) {
    let sql = `
      SELECT l.*, e.full_name as employee_name 
      FROM loans l
      LEFT JOIN employees e ON l.employee_id = e.id
    `
    const params: any = {}

    if (filters?.employee_id) {
      sql += ' WHERE l.employee_id = @employee_id'
      params.employee_id = filters.employee_id
    }

    sql += ' ORDER BY l.start_date DESC'
    const result = await query(sql, params)
    return result.recordset
  },

  async findById(id: number) {
    const result = await queryOne('SELECT * FROM loans WHERE id = @id', { id })
    return result
  },

  async create(data: any) {
    const sql = `
      INSERT INTO loans (employee_id, amount, currency, start_date, installments_count, status)
      VALUES (@employee_id, @amount, @currency, @start_date, @installments_count, @status);
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await queryOne(sql, { 
      employee_id: data.employee_id,
      amount: data.amount,
      currency: data.currency || 'USD',
      start_date: data.start_date,
      installments_count: data.installments_count || 1,
      status: data.status || 'active'
    })
    return result.id
  },

  async update(id: number, data: any) {
    const sql = `
      UPDATE loans
      SET amount = @amount, currency = @currency, start_date = @start_date, 
          installments_count = @installments_count, status = @status, amount_paid = @amount_paid
      WHERE id = @id
    `
    await query(sql, { 
      id, 
      amount: data.amount,
      currency: data.currency,
      start_date: data.start_date,
      installments_count: data.installments_count,
      status: data.status,
      amount_paid: data.amount_paid || 0
    })
    return 1
  },

  async remove(id: number) {
    const sql = 'DELETE FROM loans WHERE id = @id'
    const result = await query(sql, { id })
    return result.rowsAffected[0]
  }
}
