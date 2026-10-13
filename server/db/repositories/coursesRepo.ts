import { query, queryOne } from '../connection'

export type NewCourse = {
  employee_id: number
  course_name: string
  provider: string
  start_date: string
  end_date: string
  result?: string
  grade?: string
  status?: 'planned' | 'ongoing' | 'completed'
  attachment_name?: string
  attachment_path?: string
  attachment_size?: number
}

export default {
  async create(data: NewCourse) {
    console.log('[coursesRepo] Creating course:', data)
    
    const sql = `
      INSERT INTO courses (
        employee_id, course_name, provider, start_date, end_date,
        result, grade, status, attachment_name, attachment_path, attachment_size, created_at
      )
      VALUES (
        @employee_id, @course_name, @provider, @start_date, @end_date,
        @result, @grade, COALESCE(@status, 'planned'), @attachment_name, @attachment_path, @attachment_size, GETDATE()
      );
      SELECT SCOPE_IDENTITY() AS id;
    `
    
    const result = await query(sql, {
      ...data,
      status: data.status || 'planned',
      attachment_name: data.attachment_name || null,
      attachment_path: data.attachment_path || null,
      attachment_size: data.attachment_size || null
    })
    
    const id = result.recordset[0].id
    console.log('[coursesRepo] Course created with ID:', id)
    return id
  },

  async findAll(filters?: any) {
    console.log('[coursesRepo] Finding all courses with filters:', filters)
    
    const sql = `
      SELECT c.*, e.full_name as employee_name
      FROM courses c
      LEFT JOIN employees e ON c.employee_id = e.id
      ORDER BY c.id DESC
    `
    
    const result = await query(sql)
    console.log('[coursesRepo] Found', result.recordset.length, 'courses')
    return result.recordset
  },

  async remove(id: number): Promise<number> {
    console.log('[coursesRepo] Deleting course with ID:', id)
    
    const sql = 'DELETE FROM courses WHERE id = @id'
    const result = await query(sql, { id })
    
    console.log('[coursesRepo] Deleted course, rows affected:', result.rowsAffected[0])
    return result.rowsAffected[0]
  },

  async findByEmployee(empId: number, { limit = 10, order = 'desc' } = {}) {
    console.log('[coursesRepo] Finding courses by employee:', empId)
    
    const dir = order === 'asc' ? 'ASC' : 'DESC'
    const sql = `
      SELECT TOP (@limit) c.*, e.full_name as employee_name
      FROM courses c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.employee_id = @empId
      ORDER BY c.id ${dir}
    `
    
    const result = await query(sql, { empId, limit })
    console.log('[coursesRepo] Found', result.recordset.length, 'courses for employee', empId)
    return result.recordset
  },

  async countByEmployee(empId: number): Promise<number> {
    console.log('[coursesRepo] Counting courses by employee:', empId)
    
    const sql = 'SELECT COUNT(*) as count FROM courses WHERE employee_id = @empId'
    const result = await queryOne(sql, { empId })
    const count = result?.count || 0
    
    console.log('[coursesRepo] Found', count, 'courses for employee', empId)
    return count
  },

  async findById(id: number) {
    console.log('[coursesRepo] Finding course by ID:', id)
    
    const sql = `
      SELECT c.*, e.full_name as employee_name
      FROM courses c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.id = @id
    `
    
    const result = await queryOne(sql, { id })
    console.log('[coursesRepo] Found course:', result)
    return result
  },

  async update(id: number, data: Partial<NewCourse>) {
    console.log('[coursesRepo] Updating course with ID:', id, 'data:', data)
    
    const fields = Object.keys(data)
    if (fields.length === 0) return 0
    
    const setClause = fields.map(key => `${key} = @${key}`).join(', ')
    
    const sql = `
      UPDATE courses 
      SET ${setClause}, updated_at = GETDATE()
      WHERE id = @id
    `
    
    const result = await query(sql, { ...data, id })
    console.log('[coursesRepo] Updated course, rows affected:', result.rowsAffected[0])
    return result.rowsAffected[0]
  }
}
