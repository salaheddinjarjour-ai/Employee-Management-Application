import { query, queryOne } from '../connection'

export default {
  async findAll(filters?: any) {
    const sql = 'SELECT * FROM locations ORDER BY name'
    const result = await query(sql)
    return result.recordset
  },

  async findById(id: number) {
    const result = await queryOne('SELECT * FROM locations WHERE id = @id', { id })
    return result
  },

  async create(data: any) {
    const sql = `
      INSERT INTO locations (name, address)
      VALUES (@name, @address);
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await queryOne(sql, { 
      name: data.name, 
      address: data.address || null 
    })
    return result.id
  },

  async update(id: number, data: any) {
    const sql = `
      UPDATE locations
      SET name = @name, address = @address
      WHERE id = @id
    `
    await query(sql, { 
      id, 
      name: data.name, 
      address: data.address || null 
    })
    return 1
  },

  async remove(id: number) {
    const sql = 'DELETE FROM locations WHERE id = @id'
    const result = await query(sql, { id })
    return result.rowsAffected[0]
  }
}
