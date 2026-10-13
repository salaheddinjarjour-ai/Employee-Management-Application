import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Button } from '../../components/ui/Button'
import { InputNumber } from '../../components/forms/InputNumber'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { serviceYearSchema } from '../../schemas/validation'
import { useCreateRecord, useListRecords } from '../../hooks/useCreateRecord'
import { toast } from 'sonner'

interface AddServiceYearModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddServiceYearModal({ open, onClose, onSuccess }: AddServiceYearModalProps) {
  const [employees, setEmployees] = useState<any[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [year, setYear] = useState('')
  const [serviceMonths, setServiceMonths] = useState('')
  const [bonusAmount, setBonusAmount] = useState('')
  const [currency, setCurrency] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createRecord = useCreateRecord()
  const { fetchData: fetchEmployees } = useListRecords('employees')

  useEffect(() => {
    if (open) {
      fetchEmployees().then(setEmployees).catch(console.error)
    }
  }, [open, fetchEmployees])

  const resetForm = () => {
    setEmployeeId('')
    setYear(new Date().getFullYear().toString())
    setServiceMonths('12')
    setBonusAmount('')
    setCurrency('USD')
    setNotes('')
    setErrors({})
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const formData = {
        employee_id: employeeId,
        year: year,
        service_months: serviceMonths,
        bonus_amount: bonusAmount,
        currency: currency,
        notes: notes
      }

      const validatedData = serviceYearSchema.parse(formData)

      await createRecord.mutateAsync({
        entity: 'service_years',
        payload: validatedData
      })

      toast.success('تم إضافة سنة الخدمة بنجاح', {
        description: 'تم حفظ بيانات سنة الخدمة والمكافأة'
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        console.error('Submission error:', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>إضافة سنة خدمة جديدة</DialogTitle>
          <DialogDescription>
            أدخل بيانات سنة الخدمة والمكافأة المستحقة في النموذج أدناه
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">الموظف *</label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.full_name} - {employee.employee_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>
              )}
            </div>

            <InputNumber
              label="السنة"
              value={year}
              onChange={setYear}
              error={errors.year}
              min="1900"
              max={(currentYear + 10).toString()}
            />

            <InputNumber
              label="عدد أشهر الخدمة"
              value={serviceMonths}
              onChange={setServiceMonths}
              error={errors.service_months}
              min="0"
              max="12"
              placeholder="12"
            />

            <div>
              <label className="block text-sm font-medium mb-2">العملة *</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  <SelectItem value="TRY">ليرة تركية (TRY)</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-red-500 text-sm mt-1">{errors.currency}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <InputNumber
                label="مبلغ المكافأة (اختياري)"
                value={bonusAmount}
                onChange={setBonusAmount}
                error={errors.bonus_amount}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ملاحظات (اختياري)</label>
            <Textarea
              placeholder="ملاحظات إضافية حول سنة الخدمة أو المكافأة..."
              className="min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'إضافة سنة الخدمة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
