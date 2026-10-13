import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/Button'
import { InputText } from '../../components/forms/InputText'
import { InputNumber } from '../../components/forms/InputNumber'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { useCreateRecord } from '../../hooks/useCreateRecord'
import { absenceSchema, type AbsenceFormData, formatDateForDB, calculateDuration } from '../../schemas/validation'
import { EmployeeSearchSelect } from '../../components/forms/EmployeeSearchSelect'

interface AddAbsenceModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddAbsenceModal({ open, onClose, onSuccess }: AddAbsenceModalProps) {
  const [employeeId, setEmployeeId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [daysCount, setDaysCount] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { mutateAsync } = useCreateRecord({
    onSuccess: () => {
      onSuccess?.()
      onClose()
    }
  })

  // Auto-calculate days when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      try {
        const calculatedDays = calculateDuration(new Date(fromDate), new Date(toDate))
        setDaysCount(calculatedDays.toString())
      } catch (error) {
        console.error('Error calculating duration:', error)
      }
    }
  }, [fromDate, toDate])

  const resetForm = () => {
    setEmployeeId('')
    setFromDate('')
    setToDate('')
    setDaysCount('')
    setReason('')
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
        from_date: fromDate,
        to_date: toDate,
        days_count: daysCount,
        reason: reason
      }

      const validatedData = absenceSchema.parse(formData)
      
      const payload = {
        ...validatedData,
        from_date: formatDateForDB(validatedData.from_date),
        to_date: formatDateForDB(validatedData.to_date)
      }

      await mutateAsync({
        entity: 'absences',
        payload
      })
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>إضافة غياب جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">الموظف *</label>
            <EmployeeSearchSelect
              selectedId={employeeId ? Number(employeeId) : null}
              onSelect={(emp) => setEmployeeId(emp?.id?.toString() ?? '')}
              error={errors.employee_id}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">من تاريخ *</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.from_date && (
                <p className="text-red-500 text-sm mt-1">{errors.from_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">إلى تاريخ *</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.to_date && (
                <p className="text-red-500 text-sm mt-1">{errors.to_date}</p>
              )}
            </div>

            <InputNumber
              label="عدد الأيام"
              value={daysCount}
              onChange={setDaysCount}
              error={errors.days_count}
              readOnly={fromDate && toDate ? true : false}
              className={fromDate && toDate ? 'bg-gray-50' : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">سبب الغياب</label>
            <Textarea 
              placeholder="أدخل سبب الغياب" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
