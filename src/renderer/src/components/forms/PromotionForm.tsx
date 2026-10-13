import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { X } from 'lucide-react'
import { promotionInputSchema } from '../../schemas/promotion'
import { EmployeeSearchSelect } from './EmployeeSearchSelect'

interface PromotionFormProps {
  open: boolean
  onClose: () => void
  initial?: any
  onSaved: () => void
  employees: any[]
}

export function PromotionForm({ open, onClose, initial, onSaved, employees }: PromotionFormProps) {
  const [form, setForm] = useState({
    employee_id: initial?.employee_id?.toString() ?? '',
    employee_name: initial?.employee_name ?? '',
    from_title: initial?.from_title ?? '',
    to_title: initial?.to_title ?? '',
    from_grade: initial?.from_grade?.toString() ?? '',
    to_grade: initial?.to_grade?.toString() ?? '',
    promo_type: initial?.promo_type ?? 'درجة',
    status: initial?.status ?? 'في الانتظار',
    effective_date: initial?.effective_date ?? '',
    increase_amount_usd: initial?.increase_amount_usd?.toString() ?? '',
    increase_currency: initial?.increase_currency ?? 'USD',
    increase_percent: initial?.increase_percent?.toString() ?? '',
    notes: initial?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initial) {
      setForm({
        employee_id: initial.employee_id?.toString() ?? '',
        employee_name: initial.employee_name ?? '',
        from_title: initial.from_title ?? '',
        to_title: initial.to_title ?? '',
        from_grade: initial.from_grade?.toString() ?? '',
        to_grade: initial.to_grade?.toString() ?? '',
        promo_type: initial.promo_type ?? 'درجة',
        status: initial.status ?? 'في الانتظار',
        effective_date: initial.effective_date ?? '',
        increase_amount_usd: initial.increase_amount_usd?.toString() ?? '',
        increase_currency: initial.increase_currency ?? 'USD',
        increase_percent: initial.increase_percent?.toString() ?? '',
        notes: initial.notes ?? '',
      })
    }
  }, [initial])

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrors({})
      
      // Validate with Zod
      const parsed = promotionInputSchema.parse(form)
      
      if (initial?.id) {
        await window.api.updatePromotion(initial.id, parsed)
        if (window.toast?.success) {
          window.toast.success('تم تحديث الترقية بنجاح')
        }
      } else {
        await window.api.createPromotion(parsed)
        if (window.toast?.success) {
          window.toast.success('تم إضافة الترقية بنجاح')
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
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {initial ? 'تعديل ترقية' : 'إضافة ترقية جديدة'}
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
                onSelect={(emp) => setForm(prev => ({ ...prev, employee_id: emp?.id?.toString() ?? '', employee_name: emp?.full_name ?? '' }))}
                error={errors.employee_id}
              />
            </div>

            {/* نوع الترقية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الترقية *
              </label>
              <select
                value={form.promo_type}
                onChange={(e) => setForm(prev => ({ ...prev, promo_type: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.promo_type ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="درجة">درجة</option>
                <option value="مسمى">مسمى</option>
                <option value="سنوية">سنوية</option>
                <option value="استثنائية">استثنائية</option>
                <option value="أخرى">أخرى</option>
              </select>
              {errors.promo_type && (
                <p className="text-red-500 text-sm mt-1">{errors.promo_type}</p>
              )}
            </div>

            {/* المسمى السابق */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المسمى السابق
              </label>
              <input
                type="text"
                value={form.from_title}
                onChange={(e) => setForm(prev => ({ ...prev, from_title: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.from_title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="المسمى السابق"
              />
              {errors.from_title && (
                <p className="text-red-500 text-sm mt-1">{errors.from_title}</p>
              )}
            </div>

            {/* المسمى الجديد */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المسمى الجديد
              </label>
              <input
                type="text"
                value={form.to_title}
                onChange={(e) => setForm(prev => ({ ...prev, to_title: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.to_title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="المسمى الجديد"
              />
              {errors.to_title && (
                <p className="text-red-500 text-sm mt-1">{errors.to_title}</p>
              )}
            </div>

            {/* الدرجة السابقة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدرجة السابقة
              </label>
              <input
                type="number"
                value={form.from_grade}
                onChange={(e) => setForm(prev => ({ ...prev, from_grade: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.from_grade ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الدرجة السابقة"
              />
              {errors.from_grade && (
                <p className="text-red-500 text-sm mt-1">{errors.from_grade}</p>
              )}
            </div>

            {/* الدرجة الجديدة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدرجة الجديدة
              </label>
              <input
                type="number"
                value={form.to_grade}
                onChange={(e) => setForm(prev => ({ ...prev, to_grade: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.to_grade ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الدرجة الجديدة"
              />
              {errors.to_grade && (
                <p className="text-red-500 text-sm mt-1">{errors.to_grade}</p>
              )}
            </div>

            {/* تاريخ السريان */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ السريان *
              </label>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) => setForm(prev => ({ ...prev, effective_date: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.effective_date ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.effective_date && (
                <p className="text-red-500 text-sm mt-1">{errors.effective_date}</p>
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
                <option value="في الانتظار">في الانتظار</option>
                <option value="معتمد">معتمد</option>
                <option value="منفذ">منفذ</option>
                <option value="مرفوض">مرفوض</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status}</p>
              )}
            </div>

            {/* زيادة على الراتب */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                زيادة على الراتب (اختياري)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.increase_amount_usd}
                  onChange={(e) => setForm(prev => ({ ...prev, increase_amount_usd: e.target.value }))}
                  className={`flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.increase_amount_usd ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="مثال: 100.50"
                />
                <select
                  value={form.increase_currency}
                  onChange={(e) => setForm(prev => ({ ...prev, increase_currency: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                >
                  <option value="USD">$ دولار</option>
                  <option value="TRY">₺ ليرة</option>
                </select>
              </div>
              {errors.increase_amount_usd && (
                <p className="text-red-500 text-sm mt-1">{errors.increase_amount_usd}</p>
              )}
            </div>

            {/* نسبة الزيادة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نسبة الزيادة % (اختياري)
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.1"
                value={form.increase_percent}
                onChange={(e) => setForm(prev => ({ ...prev, increase_percent: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.increase_percent ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="مثال: 15.5"
              />
              {errors.increase_percent && (
                <p className="text-red-500 text-sm mt-1">{errors.increase_percent}</p>
              )}
            </div>

            {/* ملاحظات */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.notes ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
              {errors.notes && (
                <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.employee_id || !form.effective_date}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </div>
  )
}
