import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { Button } from '../../components/ui/Button'
import InputText from '../../components/form/InputText'
import InputNumber from '../../components/form/InputNumber'
import { employeeSchema } from '../../schemas/validation'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface AddEmployeeModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const DEPARTMENTS = [
  'الموارد البشرية',
  'تكنولوجيا المعلومات',
  'المالية',
  'التسويق',
  'المبيعات',
  'العمليات',
  'خدمة العملاء'
]

const JOB_TITLES = [
  'مطور برمجيات',
  'مدير مشروع',
  'محاسب',
  'مسوق رقمي',
  'مندوب مبيعات',
  'موظف خدمة عملاء',
  'مدير قسم',
  'أخصائي موارد بشرية'
]

export function AddEmployeeModal({ open, onClose, onSuccess }: AddEmployeeModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    employee_no: '',
    full_name: '',
    hire_date: dayjs().format('YYYY-MM-DD'),
    job_title: '',
    department: '',
    phone: '',
    email: '',
    salary: '',
    status: 'active'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const parsed = employeeSchema.parse(form)
      
      await window.api.createEmployee(parsed)
      
      toast.success('تم إضافة الموظف بنجاح')
      onSuccess?.()
      onClose()
      
      // Reset form
      setForm({
        employee_no: '',
        full_name: '',
        hire_date: dayjs().format('YYYY-MM-DD'),
        job_title: '',
        department: '',
        phone: '',
        email: '',
        salary: '',
        status: 'active'
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
          <DialogTitle>إضافة موظف جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف الجديد في النموذج أدناه
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">رقم الموظف *</label>
              <InputText
                value={form.employee_no}
                onChange={(v) => setForm(p => ({ ...p, employee_no: v }))}
                placeholder="أدخل رقم الموظف (مثال: 1 أو 001)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الاسم الكامل *</label>
              <InputText
                value={form.full_name}
                onChange={(v) => setForm(p => ({ ...p, full_name: v }))}
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المسمى الوظيفي *</label>
              <select
                value={form.job_title}
                onChange={(e) => setForm(p => ({ ...p, job_title: e.target.value }))}
                className="input input-bordered w-full"
              >
                <option value="">اختر المسمى الوظيفي</option>
                {JOB_TITLES.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">القسم *</label>
              <select
                value={form.department}
                onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))}
                className="input input-bordered w-full"
              >
                <option value="">اختر القسم</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
              <InputText
                value={form.phone}
                onChange={(v) => setForm(p => ({ ...p, phone: v }))}
                placeholder="أدخل رقم الهاتف"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
              <InputText
                value={form.email}
                onChange={(v) => setForm(p => ({ ...p, email: v }))}
                placeholder="أدخل البريد الإلكتروني"
                type="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">تاريخ التوظيف *</label>
              <input
                type="date"
                value={form.hire_date}
                onChange={(e) => setForm(p => ({ ...p, hire_date: e.target.value }))}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الراتب</label>
              <InputNumber
                value={form.salary}
                onChange={(v) => setForm(p => ({ ...p, salary: v }))}
                placeholder="أدخل الراتب"
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">الحالة</label>
              <select
                value={form.status}
                onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                className="input input-bordered w-full"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'إضافة الموظف'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
