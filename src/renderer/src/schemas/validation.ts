import { z } from 'zod'
import { toNum, employeeNumber, optionalEmail, isoDate } from './common'

// Employee schema
export const employeeSchema = z.object({
  employee_no: employeeNumber,
  full_name: z.string().min(1, "الاسم الكامل مطلوب"),
  hire_date: isoDate,
  job_title: z.string().min(1, "المسمى الوظيفي مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  phone: z.string().optional(),
  email: optionalEmail,
  salary: toNum(0),
  status: z.enum(['active', 'inactive']).default('active')
})

// Promotion schema
export const promotionSchema = z.object({
  employee_id: toNum(0),
  promo_type: z.string().min(1, "نوع الترقية مطلوب"),
  promo_date: isoDate,
  reference: z.string().optional(),
  notes: z.string().optional()
})

// Reward schema
export const rewardSchema = z.object({
  employee_id: toNum(0),
  reward_type: z.enum(['bonus', 'recognition', 'gift', 'other'], {
    required_error: "نوع المكافأة مطلوب"
  }),
  reward_date: isoDate,
  amount: toNum(0),
  reference: z.string().optional(),
  notes: z.string().optional()
})

// Leave schema
export const leaveSchema = z.object({
  employee_id: toNum(0),
  leave_type: z.enum(['annual', 'emergency', 'sick', 'hourly'], {
    required_error: "نوع الإجازة مطلوب"
  }),
  from_date: isoDate,
  to_date: isoDate,
  duration_days: toNum(1),
  notes: z.string().optional()
}).refine((data) => data.to_date >= data.from_date, {
  message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  path: ["to_date"]
})

// Absence schema
export const absenceSchema = z.object({
  employee_id: toNum(0),
  from_date: isoDate,
  to_date: isoDate,
  days_count: toNum(1),
  reason: z.string().optional(),
  fine_amount: z.preprocess(v => Number(v || 0), z.number().min(0).default(0))
}).refine((data) => data.to_date >= data.from_date, {
  message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  path: ["to_date"]
})

// Course Schema
export const courseSchema = z.object({
  employee_id: toNum(0),
  course_name: z.string().min(1, 'اسم الدورة مطلوب'),
  provider: z.string().min(1, 'مقدم الدورة مطلوب'),
  start_date: isoDate,
  end_date: isoDate,
  duration_hours: toNum(1),
  cost: toNum(0),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).default('planned'),
  notes: z.string().optional()
}).refine((data) => data.end_date >= data.start_date, {
  message: 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
  path: ['end_date']
})

// Evaluation Schema  
export const evaluationSchema = z.object({
  employee_id: toNum(0),
  evaluation_period: z.string().min(1, 'فترة التقييم مطلوبة'),
  overall_score: toNum(0),
  performance_notes: z.string().optional(),
  goals_next_period: z.string().optional(),
  evaluator_id: toNum(0),
  evaluation_date: isoDate
})

// Service Year Schema
export const serviceYearSchema = z.object({
  employee_id: toNum(0),
  year: toNum(new Date().getFullYear()),
  service_months: toNum(0),
  bonus_amount: toNum(0),
  currency: z.enum(['USD', 'TRY']).default('USD'),
  notes: z.string().optional()
})

// Helper function to calculate duration
export const calculateDuration = (fromDate: Date, toDate: Date): number => {
  const timeDiff = toDate.getTime() - fromDate.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
}

// Helper function to format date for DB
export const formatDateForDB = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export type EmployeeFormData = z.infer<typeof employeeSchema>
export type PromotionFormData = z.infer<typeof promotionSchema>
export type RewardFormData = z.infer<typeof rewardSchema>
export type LeaveFormData = z.infer<typeof leaveSchema>
export type AbsenceFormData = z.infer<typeof absenceSchema>
export type CourseFormData = z.infer<typeof courseSchema>
export type EvaluationFormData = z.infer<typeof evaluationSchema>
export type ServiceYearFormData = z.infer<typeof serviceYearSchema>
