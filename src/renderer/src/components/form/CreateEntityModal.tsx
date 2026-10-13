import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import Modal from '../ui/Modal'
import Input from './Input'
import Select from './Select'
import DateInput from './DateInput'
import Textarea from './Textarea'
import { EmployeeSearchSelect } from '../forms/EmployeeSearchSelect'

type FieldConfig =
  | { type: 'text' | 'number' | 'email'; name: string; label: string; required?: boolean; placeholder?: string; disabled?: boolean }
  | { type: 'textarea'; name: string; label: string; required?: boolean; placeholder?: string; rows?: number }
  | { type: 'select'; name: string; label: string; required?: boolean; options: Array<{ label: string; value: string | number }>; placeholder?: string }
  | { type: 'date'; name: string; label: string; required?: boolean; disabled?: boolean }
  | { type: 'employee-search'; name: string; label: string; required?: boolean; placeholder?: string }

interface CreateEntityModalProps {
  open: boolean
  onClose: () => void
  title: string
  schema: z.ZodObject<any>
  fields: FieldConfig[]
  entity: 'employees' | 'courses' | 'evaluations' | 'promotions' | 'rewards' | 'leaves' | 'absences' | 'operational-plans' | 'performance-indicators'
  defaults?: Record<string, any>
  recordId?: number
  onSuccess?: () => void
}

