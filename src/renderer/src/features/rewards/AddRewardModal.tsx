import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Button } from '../../components/ui/Button'
import InputText from '../../components/form/InputText'
import InputNumber from '../../components/form/InputNumber'
import { rewardSchema } from '../../schemas/validation'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface AddRewardModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddRewardModal({ open, onClose, onSuccess }: AddRewardModalProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({
    employee_id: '',
    reward_type: 'مكافأة مالية',
    amount: '',
    reason: '',
    reward_date: dayjs().format('YYYY-MM-DD'),
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
      const parsed = rewardSchema.parse(form)
      
      await window.api.createReward(parsed)
      
      toast.success('تم إضافة المكافأة بنجاح')
      onSuccess()
      onClose()
      
      // Reset form
      setForm({
        employee_id: '',
        reward_type: 'مكافأة مالية',
        amount: '',
        reason: '',
        reward_date: dayjs().format('YYYY-MM-DD'),
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
          <DialogTitle>إضافة مكافأة جديدة</DialogTitle>
          <DialogDescription>
            أدخل بيانات المكافأة الجديدة في النموذج أدناه
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
              <label className="block text-sm font-medium mb-2">نوع المكافأة *</label>
              <select
                value={form.reward_type}
                onChange={(e) => setForm(p => ({ ...p, reward_type: e.target.value }))}
                className="input input-bordered w-full"
              >
                <option value="مكافأة مالية">مكافأة مالية</option>
                <option value="شهادة تقدير">شهادة تقدير</option>
                <option value="ترقية">ترقية</option>
                <option value="إجازة إضافية">إجازة إضافية</option>
                <option value="مكافأة عينية">مكافأة عينية</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المبلغ</label>
              <InputNumber
                value={form.amount}
                onChange={(v) => setForm(p => ({ ...p, amount: v }))}
                placeholder="أدخل مبلغ المكافأة"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تاريخ المكافأة *</label>
              <input
                type="date"
                value={form.reward_date}
                onChange={(e) => setForm(p => ({ ...p, reward_date: e.target.value }))}
                className="input input-bordered w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">سبب المكافأة *</label>
              <InputText
                value={form.reason}
                onChange={(v) => setForm(p => ({ ...p, reason: v }))}
                placeholder="أدخل سبب المكافأة"
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
              {loading ? 'جاري الحفظ...' : 'إضافة المكافأة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
