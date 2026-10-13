import { query, queryOne } from '../connection'

export default {
    async findAll(filters?: any) {
        const sql = `
      SELECT 
        e.id as employee_id,
        e.id as id,
        e.full_name as employee_name,
        e.hire_date,
        CAST((julianday('now') - julianday(e.hire_date)) / 365.25 AS INTEGER) as years_of_service,
        CAST(((julianday('now') - julianday(e.hire_date)) / 30.44) AS INTEGER) % 12 as months_of_service,
        CAST(julianday('now') - julianday(e.hire_date) AS INTEGER) as total_days
      FROM employees e
      WHERE e.status = 'active'
      ORDER BY e.hire_date ASC
    `
        const result = await query(sql)

        // Enrich with milestones and benefits (mocked/calculated)
        const records = result.recordset.map((r: any) => {
            const years = r.years_of_service || 0
            const milestones: string[] = []
            if (years >= 1) milestones.push('سنة واحدة')
            if (years >= 3) milestones.push('3 سنوات')
            if (years >= 5) milestones.push('5 سنوات')
            if (years >= 10) milestones.push('10 سنوات')

            const benefits: string[] = []
            if (years >= 1) benefits.push('تأمين صحي أساسي')
            if (years >= 3) benefits.push('إجازة إضافية')
            if (years >= 5) benefits.push('مكافأة الخدمة', 'تأمين صحي متقدم')

            let nextMilestone = 'سنة واحدة'
            let targetYears = 1
            if (years >= 10) { nextMilestone = '15 سنة'; targetYears = 15; }
            else if (years >= 5) { nextMilestone = '10 سنوات'; targetYears = 10; }
            else if (years >= 3) { nextMilestone = '5 سنوات'; targetYears = 5; }
            else if (years >= 1) { nextMilestone = '3 سنوات'; targetYears = 3; }

            const daysToNext = (targetYears * 365) - r.total_days

            return {
                ...r,
                milestones,
                benefits_eligible: benefits,
                next_milestone: nextMilestone,
                days_to_next_milestone: daysToNext > 0 ? daysToNext : 0
            }
        })

        return records
    },

    async findById(id: number) {
        const result = await queryOne('SELECT * FROM service_years WHERE id = @id', { id })
        return result
    },

    async create(data: any) {
        const sql = `
      INSERT INTO service_years (employee_id, year, service_months, bonus_amount, currency, notes)
      VALUES (@employee_id, @year, @service_months, @bonus_amount, @currency, @notes);
      SELECT SCOPE_IDENTITY() AS id;
    `
        const result = await queryOne(sql, {
            employee_id: data.employee_id,
            year: data.year,
            service_months: data.service_months || 12,
            bonus_amount: data.bonus_amount || 0,
            currency: data.currency || 'USD',
            notes: data.notes || null
        })
        return result.id
    },

    async update(id: number, data: any) {
        const sql = `
      UPDATE service_years
      SET employee_id = @employee_id, year = @year, service_months = @service_months, 
          bonus_amount = @bonus_amount, currency = @currency, notes = @notes
      WHERE id = @id
    `
        await query(sql, {
            id,
            employee_id: data.employee_id,
            year: data.year,
            service_months: data.service_months || 12,
            bonus_amount: data.bonus_amount || 0,
            currency: data.currency || 'USD',
            notes: data.notes || null
        })
        return 1
    },

    async remove(id: number) {
        const sql = 'DELETE FROM service_years WHERE id = @id'
        const result = await query(sql, { id })
        return result.rowsAffected[0]
    }
}
