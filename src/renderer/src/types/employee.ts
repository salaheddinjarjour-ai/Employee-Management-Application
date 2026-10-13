export interface EmployeeLite {
  id: number
  full_name: string
  employee_no?: string
  job_title?: string
  department?: string
}

export interface Employee extends EmployeeLite {
  hire_date?: string
  phone?: string
  email?: string
  status?: 'active' | 'inactive' | 'leave'
  created_at?: string
  updated_at?: string
}
