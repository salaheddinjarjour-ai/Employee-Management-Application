import { query, queryOne } from '../connection'

export default {
  async findAll(filters?: any) {
    let sql = `
      SELECT u.id, u.username, u.role, u.created_at, e.full_name as employee_name 
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
    `
    const params: any = {}
    
    // Skip filters for now, just list all
    
    sql += ' ORDER BY u.username'
    const result = await query(sql, params)
    return result.recordset
  },

  async findById(id: number) {
    const result = await queryOne(`
      SELECT u.id, u.username, u.role, u.created_at, e.full_name as employee_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.id = @id
    `, { id })
    return result
  },
  
  async findByUsername(username: string) {
    const result = await queryOne(`
      SELECT * FROM users WHERE username = @username
    `, { username })
    return result
  },

  async create(data: any) {
    const sql = `
      INSERT INTO users (username, password_hash, role, employee_id)
      VALUES (@username, @password_hash, @role, @employee_id);
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await queryOne(sql, { 
      username: data.username,
      password_hash: data.password_hash, // Assumed already hashed
      role: data.role || 'user',
      employee_id: data.employee_id || null
    })
    return result.id
  },

  async update(id: number, data: any) {
    // Dynamic update
    const fields = []
    const params: any = { id }
    
    if (data.username) {
      fields.push('username = @username')
      params.username = data.username
    }
    if (data.password_hash) {
      fields.push('password_hash = @password_hash')
      params.password_hash = data.password_hash
    }
    if (data.role) {
      fields.push('role = @role')
      params.role = data.role
    }
    if (data.employee_id !== undefined) {
      fields.push('employee_id = @employee_id')
      params.employee_id = data.employee_id
    }
    
    if (fields.length === 0) return 0
    
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = @id`
    await query(sql, params)
    return 1
  },

  async remove(id: number) {
    const sql = 'DELETE FROM users WHERE id = @id'
    const result = await query(sql, { id })
    return result.rowsAffected[0]
  }
}
