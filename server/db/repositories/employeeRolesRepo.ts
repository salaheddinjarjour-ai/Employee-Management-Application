import { query, queryOne } from '../connection'

export type EmployeeRole = {
    id?: number
    employee_id: number
    role_type: 'department' | 'unit' | 'committee' | string
    entity_name: string
    job_title: string
    created_at?: string
}

export default {
    async findByEmployeeId(employeeId: number): Promise<EmployeeRole[]> {
        console.log('[employeeRolesRepo] Finding roles for employee:', employeeId)
        const sql = 'SELECT * FROM employee_roles WHERE employee_id = @employeeId ORDER BY role_type, created_at'
        const result = await query(sql, { employeeId })
        return result.recordset
    },

    async create(data: EmployeeRole): Promise<number> {
        console.log('[employeeRolesRepo] Creating role:', data)
        const sql = `
      INSERT INTO employee_roles (employee_id, role_type, entity_name, job_title, created_at)
      VALUES (@employee_id, @role_type, @entity_name, @job_title, GETDATE());
      SELECT SCOPE_IDENTITY() AS id;
    `
        const result = await query(sql, data)
        return result.recordset[0].id
    },

    async deleteForEmployee(employeeId: number): Promise<number> {
        console.log('[employeeRolesRepo] Deleting roles for employee:', employeeId)
        const sql = 'DELETE FROM employee_roles WHERE employee_id = @employeeId'
        const result = await query(sql, { employeeId })
        return result.rowsAffected[0]
    },

    async replaceForEmployee(employeeId: number, roles: Omit<EmployeeRole, 'employee_id'>[]): Promise<void> {
        // Delete existing
        await this.deleteForEmployee(employeeId)

        // Insert new
        for (const role of roles) {
            await this.create({
                ...role,
                employee_id: employeeId
            })
        }
    },

    // Gets roles grouped by employee_id for list views
    async getAllGroupedByEmployee(): Promise<Record<number, EmployeeRole[]>> {
        const list = await query('SELECT * FROM employee_roles ORDER BY employee_id, role_type, created_at')

        const grouped: Record<number, EmployeeRole[]> = {}
        for (const row of list.recordset) {
            if (!grouped[row.employee_id]) grouped[row.employee_id] = []
            grouped[row.employee_id].push(row)
        }

        return grouped
    }
}
