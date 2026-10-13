import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { X } from 'lucide-react'
import { evaluationInputSchema } from '../../schemas/evaluation'
import { EmployeeSearchSelect } from './EmployeeSearchSelect'

function scoreToRating(score: string | number): string {
  const n = Number(score)
  if (isNaN(n) || score === '' || score === null) return ''
  if (n <= 49) return 'ضعيف'
  if (n <= 64) return 'وسط'
  if (n <= 74) return 'جيد'
  if (n <= 84) return 'جيد جدًا'
  return 'ممتاز'
}

interface EvaluationFormProps {
  open: boolean
  onClose: () => void
  initial?: any
  onSaved: () => void
  employees: any[]
}

export function EvaluationForm({ open, onClose, initial, onSaved, employees }: EvaluationFormProps) {
  const [form, setForm] = useState({
    employee_id: initial?.employee_id?.toString() ?? '',
    evaluator_id: initial?.evaluator_id?.toString() ?? '',
    period: initial?.period ?? '',
    evaluation_date: initial?.evaluation_date ?? new Date().toISOString().split('T')[0],
    overall_score: initial?.overall_score?.toString() ?? '',
    rating: initial?.overall_score != null ? scoreToRating(initial.overall_score) : (initial?.rating ?? ''),
    goals_percent: initial?.goals_percent?.toString() ?? initial?.goals_achievement?.toString() ?? '0',
    status: initial?.status ?? 'قيد المراجعة',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initial) {
      setForm({
        employee_id: initial.employee_id?.toString() ?? '',
        evaluator_id: initial.evaluator_id?.toString() ?? '',
        period: initial.period ?? '',
        evaluation_date: initial.evaluation_date ?? new Date().toISOString().split('T')[0],
        overall_score: initial.overall_score?.toString() ?? '',
        rating: initial.overall_score != null ? scoreToRating(initial.overall_score) : (initial.rating ?? ''),
        goals_percent: initial.goals_percent?.toString() ?? initial.goals_achievement?.toString() ?? '0',
        status: initial.status ?? 'قيد المراجعة',
      })
    } else if (open) {
      setForm({
        employee_id: '',
        evaluator_id: '',
        period: '',
        evaluation_date: new Date().toISOString().split('T')[0],
        overall_score: '',
        rating: '',
        goals_percent: '0',
        status: 'قيد المراجعة',
      })
      setErrors({})
    }
  }, [initial, open])

  const handleSave = async () => {
    try {
      setLoading(true)
      setErrors({})
      
      // Validate with Zod
      const parsed = evaluationInputSchema.parse(form)
      
      if (initial?.id) {
        await window.api.updateEvaluation(initial.id, parsed)
        if (window.toast?.success) {
          window.toast.success('تم تحديث التقييم بنجاح')
        }
      } else {
        await window.api.createEvaluation(parsed)
        if (window.toast?.success) {
          window.toast.success('تم إضافة التقييم بنجاح')
        }
      }
      
      onSaved()
      onClose()
    } catch (error: any) {
      console.error('Save error:', error)
      
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      
      if (window.toast?.error) {
        window.toast.error('البيانات غير صحيحة')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {initial ? 'تعديل التقييم' : 'إضافة تقييم جديد'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]" dir="rtl">
          <div className="grid grid-cols-2 gap-6">
            {/* الموظف */}
            <div>
              <EmployeeSearchSelect
                selectedId={form.employee_id ? Number(form.employee_id) : null}
                onSelect={(emp) => setForm(prev => ({ ...prev, employee_id: emp?.id?.toString() ?? '' }))}
                error={errors.employee_id}
              />
            </div>

            {/* المُقيِّم */}
            <div>
              <EmployeeSearchSelect
                selectedId={form.evaluator_id ? Number(form.evaluator_id) : null}
                onSelect={(emp) => setForm(prev => ({ ...prev, evaluator_id: emp?.id?.toString() ?? '' }))}
                label="المُقيِّم"
                placeholder="ابحث بالاسم أو الرقم..."
                error={errors.evaluator_id}
              />
            </div>

            {/* الفترة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفترة *
              </label>
              <input
                type="text"
                value={form.period}
                onChange={(e) => setForm(prev => ({ ...prev, period: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.period ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="2025-09 أو 2025-04 — 2025-09"
                required
              />
              {errors.period && (
                <p className="text-red-500 text-sm mt-1">{errors.period}</p>
              )}
            </div>

            {/* تاريخ التقييم */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ التقييم *
              </label>
              <input
                type="date"
                value={form.evaluation_date}
                onChange={(e) => setForm(prev => ({ ...prev, evaluation_date: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.evaluation_date ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.evaluation_date && (
                <p className="text-red-500 text-sm mt-1">{errors.evaluation_date}</p>
              )}
            </div>

            {/* الحالة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="معتمد">معتمد</option>
                <option value="مرفوض">مرفوض</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status}</p>
              )}
            </div>

            {/* الدرجة الإجمالية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدرجة الإجمالية (0-100) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={form.overall_score}
                onChange={(e) => setForm(prev => ({ ...prev, overall_score: e.target.value, rating: scoreToRating(e.target.value) }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.overall_score ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0 - 100"
                required
              />
              {errors.overall_score && (
                <p className="text-red-500 text-sm mt-1">{errors.overall_score}</p>
              )}
            </div>

            {/* التقييم */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التقييم <span className="text-gray-400 text-xs">(يُحتسب تلقائياً)</span>
              </label>
              <div className={`w-full border rounded-md px-3 py-2 bg-gray-50 text-gray-800 font-semibold ${
                form.rating === 'ممتاز' ? 'text-green-700 border-green-300 bg-green-50' :
                form.rating === 'جيد جدًا' ? 'text-blue-700 border-blue-300 bg-blue-50' :
                form.rating === 'جيد' ? 'text-cyan-700 border-cyan-300 bg-cyan-50' :
                form.rating === 'وسط' ? 'text-yellow-700 border-yellow-300 bg-yellow-50' :
                form.rating === 'ضعيف' ? 'text-red-700 border-red-300 bg-red-50' :
                'border-gray-300'
              }`}>
                {form.rating || '—'}
              </div>
              <input type="hidden" name="rating" value={form.rating} />
              {errors.rating && (
                <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !form.employee_id || !form.evaluator_id || !form.period}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </div>
  )
}