export default function CreateEntityModal({
  open,
  onClose,
  title,
  schema,
  fields,
  entity,
  defaults = {},
  recordId,
  onSuccess,
}: CreateEntityModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  // Support multiple employee-search fields
  const [selectedEmps, setSelectedEmps] = useState<Record<string, { id: number, name: string } | null>>({})

  useEffect(() => {
    if (open) {
      const initialEmps: Record<string, { id: number, name: string } | null> = {}
      fields.forEach(f => {
        if (f.type === 'employee-search') {
          const id = defaults?.[f.name] || defaults?.[f.name.replace('_id', '') + '_id']
          const name = defaults?.[f.name.replace('_id', '_name')] || defaults?.[f.name.replace('_id', '') + '_name']
          if (id) {
            initialEmps[f.name] = { id: Number(id), name: name || '' }
          } else {
            initialEmps[f.name] = null
          }
        }
      })
      setSelectedEmps(initialEmps)
      setErr(null)
      setFieldErrors({})
    }
  }, [open, defaults, fields])

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (entity === 'leaves' || entity === 'absences') {
      const form = e.target.form
      if (form) {
        const formData = new FormData(form)
        const fromDate = formData.get('from_date') || formData.get('start_date')
        const toDate = formData.get('to_date') || formData.get('end_date')

        if (fromDate && toDate) {
          const duration = calculateDuration(fromDate as string, toDate as string)
          const durationField = form.querySelector('[name="duration_days"], [name="days_count"]') as HTMLInputElement
          if (durationField) {
            durationField.value = duration.toString()
          }
        }
      }
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)

    const fd = new FormData(e.currentTarget)
    const obj: any = {}

    // Collect form data
    fields.forEach(f => {
      const value = fd.get(f.name)
      if (value !== null && value !== '') {
        if (f.type === 'number') {
          obj[f.name] = Number(value)
        } else if (f.type === 'select') {
          const field = f as any
          if (field.options && field.options[0]) {
            const firstOptionValue = field.options[0].value
            if (typeof firstOptionValue === 'number') {
              obj[f.name] = Number(value)
            } else if (value === 'true' || value === 'false') {
              obj[f.name] = value === 'true'
            } else {
              obj[f.name] = value
            }
          } else {
            obj[f.name] = value
          }
        } else {
          obj[f.name] = value
        }
      } else if (f.type === 'employee-search') {
        // Handled by hidden inputs but let's make sure
        const empId = fd.get(f.name)
        if (empId) obj[f.name] = Number(empId)
      }
    })

    // Capture employee names if needed
    fields.forEach(f => {
      if (f.type === 'employee-search') {
        const nameField = f.name.replace('_id', '_name')
        const nameVal = fd.get(nameField)
        if (nameVal) obj[nameField] = nameVal
      }
    })

    // Auto-calculate duration for leaves/absences
    if (entity === 'leaves' || entity === 'absences') {
      const fromDate = obj.from_date || obj.start_date
      const toDate = obj.to_date || obj.end_date
      if (fromDate && toDate) {
        const duration = calculateDuration(fromDate, toDate)
        if (obj.duration_days !== undefined) obj.duration_days = duration
        if (obj.days_count !== undefined) obj.days_count = duration
      }
    }

    // Validate with Zod
    const parsed = schema.safeParse(obj)
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as any)
      setErr('البيانات غير مكتملة أو غير صحيحة')
      return
    }

    setFieldErrors({})

    try {
      setSubmitting(true)

      let payload: any = { ...parsed.data }

      const toISODate = (val: any) => {
        if (!val) return null
        if (typeof val === 'string') return val.slice(0, 10)
        if (val instanceof Date) return val.toISOString().slice(0, 10)
        return val
      }

      // Date transformations
      if (entity === 'courses') {
        payload.start_date = toISODate(payload.start_date)
        payload.end_date = toISODate(payload.end_date)
      } else if (entity === 'evaluations') {
        payload.evaluation_date = toISODate(payload.evaluation_date) || toISODate(payload.eval_date) || new Date().toISOString().split('T')[0]
        if (!payload.evaluation_date) {
          payload.evaluation_date = new Date().toISOString().split('T')[0]
        }
      } else if (entity === 'promotions') {
        payload.effective_date = toISODate(payload.effective_date)
      } else if (entity === 'rewards') {
        payload.reward_date = toISODate(payload.reward_date)
      } else if (entity === 'leaves' || entity === 'absences') {
        payload.from_date = toISODate(payload.from_date)
        payload.to_date = toISODate(payload.to_date)
      }

      if (recordId) {
        await window.electronAPI.invoke(`records:update`, entity, recordId, payload)
        window.toast?.success?.('تم التحديث بنجاح')
      } else {
        await window.electronAPI.invoke(`records:create`, entity, payload)
        window.toast?.success?.('تم الحفظ بنجاح')
      }

      window.events?.emit?.(`${entity}:refresh`)
      if (payload.employee_id) {
        window.events?.emit?.(`${entity}:refreshOne`, { employee_id: payload.employee_id })
      }

      onSuccess?.()
      onClose()
    } catch (e: any) {
      console.error('[CreateEntityModal] Failed:', e)
      setErr(e?.message || 'تعذر الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (f: FieldConfig) => {
    const common = {
      name: f.name,
      required: f.required,
      defaultValue: defaults?.[f.name] || '',
      disabled: (f as any).disabled || submitting
    }

    if (f.type === 'employee-search') {
      const selected = selectedEmps[f.name] || null
      return (
        <div key={f.name}>
          <label className="block mb-1 text-sm font-medium text-gray-700 text-right">
            {f.label}
            {f.required && <span className="text-red-500 mr-1">*</span>}
          </label>
          <EmployeeSearchSelect
            selectedId={selected?.id}
            onSelect={(emp: any) => setSelectedEmps(prev => ({ ...prev, [f.name]: emp }))}
            placeholder={f.placeholder}
          />
          <input type="hidden" name={f.name} value={selected?.id || ''} />
          <input type="hidden" name={f.name.replace('_id', '_name')} value={selected?.name || ''} />
          {fieldErrors[f.name]?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors[f.name][0]}</p>
          )}
        </div>
      )
    }

    if (f.type === 'text' || f.type === 'email' || f.type === 'number') {
      return (
        <div key={f.name}>
          <label className="block mb-1 text-sm font-medium text-gray-700 text-right">
            {f.label}
            {f.required && <span className="text-red-500 mr-1">*</span>}
          </label>
          <Input
            type={f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : 'text'}
            {...common}
            placeholder={f.placeholder}
            autoFocus={fields[0] === f}
            className={fieldErrors[f.name] ? 'border-red-500' : ''}
          />
          {fieldErrors[f.name]?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors[f.name][0]}</p>
          )}
        </div>
      )
    }

    if (f.type === 'textarea') {
      return (
        <div key={f.name}>
          <label className="block mb-1 text-sm font-medium text-gray-700 text-right">
            {f.label}
            {f.required && <span className="text-red-500 mr-1">*</span>}
          </label>
          <Textarea
            name={f.name}
            defaultValue={defaults?.[f.name] || ''}
            placeholder={f.placeholder}
            rows={f.rows || 3}
            disabled={submitting}
          />
        </div>
      )
    }

    if (f.type === 'select') {
      const selectField = f as any
      return (
        <div key={f.name}>
          <label className="block mb-1 text-sm font-medium text-gray-700 text-right">
            {f.label}
            {f.required && <span className="text-red-500 mr-1">*</span>}
          </label>
          <Select
            name={f.name}
            defaultValue={defaults?.[f.name] || ''}
            options={selectField.options || []}
            placeholder={selectField.placeholder}
            disabled={submitting}
            className={fieldErrors[f.name] ? 'border-red-500' : ''}
          />
          {fieldErrors[f.name]?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors[f.name][0]}</p>
          )}
        </div>
      )
    }

    if (f.type === 'date') {
      return (
        <div key={f.name}>
          <label className="block mb-1 text-sm font-medium text-gray-700 text-right">
            {f.label}
            {f.required && <span className="text-red-500 mr-1">*</span>}
          </label>
          <DateInput
            {...common}
            onChange={handleDateChange}
            className={fieldErrors[f.name] ? 'border-red-500' : ''}
          />
          {fieldErrors[f.name]?.[0] && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors[f.name][0]}</p>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900 text-right">{title}</h2>
      </div>
      <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
        {fields.map(f => (
          <div key={f.name} className={f.type === 'textarea' || f.type === 'employee-search' ? 'md:col-span-2' : ''}>
            {renderField(f)}
          </div>
        ))}

        {err && (
          <p className="col-span-full text-sm text-red-600 text-right bg-red-50 p-3 rounded">
            {err}
          </p>
        )}

        <div className="col-span-full flex justify-end gap-2 pt-4 border-t" dir="rtl">
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            onClick={onClose}
            disabled={submitting}
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  )
}
