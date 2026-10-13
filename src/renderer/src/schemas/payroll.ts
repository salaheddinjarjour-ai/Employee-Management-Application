import { z } from 'zod'

export const lineSchema = z.object({
  category: z.enum(['allowance', 'exception', 'breakdown', 'cash', 'indemnity', 'deduction'], {
    errorMap: () => ({ message: 'نوع البند غير صحيح' })
  }),
  label: z.string().min(1, 'اسم البند مطلوب'),
  currency: z.enum(['TRY', 'USD'], {
    errorMap: () => ({ message: 'العملة غير صحيحة' })
  }),
  amount: z.preprocess(v => Number(v), z.number().min(0, 'المبلغ يجب أن يكون موجب')),
})

export const payrollHeaderSchema = z.object({
  employee_id: z.preprocess(v => Number(v), z.number().min(1, 'اختر الموظف')),
  period: z.string().min(7, 'الفترة مطلوبة (YYYY-MM)'),
  id_number: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  admin_level: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  edu_actual: z.string().optional().nullable(),
  edu_required: z.string().optional().nullable(),
  base_min: z.preprocess(v => Number(v), z.number().min(0, 'الحد الأدنى يجب أن يكون موجب')),
  years_of_exp: z.preprocess(v => Number(v), z.number().min(0, 'سنوات الخبرة يجب أن تكون موجبة')),
  max_experience_years: z.preprocess(v => Number(v), z.number().min(0).optional()).optional(),
  notes: z.string().optional().nullable(),
})

export const payrollPayloadSchema = z.object({
  header: payrollHeaderSchema,
  lines: z.array(lineSchema).min(1, 'يجب إضافة بند واحد على الأقل'),
  experienceRateTRY: z.preprocess(v => Number(v), z.number().min(0, 'معدل الخبرة يجب أن يكون موجب')).default(0),
})

export type PayrollLine = z.infer<typeof lineSchema>
export type PayrollHeader = z.infer<typeof payrollHeaderSchema>
export type PayrollPayload = z.infer<typeof payrollPayloadSchema>
