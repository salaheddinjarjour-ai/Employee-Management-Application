import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Button } from '../../components/ui/Button'
import InputText from '../../components/form/InputText'
import InputNumber from '../../components/form/InputNumber'
import { promotionSchema } from '../../schemas/validation'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface AddPromotionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddPromotionModal({ open, onClose, onSuccess }: AddPromotionModalProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({
    employee_id: '',
    old_position: '',
    new_position: '',
    old_salary: '',
    new_salary: '',
    promotion_date: dayjs().format('YYYY-MM-DD'),
    effective_date: dayjs().format('YYYY-MM-DD'),
    reason: '',
    notes: ''
  })

  useEffect(() => {
    if (open) {
      // Load employees
      window.api.getEmployees().then(setEmployees).catch(console.error)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const parsed = promotionSchema.parse(form)
      
      await window.api.createPromotion(parsed)
      
      toast.success('تم إضافة الترقية بنجاح')
      onSuccess()
      onClose()
      
      // Reset form
      setForm({
        employee_id: '',
        old_position: '',
        new_position: '',
        old_salary: '',
        new_salary: '',
        promotion_date: dayjs().format('YYYY-MM-DD'),
        effective_date: dayjs().format('YYYY-MM-DD'),
        reason: '',
        notes: ''
      })
    } catch (error: any) {
      console.error(error)
      toast.error('البيانات غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة ترقية جديدة</DialogTitle>
          <DialogDescription>
            أدخل بيانات الترقية الجديدة في النموذج أدناه
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">الموظف *</label>
              <select
                value={form.employee_id}
                onChange={(e) => setForm(p => ({ ...p, employee_id: e.target.value }))}
                className="input input-bordered w-full"
              >
                <option value="">اختر الموظف</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.full_name} - {emp.employee_no}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المنصب السابق *</label>
              <InputText
                value={form.old_position}
                onChange={(v) => setForm(p => ({ ...p, old_position: v }))}
                placeholder="أدخل المنصب السابق"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المنصب الجديد *</label>
              <InputText
                value={form.new_position}
                onChange={(v) => setForm(p => ({ ...p, new_position: v }))}
                placeholder="أدخل المنصب الجديد"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الراتب السابق *</label>
              <InputNumber
                value={form.old_salary}
                onChange={(v) => setForm(p => ({ ...p, old_salary: v }))}
                placeholder="أدخل الراتب السابق"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الراتب الجديد *</label>
              <InputNumber
                value={form.new_salary}
                onChange={(v) => setForm(p => ({ ...p, new_salary: v }))}
                placeholder="أدخل الراتب الجديد"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تاريخ الترقية *</label>
              <input
                type="date"
                value={form.promotion_date}
                onChange={(e) => setForm(p => ({ ...p, promotion_date: e.target.value }))}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تاريخ السريان *</label>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) => setForm(p => ({ ...p, effective_date: e.target.value }))}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">سبب الترقية *</label>
              <InputText
                value={form.reason}
                onChange={(v) => setForm(p => ({ ...p, reason: v }))}
                placeholder="أدخل سبب الترقية"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="أدخل ملاحظات إضافية"
                className="textarea textarea-bordered w-full"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'إضافة الترقية'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
