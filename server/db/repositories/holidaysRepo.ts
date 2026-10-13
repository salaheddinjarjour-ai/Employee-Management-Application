import { query, queryOne } from '../connection'

export default {
  async findAll(filters?: any) {
    let sql = 'SELECT * FROM holidays'
    const params: any = {}

    if (filters?.year) {
      sql += ' WHERE start_date LIKE @yearPattern'
      params.yearPattern = `${filters.year}%`
    }

    sql += ' ORDER BY start_date'
    const result = await query(sql, params)
    return result.recordset
  },

  async findById(id: number) {
    const result = await queryOne('SELECT * FROM holidays WHERE id = @id', { id })
    return result
  },

  async create(data: any) {
    const sql = `
      INSERT INTO holidays (name, start_date, end_date, days_count)
      VALUES (@name, @start_date, @end_date, @days_count);
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await queryOne(sql, { 
      name: data.name, 
      start_date: data.start_date,
      end_date: data.end_date,
      days_count: data.days_count || 1
    })
    return result.id
  },

  async update(id: number, data: any) {
    const sql = `
      UPDATE holidays
      SET name = @name, start_date = @start_date, end_date = @end_date, days_count = @days_count
      WHERE id = @id
    `
    await query(sql, { 
      id, 
      name: data.name, 
      start_date: data.start_date,
      end_date: data.end_date,
      days_count: data.days_count || 1
    })
    return 1
  },

  async remove(id: number) {
    const sql = 'DELETE FROM holidays WHERE id = @id'
    const result = await query(sql, { id })
    return result.rowsAffected[0]
  }
}
