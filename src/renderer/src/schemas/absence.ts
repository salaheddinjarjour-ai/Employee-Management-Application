import { z } from 'zod'

export const absenceSchema = z.object({
  employee_id: z.coerce.number().int().positive('يجب اختيار موظف صالح'),
  employee_name: z.string().optional(),
  from_date: z.coerce.date({ errorMap: () => ({ message: 'تاريخ البداية غير صالح' }) }),
  to_date: z.coerce.date({ errorMap: () => ({ message: 'تاريخ النهاية غير صالح' }) }),
  days_count: z.coerce.number().int().positive('عدد الأيام يجب أن يكون رقم موجب'),
  type: z.string().optional().default('unexcused'), // absence_type
  hours_missed: z.coerce.number().min(0).optional().default(0),
  reason: z.string().optional().default(''),
  status: z.string().optional().default('reported'),
  notes: z.string().optional().default(''),
  fine_amount: z.coerce.number().min(0).optional().default(0),
  fine_currency: z.string().optional().default('TRY'),
  penalty_applied: z.boolean().optional().default(false),
  penalty_amount: z.coerce.number().min(0).optional().default(0),
  reported_by: z.string().optional().default(''),
  reported_date: z.string().optional().default(''),
  direct_manager_notes: z.string().optional().default(''),
  hr_manager_notes: z.string().optional().default(''),
  manager_notes: z.string().optional().default(''),
}).refine(v => v.to_date >= v.from_date, {
  message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
  path: ['to_date'],
})

export type AbsenceFormData = z.infer<typeof absenceSchema>
