// Database entity types based on the schema

export interface Employee {
  id: number
  employee_no: string
  full_name: string
  email: string
  phone?: string
  hire_date: string
  department: string
  position: string
  salary_grade_id?: number
  manager_id?: number
  status: 'active' | 'inactive' | 'terminated'
  created_at: string
  updated_at: string
}

export interface SalaryGrade {
  id: number
  grade_name: string
  min_salary: number
  max_salary: number
  currency: 'USD' | 'TRY'
  created_at: string
  updated_at: string
}

export interface Course {
  id: number
  course_name: string
  description?: string
  duration_hours: number
  instructor: string
  max_participants?: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Evaluation {
  id: number
  employee_id: number
  evaluation_period: string
  overall_score: number
  performance_notes?: string
  goals_next_period?: string
  evaluator_id: number
  evaluation_date: string
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: number
  employee_id: number
  from_position: string
  to_position: string
  from_salary_grade_id?: number
  to_salary_grade_id?: number
  promotion_date: string
  reason?: string
  approved_by: number
  created_at: string
  updated_at: string
}

export interface Reward {
  id: number
  employee_id: number
  reward_type: 'bonus' | 'recognition' | 'gift' | 'other'
  amount?: number
  currency?: 'USD' | 'TRY'
  description: string
  reward_date: string
  approved_by: number
  created_at: string
  updated_at: string
}

export interface Leave {
  id: number
  employee_id: number
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency' | 'unpaid'
  start_date: string
  end_date: string
  days_count: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: number
  approved_date?: string
  created_at: string
  updated_at: string
}

export interface Absence {
  id: number
  employee_id: number
  absence_date: string
  absence_type: 'unexcused' | 'late' | 'half_day' | 'no_show'
  hours_missed?: number
  reason?: string
  documented: boolean
  created_at: string
  updated_at: string
}

export interface ServiceYear {
  id: number
  employee_id: number
  year: number
  service_months: number
  bonus_amount?: number
  currency?: 'USD' | 'TRY'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Payroll {
  id: number
  employee_id: number
  pay_period: string
  basic_salary: number
  overtime_hours?: number
  overtime_rate?: number
  bonuses?: number
  deductions?: number
  gross_pay: number
  tax_deductions: number
  net_pay: number
  currency: 'USD' | 'TRY'
  rate_used?: number
  pay_date: string
  created_at: string
  updated_at: string
}

export interface ExchangeRate {
  id: number
  from_currency: 'USD'
  to_currency: 'TRY'
  rate: number
  effective_from: string
  effective_to?: string
  is_active: boolean
  note?: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: number
  entity_type: 'employee' | 'promotion' | 'reward' | 'leave' | 'absence' | 'payroll' | 'evaluation' | 'course'
  entity_id: number
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: number
  created_at: string
}

// Input types for creating new records (without auto-generated fields)
export type CreateEmployee = Omit<Employee, 'id' | 'created_at' | 'updated_at'>
export type CreateSalaryGrade = Omit<SalaryGrade, 'id' | 'created_at' | 'updated_at'>
export type CreateCourse = Omit<Course, 'id' | 'created_at' | 'updated_at'>
export type CreateEvaluation = Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>
export type CreatePromotion = Omit<Promotion, 'id' | 'created_at' | 'updated_at'>
export type CreateReward = Omit<Reward, 'id' | 'created_at' | 'updated_at'>
export type CreateLeave = Omit<Leave, 'id' | 'created_at' | 'updated_at'>
export type CreateAbsence = Omit<Absence, 'id' | 'created_at' | 'updated_at'>
export type CreateServiceYear = Omit<ServiceYear, 'id' | 'created_at' | 'updated_at'>
export type CreatePayroll = Omit<Payroll, 'id' | 'created_at' | 'updated_at'>
export type CreateExchangeRate = Omit<ExchangeRate, 'id' | 'created_at' | 'updated_at'>
export type CreateAttachment = Omit<Attachment, 'id' | 'created_at'>

// Update types for partial updates
export type UpdateEmployee = Partial<CreateEmployee> & { id: number }
export type UpdateSalaryGrade = Partial<CreateSalaryGrade> & { id: number }
export type UpdateCourse = Partial<CreateCourse> & { id: number }
export type UpdateEvaluation = Partial<CreateEvaluation> & { id: number }
export type UpdatePromotion = Partial<CreatePromotion> & { id: number }
export type UpdateReward = Partial<CreateReward> & { id: number }
export type UpdateLeave = Partial<CreateLeave> & { id: number }
export type UpdateAbsence = Partial<CreateAbsence> & { id: number }
export type UpdateServiceYear = Partial<CreateServiceYear> & { id: number }
export type UpdatePayroll = Partial<CreatePayroll> & { id: number }
export type UpdateExchangeRate = Partial<CreateExchangeRate> & { id: number }
