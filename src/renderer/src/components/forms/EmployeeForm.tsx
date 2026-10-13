import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../ui/utils'
import { Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface Employee {
  id?: number
  employee_no: string
  full_name: string
  email: string
  department?: string
  position?: string
  hire_date: string
  salary_grade_id: number
  phone?: string
  status: 'active' | 'inactive'
}

interface SalaryGrade {
  id: number
  grade_name: string
  min_salary: number
  max_salary: number
}

interface EmployeeFormProps {
  employee?: Employee
  onSave?: (employee: Employee) => Promise<boolean>
  onCancel?: () => void
  className?: string
}

export function EmployeeForm({ employee, onSave, onCancel, className }: EmployeeFormProps) {
  const [formData, setFormData] = useState<Employee>({
    employee_no: '',
    full_name: '',
    email: '',
    department: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary_grade_id: 1,
    phone: '',
    status: 'active',
    ...employee
  })
  
  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load salary grades
  useEffect(() => {
    // Mock salary grades - in real app, fetch from database
    setSalaryGrades([
      { id: 1, grade_name: 'الدرجة الأولى', min_salary: 3000, max_salary: 5000 },
      { id: 2, grade_name: 'الدرجة الثانية', min_salary: 5000, max_salary: 8000 },
      { id: 3, grade_name: 'الدرجة الثالثة', min_salary: 8000, max_salary: 12000 },
      { id: 4, grade_name: 'الدرجة الرابعة', min_salary: 12000, max_salary: 18000 },
      { id: 5, grade_name: 'الدرجة الخامسة', min_salary: 18000, max_salary: 25000 },
    ])
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.employee_no.trim()) {
      newErrors.employee_no = 'رقم الموظف مطلوب'
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'الاسم الكامل مطلوب'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
    }
    if (!formData.hire_date) {
      newErrors.hire_date = 'تاريخ التوظيف مطلوب'
    }

    // Employee number format validation
    if (formData.employee_no && !/^[0-9]+$/.test(formData.employee_no)) {
      newErrors.employee_no = 'رقم الموظف يجب أن يكون أرقامًا فقط (مثال: 1 أو 001)'
    }

    // Phone validation
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج')
      return
    }

    if (!onSave) {
      toast.error('وظيفة الحفظ غير متوفرة')
      return
    }

    setIsSubmitting(true)
    
    try {
      const success = await onSave(formData)
      if (success) {
        toast.success(employee ? 'تم تحديث بيانات الموظف بنجاح' : 'تم إضافة الموظف بنجاح')
        if (!employee) {
          // Reset form for new employee
          setFormData({
            employee_no: '',
            full_name: '',
            email: '',
            department: '',
            position: '',
            hire_date: new Date().toISOString().split('T')[0],
            salary_grade_id: 1,
            phone: '',
            status: 'active'
          })
        }
      } else {
        toast.error('فشل في حفظ بيانات الموظف')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('حدث خطأ أثناء حفظ البيانات')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border", className)}>
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          {employee ? 'تحديث بيانات الموظف' : 'إضافة موظف جديد'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">المعلومات الأساسية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الموظف *
              </label>
              <input
                type="text"
                value={formData.employee_no}
                onChange={(e) => handleChange('employee_no', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.employee_no ? "border-red-500" : "border-gray-300"
                )}
                placeholder="EMP001"
                disabled={!!employee} // Don't allow changing employee number for existing employees
              />
              {errors.employee_no && (
                <p className="text-red-500 text-xs mt-1">{errors.employee_no}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم الكامل *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.full_name ? "border-red-500" : "border-gray-300"
                )}
                placeholder="أحمد محمد علي"
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.email ? "border-red-500" : "border-gray-300"
                )}
                placeholder="ahmed@company.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.phone ? "border-red-500" : "border-gray-300"
                )}
                placeholder="+90 555 123 4567"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Job Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">معلومات الوظيفة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                القسم
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="تكنولوجيا المعلومات"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المنصب
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مطور برمجيات أول"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ التوظيف *
              </label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleChange('hire_date', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.hire_date ? "border-red-500" : "border-gray-300"
                )}
              />
              {errors.hire_date && (
                <p className="text-red-500 text-xs mt-1">{errors.hire_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                درجة الراتب
              </label>
              <select
                value={formData.salary_grade_id}
                onChange={(e) => handleChange('salary_grade_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {salaryGrades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.grade_name} (${grade.min_salary.toLocaleString()} - ${grade.max_salary.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-reverse space-x-3 pt-6 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </form>
    </div>
  )
}
