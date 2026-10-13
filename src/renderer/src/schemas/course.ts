import { z } from 'zod'

export const courseSchema = z.object({
  employee_id: z.coerce.number().int().positive('يجب اختيار موظف صالح'),
  course_name: z.string().min(1, 'اسم الدورة مطلوب'),
  provider: z.string().min(1, 'مقدم التدريب مطلوب'),
  start_date: z.coerce.date({ invalid_type_error: 'تاريخ البداية غير صالح' }),
  end_date: z.coerce.date({ invalid_type_error: 'تاريخ النهاية غير صالح' }),
  status: z.enum(['planned', 'ongoing', 'completed'], { 
    required_error: 'حالة الدورة مطلوبة',
    invalid_type_error: 'حالة الدورة غير صالحة'
  }),
  result: z.string().optional().default(''),
  grade: z.union([z.coerce.number(), z.string()]).optional().transform(v => (v ?? '').toString()),
}).refine(v => v.end_date >= v.start_date, {
  message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
  path: ['end_date'],
})

export type CourseFormData = z.infer<typeof courseSchema>
