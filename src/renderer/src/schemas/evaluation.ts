import { z } from 'zod'

const toNum = (fallback = 0) => z.preprocess((v) => {
  const s = String(v ?? '').trim().replace(',', '.')
  const n = s === '' ? fallback : Number(s)
  return isNaN(n) ? fallback : n
}, z.number())

export const evaluationInputSchema = z.object({
  employee_id: toNum(0).refine(n => n > 0, 'اختر الموظف'),
  evaluator_id: toNum(0).refine(n => n > 0, 'اختر المُقيِّم'),
  period: z.string().min(4, 'ادخل الفترة'),
  evaluation_date: z.string().min(1, 'ادخل تاريخ التقييم'),
  overall_score: toNum(0).refine(n => n >= 0 && n <= 100, 'الدرجة يجب أن تكون بين 0 و 100'),
  rating: z.enum(['ضعيف', 'وسط', 'جيد', 'جيد جدًا', 'ممتاز', 'يحتاج تحسين', 'مقبول'], {
    errorMap: () => ({ message: 'اختر تقييم صحيح' })
  }),
  goals_percent: toNum(0).refine(n => n >= 0 && n <= 100, 'النسبة يجب أن تكون بين 0 و 100'),
  status: z.enum(['قيد المراجعة', 'معتمد', 'مرفوض'], {
    errorMap: () => ({ message: 'اختر حالة صحيحة' })
  }),
  notes: z.string().optional(),
})

export type EvaluationInput = z.infer<typeof evaluationInputSchema>

// Legacy schema for compatibility
export const evaluationSchema = evaluationInputSchema