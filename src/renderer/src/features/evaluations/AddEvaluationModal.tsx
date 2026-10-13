import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Button } from '../../components/ui/Button'
import InputText from '../../components/form/InputText'
import InputNumber from '../../components/form/InputNumber'
import { evaluationSchema } from '../../schemas/validation'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface AddEvaluationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddEvaluationModal({ open, onClose, onSuccess }: AddEvaluationModalProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({
    employee_id: '',
    evaluation_period: '',
    overall_score: '',
    performance_notes: '',
    goals_next_period: '',
    evaluator_id: '',
    evaluation_date: dayjs().format('YYYY-MM-DD')
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
      const parsed = evaluationSchema.parse(form)
      
      await window.api.createEvaluation(parsed)
      
      toast.success('تم إضافة التقييم بنجاح')
      onSuccess()
      onClose()
      
      // Reset form
      setForm({
        employee_id: '',
        evaluation_period: '',
        overall_score: '',
        performance_notes: '',
        goals_next_period: '',
        evaluator_id: '',
        evaluation_date: dayjs().format('YYYY-MM-DD')
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
          <DialogTitle>إضافة تقييم أداء جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات تقييم الأداء الجديد في النموذج أدناه
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">الموظف المُقيم *</label>
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
              <label className="block text-sm font-medium mb-2">المقيم *</label>
              <select
                value={form.evaluator_id}
                onChange={(e) => setForm(p => ({ ...p, evaluator_id: e.target.value }))}
                className="input input-bordered w-full"
              >
                <option value="">اختر المقيم</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.full_name} - {emp.employee_no}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">فترة التقييم *</label>
              <InputText
                value={form.evaluation_period}
                onChange={(v) => setForm(p => ({ ...p, evaluation_period: v }))}
                placeholder="مثل: الربع الأول 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">النتيجة الإجمالية *</label>
              <InputNumber
                value={form.overall_score}
                onChange={(v) => setForm(p => ({ ...p, overall_score: v }))}
                placeholder="أدخل النتيجة من 1 إلى 5"
                min="1"
                max="5"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تاريخ التقييم *</label>
              <input
                type="date"
                value={form.evaluation_date}
                onChange={(e) => setForm(p => ({ ...p, evaluation_date: e.target.value }))}
                className="input input-bordered w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">ملاحظات الأداء</label>
              <textarea
                value={form.performance_notes}
                onChange={(e) => setForm(p => ({ ...p, performance_notes: e.target.value }))}
                placeholder="أدخل ملاحظات حول أداء الموظف"
                className="textarea textarea-bordered w-full"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">أهداف الفترة القادمة</label>
              <textarea
                value={form.goals_next_period}
                onChange={(e) => setForm(p => ({ ...p, goals_next_period: e.target.value }))}
                placeholder="أدخل الأهداف المطلوبة للفترة القادمة"
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
              {loading ? 'جاري الحفظ...' : 'إضافة التقييم'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
