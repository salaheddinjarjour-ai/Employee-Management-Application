import { query, queryOne } from '../connection'

export default {
  async findAll(filters?: any) {
    let sql = 'SELECT s.*, d.name as department_name FROM sections s LEFT JOIN departments d ON s.department_id = d.id'
    const params: any = {}
    
    if (filters?.department_id) {
      sql += ' WHERE s.department_id = @department_id'
      params.department_id = filters.department_id
    }
    
    sql += ' ORDER BY s.name'
    const result = await query(sql, params)
    return result.recordset
  },

  async findById(id: number) {
    const result = await queryOne('SELECT * FROM sections WHERE id = @id', { id })
    return result
  },

  async create(data: any) {
    const sql = `
      INSERT INTO sections (name, department_id)
      VALUES (@name, @department_id);
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await queryOne(sql, { 
      name: data.name, 
      department_id: data.department_id || null 
    })
    return result.id
  },

  async update(id: number, data: any) {
    const sql = `
      UPDATE sections
      SET name = @name, department_id = @department_id
      WHERE id = @id
    `
    await query(sql, { 
      id, 
      name: data.name, 
      department_id: data.department_id || null 
    })
    return 1
  },

  async remove(id: number) {
    const sql = 'DELETE FROM sections WHERE id = @id'
    const result = await query(sql, { id })
    return result.rowsAffected[0]
  }
}
