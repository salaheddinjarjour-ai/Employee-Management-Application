import { z } from 'zod'
import { useState } from 'react'

const schema = z.object({
  employee_id: z.number().min(1, 'يجب اختيار موظف'),
  course_name: z.string().min(1, 'اسم الدورة مطلوب'),
  provider: z.string().min(1, 'مقدم الدورة مطلوب'),
  start_date: z.string().min(1, 'تاريخ البداية مطلوب'),
  end_date: z.string().min(1, 'تاريخ النهاية مطلوب'),
  result: z.string().optional(),
  grade: z.string().optional(),
  status: z.enum(['planned', 'ongoing', 'completed']).default('planned'),
})

type CourseFormData = z.infer<typeof schema>

export default function AddCourseForm({ onClose, initialData }: { onClose: () => void; initialData?: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const values = {
      employee_id: Number(form.get('employee_id')),
      course_name: String(form.get('course_name') || ''),
      provider: String(form.get('provider') || ''),
      start_date: String(form.get('start_date') || ''),
      end_date: String(form.get('end_date') || ''),
      result: String(form.get('result') || ''),
      grade: String(form.get('grade') || ''),
      status: String(form.get('status') || 'planned'),
    }

    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setError('البيانات غير مكتملة: ' + parsed.error.errors.map(e => e.message).join(', '))
      return
    }

    try {
      setLoading(true)

      if (isEditing) {
        // Update existing course
        if (window.api?.updateCourse) {
          await window.api.updateCourse(initialData.id, parsed.data)
          onClose()

          // Show success message if available
          if (window.toast?.success) {
            window.toast.success('تم تحديث الدورة بنجاح')
          }

          // Trigger refresh if event system available
          if (window.events?.emit) {
            window.events.emit('courses:refresh')
          }
        } else {
          throw new Error('خدمة التحديث غير متوفرة')
        }
      } else {
        // Create new course
        if (window.api?.createCourse) {
          await window.api.createCourse(parsed.data)
          onClose()

          // Show success message if available
          if (window.toast?.success) {
            window.toast.success('تم حفظ الدورة بنجاح')
          }

          // Trigger refresh if event system available
          if (window.events?.emit) {
            window.events.emit('courses:refresh')
          }
        } else if (window.api?.createRecord) {
          // Fallback
          await window.api.createRecord('courses', parsed.data)
          onClose()
          if (window.toast?.success) window.toast.success('تم حفظ الدورة بنجاح')
          if (window.events?.emit) window.events.emit('courses:refresh')
        } else {
          throw new Error('خدمة الحفظ غير متوفرة')
        }
      }
    } catch (err: any) {
      console.error(isEditing ? 'update course failed' : 'create course failed', err)
      setError(err?.message || (isEditing ? 'تعذّر تحديث الدورة' : 'تعذّر حفظ الدورة'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="p-6 space-y-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <h2 className="text-xl font-semibold text-right">
          {isEditing ? 'تعديل الدورة التدريبية' : 'إضافة دورة تدريبية جديدة'}
        </h2>
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
            defaultValue={initialData?.employee_id || ''}
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
            اسم الدورة *
          </label>
          <input
            type="text"
            name="course_name"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="مثال: React المتقدم"
            required
            defaultValue={initialData?.course_name || ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            مقدم التدريب *
          </label>
          <input
            type="text"
            name="provider"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="مثال: معهد التقنية"
            required
            defaultValue={initialData?.provider || ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            الحالة
          </label>
          <select
            name="status"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            defaultValue={initialData?.status || 'planned'}
          >
            <option value="planned">مخطط</option>
            <option value="ongoing">جاري</option>
            <option value="completed">مكتمل</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            تاريخ البداية *
          </label>
          <input
            type="date"
            name="start_date"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            required
            defaultValue={initialData?.start_date || ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            تاريخ النهاية *
          </label>
          <input
            type="date"
            name="end_date"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            required
            defaultValue={initialData?.end_date || ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            النتيجة
          </label>
          <input
            type="text"
            name="result"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="مثال: ممتاز"
            defaultValue={initialData?.result || ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
            الدرجة
          </label>
          <input
            type="text"
            name="grade"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
            placeholder="مثال: 95"
            defaultValue={initialData?.grade || ''}
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
          {loading ? 'جارٍ الحفظ…' : (isEditing ? 'تحديث الدورة' : 'حفظ الدورة')}
        </button>
      </div>
    </form>
  )
}
