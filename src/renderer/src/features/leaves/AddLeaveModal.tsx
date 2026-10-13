import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Button } from '../../components/ui/Button'
import InputText from '../../components/form/InputText'
import InputNumber from '../../components/form/InputNumber'
import { leaveSchema } from '../../schemas/validation'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface AddLeaveModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddLeaveModal({ open, onClose, onSuccess }: AddLeaveModalProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({
    employee_id: '',
    leave_type: 'إجازة سنوية',
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    days_count: '',
    reason: '',
    status: 'pending',
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
      const parsed = leaveSchema.parse(form)
      
      await window.api.createLeave(parsed)
      
      toast.success('تم إضافة الإجازة بنجاح')
      onSuccess()
      onClose()
      
      // Reset form
      setForm({
        employee_id: '',
        leave_type: 'إجازة سنوية',
        start_date: dayjs().format('YYYY-MM-DD'),
        end_date: dayjs().format('YYYY-MM-DD'),
        days_count: '',
        reason: '',
        status: 'pending',
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
          <DialogTitle>إضافة إجازة جديدة</DialogTitle>
          <DialogDescription>
            أدخل بيانات الإجازة الجديدة في النموذج أدناه
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
              <label className="block text-sm font-medium mb-2">نوع الإجازة *</label>
              <select
                value={form.leave_type}
                onChange={(e) => setForm(p => ({ ...p, leave_type: e.target.value }))}
                className="input input-bordered w-full"
              >
                <option value="إجازة سنوية">إجازة سنوية</option>
                <option value="إجازة مرضية">إجازة مرضية</option>
                <option value="إجازة طارئة">إجازة طارئة</option>
                <option value="إجازة أمومة">إجازة أمومة</option>
                <option value="إجازة أبوة">إجازة أبوة</option>
                <option value="إجازة بدون راتب">إجازة بدون راتب</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تاريخ البداية *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تاريخ النهاية *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">عدد الأيام *</label>
              <InputNumber
                value={form.days_count}
                onChange={(v) => setForm(p => ({ ...p, days_count: v }))}
                placeholder="أدخل عدد الأيام"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الحالة</label>
              <select
                value={form.status}
                onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                className="input input-bordered w-full"
              >
                <option value="pending">في الانتظار</option>
                <option value="approved">موافق عليها</option>
                <option value="rejected">مرفوضة</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">سبب الإجازة *</label>
              <InputText
                value={form.reason}
                onChange={(v) => setForm(p => ({ ...p, reason: v }))}
                placeholder="أدخل سبب الإجازة"
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
              {loading ? 'جاري الحفظ...' : 'إضافة الإجازة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
