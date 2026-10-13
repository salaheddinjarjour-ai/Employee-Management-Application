import { query } from '../connection'

export interface PivotRole {
    id: number;
    job_title?: string;
    is_primary: boolean;
}

export const employeePivotRepo = {
    async syncDepartments(employeeId: number, departments: PivotRole[]): Promise<void> {
        // 1. Delete existing
        await query('DELETE FROM employee_departments WHERE employee_id = @empId', { empId: employeeId });

        // 2. Insert new
        if (!departments || departments.length === 0) return;

        for (const dept of departments) {
            await query(`
                INSERT INTO employee_departments (employee_id, department_id, job_title, is_primary)
                VALUES (@empId, @deptId, @jobTitle, @isPrimary)
            `, {
                empId: employeeId,
                deptId: dept.id,
                jobTitle: dept.job_title || null,
                isPrimary: dept.is_primary ? 1 : 0
            });
        }
    },

    async syncUnits(employeeId: number, units: PivotRole[]): Promise<void> {
        // 1. Delete existing
        await query('DELETE FROM employee_units WHERE employee_id = @empId', { empId: employeeId });

        // 2. Insert new
        if (!units || units.length === 0) return;

        for (const u of units) {
            await query(`
                INSERT INTO employee_units (employee_id, unit_id, job_title, is_primary)
                VALUES (@empId, @unitId, @jobTitle, @isPrimary)
            `, {
                empId: employeeId,
                unitId: u.id,
                jobTitle: u.job_title || null,
                isPrimary: u.is_primary ? 1 : 0
            });
        }
    },

    async syncCommittees(employeeId: number, committees: PivotRole[]): Promise<void> {
        // 1. Delete existing
        await query('DELETE FROM employee_committees WHERE employee_id = @empId', { empId: employeeId });

        // 2. Insert new
        if (!committees || committees.length === 0) return;

        for (const com of committees) {
            await query(`
                INSERT INTO employee_committees (employee_id, committee_id, role_title, is_primary)
                VALUES (@empId, @comId, @roleTitle, @isPrimary)
            `, {
                empId: employeeId,
                comId: com.id,
                roleTitle: com.job_title || null, // mapping job_title to role_title for committees based on schema
                isPrimary: com.is_primary ? 1 : 0
            });
        }
    },

    async getRoles(employeeIds: number[]): Promise<any[]> {
        if (!employeeIds || employeeIds.length === 0) return [];

        const placeholders = employeeIds.map((_, i) => `@id${i}`).join(',');
        const parameters: any = {};
        employeeIds.forEach((id, i) => { parameters[`id${i}`] = id; });

        const sql = `
            SELECT ed.employee_id, 'department' as role_type, d.name as entity_name, d.id as entity_id, ed.job_title, ed.is_primary
            FROM employee_departments ed JOIN departments d ON ed.department_id = d.id WHERE ed.employee_id IN (${placeholders})
            UNION ALL
            SELECT eu.employee_id, 'unit' as role_type, u.name as entity_name, u.id as entity_id, eu.job_title, eu.is_primary
            FROM employee_units eu JOIN units u ON eu.unit_id = u.id WHERE eu.employee_id IN (${placeholders})
            UNION ALL
            SELECT ec.employee_id, 'committee' as role_type, c.name as entity_name, c.id as entity_id, ec.role_title as job_title, ec.is_primary
            FROM employee_committees ec JOIN committees c ON ec.committee_id = c.id WHERE ec.employee_id IN (${placeholders})
        `;

        const result = await query(sql, parameters);
        return result.recordset.map((r: any) => ({
            ...r,
            is_primary: Boolean(r.is_primary)
        }));
    }
}
