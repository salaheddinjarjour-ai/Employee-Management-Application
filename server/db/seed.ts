import { query, queryOne } from './connection'

export async function seedIfEmpty() {
  const row = await queryOne('SELECT COUNT(*) as c FROM employees')
  const count = row?.c as number
  if (count < 3) {
    // Clear existing and add fresh seed data
    await query('DELETE FROM employees')
    
    const employees = [
      { no: '001', name: 'أحمد محمد علي', date: '2023-01-01', title: 'مطوّر أول', dept: 'تقنية المعلومات', status: 'active' },
      { no: '002', name: 'فاطمة عبد الله', date: '2023-02-15', title: 'محاسب', dept: 'المحاسبة', status: 'active' },
      { no: '003', name: 'خالد عبد الرحمن', date: '2023-03-10', title: 'أخصائي تسويق', dept: 'التسويق', status: 'active' }
    ]
    
    for (const emp of employees) {
      await query(`
        INSERT INTO employees (employee_no, full_name, hire_date, job_title, department, status)
        VALUES (@no, @name, @date, @title, @dept, @status)
      `, emp)
    }
    
    console.log(`[db] seeded ${employees.length} employees`)
  }
}

