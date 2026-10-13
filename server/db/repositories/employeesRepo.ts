import { query, queryOne } from '../connection'
import { employeePivotRepo, PivotRole } from './employeePivotRepo'

export type NewEmployee = {
  employee_no: string
  full_name: string
  hire_date: string
  job_title: string
  department: string
  phone?: string | null
  email?: string | null
  status?: 'active' | 'inactive' | 'leave'
  education_degree?: string | null
  category?: string | null
  grade?: string | null
  notes?: string | null
}

function normalizeEmployeeNo(employeeNo: string): string {
  if (!employeeNo) return employeeNo
  return employeeNo.replace(/^EMP/i, '')
}

function normalizeEmployeeRecord(record: any): any {
  if (!record) return record
  return {
    ...record,
    employee_no: normalizeEmployeeNo(record.employee_no)
  }
}

export default {
  async create(data: NewEmployee) {
    console.log('[employeesRepo] Creating employee:', data)

    const sql = `
      INSERT INTO employees (
        employee_no, full_name, hire_date, job_title, department, position, 
        phone, email, status, education_degree, category, grade, notes, created_at
      )
      VALUES (
        @employee_no, @full_name, @hire_date, @job_title, @department, @position,
        @phone, @email, COALESCE(@status, 'active'), @education_degree, @category, @grade, @notes, GETDATE()
      );
      SELECT SCOPE_IDENTITY() AS id;
    `

    const result = await query(sql, {
      ...data,
      job_title: data.job_title || null,
      department: data.department || null,
      position: data.job_title || 'غير محدد',
      phone: data.phone || null,
      email: data.email || `no-email-${data.employee_no}@system.local`,
      status: data.status || 'active',
      education_degree: data.education_degree || null,
      category: data.category || null,
      grade: data.grade || null,
      notes: data.notes || null
    })

    const id = result.recordset[0].id
    console.log('[employeesRepo] Employee created with ID:', id)
    return id
  },

  async findAll(filters?: any) {
    console.log('[employeesRepo] Finding all employees with filters:', filters)

    const sql = `
      SELECT * FROM employees 
      ORDER BY employee_no ASC, full_name ASC
    `

    const result = await query(sql)
    const normalizedResult = result.recordset.map(normalizeEmployeeRecord)

    // Attach roles
    if (normalizedResult.length > 0) {
      const ids = normalizedResult.map(e => e.id)
      const roles = await employeePivotRepo.getRoles(ids)

      const roleMap: Record<number, any[]> = {}
      roles.forEach(r => {
        if (!roleMap[r.employee_id]) roleMap[r.employee_id] = []
        roleMap[r.employee_id].push(r)
      })

      normalizedResult.forEach((e: Record<string, any>) => {
        e.roles = roleMap[e.id] || []
      })
    }

    console.log('[employeesRepo] Found', normalizedResult.length, 'employees')
    return normalizedResult
  },

  async findById(id: number) {
    console.log('[employeesRepo] Finding employee by ID:', id)

    const sql = 'SELECT * FROM employees WHERE id = @id'
    const result = await queryOne(sql, { id })

    const normalizedResult = normalizeEmployeeRecord(result)

    // Attach roles
    if (normalizedResult) {
      const roles = await employeePivotRepo.getRoles([normalizedResult.id])
      normalizedResult.roles = roles || []
    }

    console.log('[employeesRepo] Found employee:', normalizedResult)
    return normalizedResult
  },

  async findByEmployeeNo(employeeNo: string) {
    console.log('[employeesRepo] Finding employee by employee_no:', employeeNo)

    let sql = 'SELECT * FROM employees WHERE employee_no = @employeeNo'
    let result = await queryOne(sql, { employeeNo })

    if (!result && !/^EMP/i.test(employeeNo)) {
      const empPrefixed = `EMP${employeeNo.padStart(3, '0')}`
      result = await queryOne(sql, { employeeNo: empPrefixed })
    }

    const normalizedResult = normalizeEmployeeRecord(result)
    console.log('[employeesRepo] Found employee:', normalizedResult)
    return normalizedResult
  },

  async findByEmail(email: string) {
    console.log('[employeesRepo] Finding employee by email:', email)

    const sql = 'SELECT * FROM employees WHERE email = @email'
    const result = await queryOne(sql, { email })

    const normalizedResult = normalizeEmployeeRecord(result)
    console.log('[employeesRepo] Found employee by email:', normalizedResult ? 'Yes' : 'No')
    return normalizedResult
  },

  async upsertByEmployeeNo(data: NewEmployee): Promise<number> {
    console.log('[employeesRepo] Upserting employee by employee_no:', data.employee_no)

    const existing = await this.findByEmployeeNo(data.employee_no) as any

    if (existing) {
      console.log('[employeesRepo] Updating existing employee:', existing.id)

      const sql = `
        UPDATE employees SET 
          full_name = @full_name,
          hire_date = @hire_date,
          job_title = @job_title,
          department = COALESCE(@department, department),
          position = COALESCE(@position, position),
          phone = COALESCE(@phone, phone),
          email = COALESCE(@email, email),
          status = COALESCE(@status, status),
          education_degree = COALESCE(@education_degree, education_degree),
          category = COALESCE(@category, category),
          grade = COALESCE(@grade, grade),
          notes = COALESCE(@notes, notes),
          updated_at = GETDATE()
        WHERE employee_no = @employee_no
      `

      await query(sql, {
        ...data,
        job_title: data.job_title || null,
        department: data.department || null,
        position: data.job_title || 'غير محدد',
        phone: data.phone || null,
        email: data.email || `no-email-${data.employee_no}@system.local`,
        status: data.status || 'active',
        education_degree: data.education_degree || null,
        category: data.category || null,
        grade: data.grade || null,
        notes: data.notes || null
      })

      return existing.id
    } else {
      return this.create(data)
    }
  },

  async update(id: number, data: any) {
    console.log('[employeesRepo] Updating employee with ID:', id, 'data:', data)

    const fields = Object.keys(data)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map(key => `${key} = @${key}`).join(', ')

    const sql = `
      UPDATE employees 
      SET ${setClause}, updated_at = GETDATE()
      WHERE id = @id
    `

    await query(sql, { ...data, id })
    console.log('[employeesRepo] Updated employee')
    return this.findById(id)
  },

  async remove(id: number): Promise<number> {
    console.log('[employeesRepo] Deleting employee with ID:', id)

    const sql = 'DELETE FROM employees WHERE id = @id'
    const result = await query(sql, { id })

    console.log('[employeesRepo] Deleted employee, rows affected:', result.rowsAffected[0])
    return result.rowsAffected[0]
  },

  async listBasic() {
    console.log('[employeesRepo] Finding basic employee list for dropdowns')
    const sql = `
      SELECT id, full_name, employee_no 
      FROM employees 
      WHERE status = 'active' OR status IS NULL
      ORDER BY full_name ASC
    `
    const result = await query(sql)

    console.log(`[employeesRepo] Found ${result.recordset.length} active employees for dropdown`)
    return result.recordset.map(normalizeEmployeeRecord)
  },

  async search(queryStr: string, limit: number = 20) {
    console.log('[employeesRepo] Searching employees with query:', queryStr)

    if (!queryStr || queryStr.trim().length === 0) {
      const basic = await this.listBasic()
      return basic.slice(0, limit)
    }

    const searchTerm = `%${queryStr.trim()}%`
    const exactTerm = `${queryStr.trim()}%`

    const sql = `
      SELECT TOP (@limit) id, full_name, employee_no, job_title, department
      FROM employees 
      WHERE (status = 'active' OR status IS NULL)
        AND (full_name LIKE @searchTerm 
             OR employee_no LIKE @searchTerm
             OR job_title LIKE @searchTerm)
      ORDER BY 
        CASE 
          WHEN full_name LIKE @exactTerm THEN 1
          WHEN full_name LIKE @searchTerm THEN 2
          ELSE 3
        END,
        full_name ASC
    `

    const result = await query(sql, {
      searchTerm,
      exactTerm,
      limit
    })

    console.log(`[employeesRepo] Found ${result.recordset.length} employees matching "${queryStr}"`)
    return result.recordset.map(normalizeEmployeeRecord)
  },

  async getProfile(id: number) {
    const employee = await this.findById(id)
    if (!employee) return null

    // Parallel queries for counts
    const [
      coursesCount,
      evaluationsCount,
      promotionsCount,
      rewardsCount,
      leavesCount,
      absencesCount
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM courses WHERE employee_id = @id', { id }),
      queryOne('SELECT COUNT(*) as count FROM evaluations WHERE employee_id = @id', { id }),
      queryOne('SELECT COUNT(*) as count FROM promotions WHERE employee_id = @id', { id }),
      queryOne('SELECT COUNT(*) as count FROM rewards WHERE employee_id = @id', { id }),
      queryOne('SELECT COUNT(*) as count FROM leaves WHERE employee_id = @id', { id }),
      queryOne('SELECT COUNT(*) as count FROM absences WHERE employee_id = @id', { id })
    ])

    // Fetch recent items (top 5) for each category
    const [
      recentCourses,
      recentEvaluations,
      recentPromotions,
      recentRewards,
      recentLeaves,
      recentAbsences
    ] = await Promise.all([
      query('SELECT TOP 5 * FROM courses WHERE employee_id = @id ORDER BY start_date DESC', { id }),
      query('SELECT TOP 5 * FROM evaluations WHERE employee_id = @id ORDER BY created_at DESC', { id }),
      query('SELECT TOP 5 * FROM promotions WHERE employee_id = @id ORDER BY effective_date DESC', { id }),
      query('SELECT TOP 5 * FROM rewards WHERE employee_id = @id ORDER BY reward_date DESC', { id }),
      query('SELECT TOP 5 * FROM leaves WHERE employee_id = @id ORDER BY from_date DESC', { id }),
      query('SELECT TOP 5 * FROM absences WHERE employee_id = @id ORDER BY from_date DESC', { id })
    ])

    return {
      employee,
      counts: {
        courses: coursesCount?.count || 0,
        evaluations: evaluationsCount?.count || 0,
        promotions: promotionsCount?.count || 0,
        rewards: rewardsCount?.count || 0,
        leaves: leavesCount?.count || 0,
        absences: absencesCount?.count || 0
      },
      recent: {
        courses: recentCourses.recordset,
        evaluations: recentEvaluations.recordset,
        promotions: recentPromotions.recordset,
        rewards: recentRewards.recordset,
        leaves: recentLeaves.recordset,
        absences: recentAbsences.recordset
      }
    }
  }
}
