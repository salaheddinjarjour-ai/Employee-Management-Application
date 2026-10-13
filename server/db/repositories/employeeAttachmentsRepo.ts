import { query, queryOne } from '../connection'

export type EmployeeAttachment = {
  id: number
  employee_id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export type NewEmployeeAttachment = Omit<EmployeeAttachment, 'id' | 'uploaded_at'>

export default {
  async findByEmployee(employeeId: number) {
    console.log('[employeeAttachmentsRepo] Finding attachments for employee:', employeeId)
    const sql = `
      SELECT * FROM employee_attachments 
      WHERE employee_id = @employeeId 
      ORDER BY uploaded_at DESC
    `
    const result = await query(sql, { employeeId })
    return result.recordset
  },

  async create(data: NewEmployeeAttachment) {
    console.log('[employeeAttachmentsRepo] Creating attachment:', data.file_name)
    const sql = `
      INSERT INTO employee_attachments (
        employee_id, file_name, file_path, file_type, file_size, uploaded_at
      )
      VALUES (
        @employee_id, @file_name, @file_path, @file_type, @file_size, GETDATE()
      );
      SELECT SCOPE_IDENTITY() AS id;
    `
    const result = await query(sql, data)
    const id = result.recordset[0].id
    return this.findById(id)
  },

  async findById(id: number) {
    const sql = `SELECT * FROM employee_attachments WHERE id = @id`
    return await queryOne(sql, { id })
  },

  async delete(id: number) {
    console.log('[employeeAttachmentsRepo] Deleting attachment:', id)
    const sql = `DELETE FROM employee_attachments WHERE id = @id`
    const result = await query(sql, { id })
    return result.rowsAffected[0]
  }
}
