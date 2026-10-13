import { z } from 'zod'
import { useState } from 'react'

const schema = z.object({
  employee_id: z.number().min(1, 'يجب اختيار موظف'),
  evaluator: z.string().min(1, 'اسم المقيم مطلوب'),
  evaluation_date: z.string().min(1, 'تاريخ التقييم مطلوب'),
  period: z.string().min(1, 'فترة التقييم مطلوبة'),
  score: z.number().min(0).max(100, 'النتيجة يجب أن تكون بين 0 و 100'),
  grade: z.string().min(1, 'التقدير مطلوب'),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  goals: z.string().optional(),
})

type EvaluationFormData = z.infer<typeof schema>

export default function AddEvaluationForm({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    const form = new FormData(e.currentTarget)
    const values = {
      employee_id: Number(form.get('employee_id')),
      evaluator: String(form.get('evaluator') || ''),
      evaluation_date: String(form.get('evaluation_date') || ''),
      period: String(form.get('period') || ''),
      score: Number(form.get('score')),
      grade: String(form.get('grade') || ''),
      strengths: String(form.get('strengths') || ''),
      improvements: String(form.get('improvements') || ''),
      goals: String(form.get('goals') || ''),
    }

    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setError('البيانات غير مكتملة: ' + parsed.error.errors.map(e => e.message).join(', '))
      return
    }

    try {
      setLoading(true)
      
      // Safe IPC call with error handling
      if (window.api?.createRecord) {
        await window.api.createRecord('evaluations', parsed.data)
        onClose()
        
        // Show success message if available
        if (window.toast?.success) {
          window.toast.success('تم حفظ التقييم بنجاح')
        }
        
        // Trigger refresh if event system available
        if (window.events?.emit) {
          window.events.emit('evaluations:refresh')
        }
      } else {
        throw new Error('خدمة الحفظ غير متوفرة')
      }
    } catch (err: any) {
      console.error('create evaluation failed', err)
      setError(err?.message || 'تعذّر حفظ التقييم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="p-6 space-y-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <h2 className="text-xl font-semibold text-right">إضافة تقييم أداء جديد</h2>
        <button 
          type="button" 
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            الموظف *
          </label>
          <select 
            name="employee_id"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            required
          >
            <option value="">اختر الموظف</option>
            <option value="1">أحمد محمد علي - EMP001</option>
            <option value="2">فاطمة عبد الله - EMP002</option>
            <option value="3">خالد عبد الرحمن - EMP003</option>
            <option value="4">سارة أحمد - EMP004</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            المقيم *
          </label>
          <input
            type="text"
            name="evaluator"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="مثال: مدير تقنية المعلومات"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            تاريخ التقييم *
          </label>
          <input
            type="date"
            name="evaluation_date"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            فترة التقييم *
          </label>
          <select 
            name="period"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            required
          >
            <option value="">اختر الفترة</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="Q4 2024">الربع الرابع 2024</option>
            <option value="Q3 2024">الربع الثالث 2024</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            النتيجة (0-100) *
          </label>
          <input
            type="number"
            name="score"
            min="0"
            max="100"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="85"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            التقدير *
          </label>
          <select 
            name="grade"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            required
          >
            <option value="">اختر التقدير</option>
            <option value="ممتاز">ممتاز</option>
            <option value="جيد جداً">جيد جداً</option>
            <option value="جيد">جيد</option>
            <option value="مقبول">مقبول</option>
            <option value="ضعيف">ضعيف</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            نقاط القوة
          </label>
          <textarea
            name="strengths"
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="اذكر نقاط القوة في أداء الموظف..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            نقاط التحسين
          </label>
          <textarea
            name="improvements"
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="اذكر النقاط التي تحتاج إلى تحسين..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            الأهداف المستقبلية
          </label>
          <textarea
            name="goals"
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="حدد الأهداف للفترة القادمة..."
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm text-right">{error}</p>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4 border-t">
        <button 
          type="button" 
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          onClick={onClose}
          disabled={loading}
        >
          إلغاء
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'جارٍ الحفظ…' : 'حفظ التقييم'}
        </button>
      </div>
    </form>
  )
}
