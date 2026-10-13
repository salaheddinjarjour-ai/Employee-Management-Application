import { query, queryOne } from '../connection'
import { toISODate } from '../../utils/normalize'

export type NewAbsence = {
  employee_id: number
  from_date: string
  to_date: string
  days_count: number
  type?: string
  hours_missed?: number
  reason?: string
  fine_amount?: number
  status?: string
  direct_manager_notes?: string
  hr_manager_notes?: string
  manager_notes?: string
}

export default {
  async create(data: NewAbsence) {
    console.log('[absencesRepo] Creating absence:', data)

    const payload = {
      ...data,
      from_date: toISODate(data.from_date),
      to_date: toISODate(data.to_date),
      fine_amount: Math.max(0, Number(data.fine_amount || 0))
    }

    const sql = `
      INSERT INTO absences (
        employee_id, from_date, to_date, days_count, type, hours_missed, reason, fine_amount, status, created_at
      )
      VALUES (
        @employee_id, @from_date, @to_date, @days_count, @type, @hours_missed, @reason, @fine_amount, @status, GETDATE()
      );
      SELECT SCOPE_IDENTITY() AS id;
    `

    const result = await query(sql, {
      ...payload,
      type: data.type || 'unexcused',
      hours_missed: Number(data.hours_missed || 0),
      status: data.status || 'مسجل'
    })
    const id = result.recordset[0].id
    console.log('[absencesRepo] Absence created with ID:', id)
    return id
  },

  async update(id: number, data: Partial<NewAbsence>) {
    console.log('[absencesRepo] Updating absence:', id, data)

    const payload = {
      ...data,
      id,
      from_date: data.from_date ? toISODate(data.from_date) : undefined,
      to_date: data.to_date ? toISODate(data.to_date) : undefined,
      fine_amount: data.fine_amount !== undefined ? Math.max(0, Number(data.fine_amount || 0)) : undefined,
      direct_manager_notes: data.direct_manager_notes,
      hr_manager_notes: data.hr_manager_notes,
      manager_notes: data.manager_notes
    }

    // Dynamic update query construction
    const fields = []
    if (payload.employee_id !== undefined) fields.push('employee_id = @employee_id')
    if (payload.from_date !== undefined) fields.push('from_date = @from_date')
    if (payload.to_date !== undefined) fields.push('to_date = @to_date')
    if (payload.days_count !== undefined) fields.push('days_count = @days_count')
    if (payload.type !== undefined) fields.push('type = @type')
    if (payload.hours_missed !== undefined) fields.push('hours_missed = @hours_missed')
    if (payload.reason !== undefined) fields.push('reason = @reason')
    if (payload.fine_amount !== undefined) fields.push('fine_amount = @fine_amount')
    if (payload.status !== undefined) fields.push('status = @status')
    if (payload.direct_manager_notes !== undefined) fields.push('direct_manager_notes = @direct_manager_notes')
    if (payload.hr_manager_notes !== undefined) fields.push('hr_manager_notes = @hr_manager_notes')
    if (payload.manager_notes !== undefined) fields.push('manager_notes = @manager_notes')

    if (fields.length === 0) return 0

    const sql = `
      UPDATE absences 
      SET ${fields.join(', ')}
      WHERE id = @id
    `

    const result = await query(sql, payload)
    console.log('[absencesRepo] Updated absence, rows affected:', result.rowsAffected[0])
    return result.rowsAffected[0]
  },

  async findById(id: number) {
    console.log('[absencesRepo] Finding absence by ID:', id)

    const sql = `
      SELECT a.*, e.full_name as employee_name
      FROM absences a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.id = @id
    `

    const result = await queryOne(sql, { id })
    console.log('[absencesRepo] Found absence:', result)
    return result
  },

  async findAll(filters?: any) {
    console.log('[absencesRepo] Finding all absences with filters:', filters)

    // Check if period filter is provided
    if (filters?.period) {
      const period = String(filters.period).trim()
      console.log('[absencesRepo] Filtering by period:', period)

      const sql = `
        SELECT a.*, e.full_name as employee_name
        FROM absences a
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE strftime('%Y-%m', a.from_date) = @period
        ORDER BY a.from_date DESC, a.id DESC
      `

      const result = await query(sql, { period })
      console.log('[absencesRepo] Found', result.recordset.length, 'absences for period', period)
      return result.recordset
    } else {
      const sql = `
        SELECT a.*, e.full_name as employee_name
        FROM absences a
        LEFT JOIN employees e ON a.employee_id = e.id
        ORDER BY a.from_date DESC, a.id DESC
      `

      const result = await query(sql)
      console.log('[absencesRepo] Found', result.recordset.length, 'absences')
      return result.recordset
    }
  },

  async remove(id: number): Promise<number> {
    console.log('[absencesRepo] Deleting absence with ID:', id)

    const sql = 'DELETE FROM absences WHERE id = @id'
    const result = await query(sql, { id })

    console.log('[absencesRepo] Deleted absence, rows affected:', result.rowsAffected[0])
    return result.rowsAffected[0]
  },

  async findByEmployee(empId: number, { limit = 10, order = 'desc' } = {}) {
    console.log('[absencesRepo] Finding absences by employee:', empId)

    const dir = order === 'asc' ? 'ASC' : 'DESC'
    const sql = `
      SELECT TOP (@limit) a.*, e.full_name as employee_name
      FROM absences a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.employee_id = @empId
      ORDER BY a.id ${dir}
    `

    const result = await query(sql, { empId, limit })
    console.log('[absencesRepo] Found', result.recordset.length, 'absences for employee', empId)
    return result.recordset
  },

  async countByEmployee(empId: number): Promise<number> {
    console.log('[absencesRepo] Counting absences by employee:', empId)

    const sql = 'SELECT COUNT(*) as c FROM absences WHERE employee_id = @empId'
    const result = await queryOne(sql, { empId })
    const count = result?.c || 0

    console.log('[absencesRepo] Found', count, 'absences for employee', empId)
    return count
  }
}
