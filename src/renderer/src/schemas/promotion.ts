import { z } from 'zod'

const toNum = () => z.preprocess(v => {
  const s = (v ?? '').toString().trim().replace(',', '.')
  return s === '' ? undefined : Number(s)
}, z.number().optional())

export const promotionInputSchema = z.object({
  employee_id: z.preprocess(v => Number(v), z.number().min(1, 'اختر الموظف')),
  employee_name: z.string().optional(),
  from_title: z.string().optional(),
  to_title: z.string().optional(),
  from_grade: toNum(),
  to_grade: toNum(),
  promo_type: z.enum(['درجة', 'مسمى', 'سنوية', 'استثنائية', 'أخرى'], {
    errorMap: () => ({ message: 'اختر نوع الترقية' })
  }),
  status: z.enum(['في الانتظار', 'معتمد', 'منفذ', 'مرفوض'], {
    errorMap: () => ({ message: 'اختر حالة الترقية' })
  }),
  effective_date: z.string().min(4, 'اختر تاريخ السريان'),
  increase_amount_usd: toNum(),   // optional
  increase_currency: z.string().optional(),
  increase_percent: toNum(),      // optional
  notes: z.string().optional(),
}).refine(v => v.increase_amount_usd !== undefined || v.increase_percent !== undefined || true, {
  message: 'يمكن ترك زيادة الراتب فارغة (مبلغ/نسبة اختياريان).',
})

export type PromotionInput = z.infer<typeof promotionInputSchema>