import React, { useState, useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { X, Calculator, Save } from 'lucide-react'
import dayjs from 'dayjs'
import { payrollInputsSchema, PayrollInputs } from '../../schemas/payrollInputsSchema'
import { payrollDraftStorage, PayrollDraft } from '../../utils/localStorage'
import InputNumber from '../../components/form/InputNumber'

interface PayrollPreview {
  usd: {
    total_salary: number
    gross_salary: number
    daily_rate: number
    hourly_rate: number
    overtime_amount: number
    total_deductions: number
    net_salary: number
  }
  try: {
    total_salary: number
    gross_salary: number
    daily_rate: number
    hourly_rate: number
    overtime_amount: number
    total_deductions: number
    net_salary: number
  }
  rate: number
}

interface Employee {
  id: number
  full_name: string
  employee_no: string
  department: string
  position: string
}

interface CreatePayslipDrawerProps {
  open: boolean
  month: string
  onClose: () => void
  onSaved?: (id: number) => void
}

export function CreatePayslipDrawer({ open, month, onClose, onSaved }: CreatePayslipDrawerProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [inputs, setInputs] = useState({
    base_salary_usd: '',
    admin_allowance_usd: '',
    education_allowance_usd: '',
    housing_allowance_usd: '',
    transport_allowance_usd: '',
    col_allowance_usd: '',
    children_allowance_usd: '',
    special_allowance_usd: '',
    fuel_allowance_usd: '',
    eos_accrual_usd: '',
    exceptional_additions_usd: '',
    overtime_hours: '',
    deduction_loan_penalty_usd: '',
    deduction_payment_usd: '',
    deductions_other_usd: '',
  })
  const [preview, setPreview] = useState<PayrollPreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  // Safe async wrapper
  async function safeRun(fn: () => Promise<void>) {
    if (isLoading || isSaving) return
    try {
      await fn()
    } catch (err) {
      console.error(err)
      window.toast?.error?.('حدث خطأ غير متوقع')
    }
  }

  // Load draft from localStorage on mount
  useEffect(() => {
    if (open) {
      const draft = payrollDraftStorage.load()
      if (draft && draft.month === month) {
        setSelectedEmployeeId(draft.employeeId)
        setInputs(draft.inputs)
      }
    }
  }, [open, month])

  // Save draft to localStorage when inputs change
  useEffect(() => {
    if (selectedEmployeeId && Object.values(inputs).some(v => v !== '' && v !== '0')) {
      const draft: PayrollDraft = {
        employeeId: selectedEmployeeId,
        month,
        inputs,
        lastModified: Date.now()
      }
      payrollDraftStorage.save(draft)
    }
  }, [selectedEmployeeId, inputs, month])
  useEffect(() => {
    if (open) {
      loadEmployees()
    }
  }, [open])

  // Prefill data when employee is selected
  useEffect(() => {
    if (selectedEmployeeId && month) {
      prefillData(selectedEmployeeId, month)
    }
  }, [selectedEmployeeId, month])

  // Live calculation when inputs change
  useEffect(() => {
    if (selectedEmployeeId && inputs.base_salary_usd !== '' && parseFloat(inputs.base_salary_usd) > 0) {
      const timeoutId = setTimeout(() => {
        setIsCalculating(true)
        calculatePreview().finally(() => setIsCalculating(false))
      }, 300) // Debounce
      return () => clearTimeout(timeoutId)
    }
  }, [inputs, selectedEmployeeId])

  const loadEmployees = async () => {
    setIsLoading(true)
    try {
      if (window.api?.employees?.getAll) {
        const employeeList = await window.api.employees.getAll()
        setEmployees(employeeList)
      } else {
        // Fallback mock data if API not available
        const mockEmployees: Employee[] = [
          { id: 1, full_name: 'أحمد محمد علي', employee_no: 'EMP001', department: 'الموارد البشرية', position: 'مدير' },
          { id: 2, full_name: 'فاطمة أحمد', employee_no: 'EMP002', department: 'المحاسبة', position: 'محاسب' },
          { id: 3, full_name: 'محمد حسن', employee_no: 'EMP003', department: 'تقنية المعلومات', position: 'مطور' },
          { id: 4, full_name: 'سارة علي', employee_no: 'EMP004', department: 'التسويق', position: 'مسوق' },
          { id: 5, full_name: 'عمر يوسف', employee_no: 'EMP005', department: 'المبيعات', position: 'مندوب مبيعات' },
        ]
        setEmployees(mockEmployees)
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
      window.toast?.error?.('تعذر تحميل قائمة الموظفين')
    } finally {
      setIsLoading(false)
    }
  }

  const prefillData = async (employeeId: number, month: string) => {
    setIsLoading(true)
    try {
      // 1) Try to get existing snapshot for this employee & month
      if (window.api?.payroll?.get) {
        const snap = await window.api.payroll.get(employeeId, month)
        if (snap) {
          // Convert numeric values to strings
          const stringInputs = Object.fromEntries(
            Object.entries(snap.inputs).map(([key, value]) => [key, String(value)])
          )
          setInputs(stringInputs)
          return
        }
      }

      // 2) Try last month snapshot
      const prevMonth = dayjs(month).subtract(1, 'month').format('YYYY-MM')
      if (window.api?.payroll?.get) {
        const prev = await window.api.payroll.get(employeeId, prevMonth)
        if (prev) {
          // Convert numeric values to strings
          const stringInputs = Object.fromEntries(
            Object.entries(prev.inputs).map(([key, value]) => [key, String(value)])
          )
          setInputs(stringInputs)
          return
        }
      }

      // 3) Fallback to salary scale defaults
      if (window.api?.employees?.getSalaryDefaults) {
        const defaults = await window.api.employees.getSalaryDefaults(employeeId)
        setInputs({
          base_salary_usd: String(defaults.base_salary_usd ?? 0),
          admin_allowance_usd: String(defaults.admin_allowance_usd ?? 0),
          education_allowance_usd: String(defaults.education_allowance_usd ?? 0),
          housing_allowance_usd: String(defaults.housing_allowance_usd ?? 0),
          transport_allowance_usd: String(defaults.transport_allowance_usd ?? 0),
          col_allowance_usd: String(defaults.col_allowance_usd ?? 0),
          children_allowance_usd: String(defaults.children_allowance_usd ?? 0),
          special_allowance_usd: String(defaults.special_allowance_usd ?? 0),
          fuel_allowance_usd: String(defaults.fuel_allowance_usd ?? 0),
          eos_accrual_usd: '0',
          exceptional_additions_usd: '0',
          overtime_hours: '0',
          deduction_loan_penalty_usd: '0',
          deduction_payment_usd: '0',
          deductions_other_usd: '0',
        })
      }
    } catch (error) {
      console.error('Failed to prefill data:', error)
      window.toast?.error?.('تعذر تحميل بيانات الموظف')
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePreview = async () => {
    try {
      if (window.api?.payroll?.calcPreview) {
        const result = await window.api.payroll.calcPreview(inputs)
        setPreview(result)
      }
    } catch (error) {
      console.error('Failed to calculate preview:', error)
    }
  }

  const handleInputChange = (field: keyof typeof inputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!selectedEmployeeId) {
      window.toast?.error?.('اختر الموظف')
      return
    }

    try {
      // Validate inputs using Zod schema
      const validatedInputs = payrollInputsSchema.parse(inputs)
      
      if (!validatedInputs.base_salary_usd) {
        window.toast?.error?.('أدخل الراتب الأساسي')
        return
      }

      setIsSaving(true)
      
      if (window.api?.payroll?.save) {
        const result = await window.api.payroll.save(selectedEmployeeId, month, validatedInputs)
        window.toast?.success?.('تم حفظ كشف الراتب بنجاح')
        // Clear draft after successful save
        payrollDraftStorage.clear()
        onSaved?.(result.id)
      }
    } catch (error: any) {
      console.error('Failed to save payroll:', error)
      if (error.errors) {
        // Zod validation errors
        const firstError = error.errors[0]
        window.toast?.error?.(firstError.message)
      } else {
        window.toast?.error?.('حدث خطأ أثناء الحفظ')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    // Clear draft when closing without saving
    if (selectedEmployeeId && Object.values(inputs).some(v => v !== '' && v !== '0')) {
      const shouldClearDraft = window.confirm('هل تريد حفظ المسودة للمتابعة لاحقاً؟')
      if (!shouldClearDraft) {
        payrollDraftStorage.clear()
      }
    }
    
    setSelectedEmployeeId(null)
    setInputs({
      base_salary_usd: '',
      admin_allowance_usd: '',
      education_allowance_usd: '',
      housing_allowance_usd: '',
      transport_allowance_usd: '',
      col_allowance_usd: '',
      children_allowance_usd: '',
      special_allowance_usd: '',
      fuel_allowance_usd: '',
      eos_accrual_usd: '',
      exceptional_additions_usd: '',
      overtime_hours: '',
      deduction_loan_penalty_usd: '',
      deduction_payment_usd: '',
      deductions_other_usd: '',
    })
    setPreview(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">إنشاء كشف راتب جديد</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموظف
                </label>
                <select
                  value={selectedEmployeeId || ''}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value) || null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  <option value="">{isLoading ? "جاري التحميل..." : "اختر الموظف"}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_no})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الشهر
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => {/* month is controlled by parent */}}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>

              {/* Salary Inputs */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">الراتب والبدلات (USD)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الراتب الأساسي
                    </label>
                    <InputNumber
                      value={inputs.base_salary_usd}
                      onChange={(value) => handleInputChange('base_salary_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بدل إداري
                    </label>
                    <InputNumber
                      value={inputs.admin_allowance_usd}
                      onChange={(value) => handleInputChange('admin_allowance_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بدل تعليمي
                    </label>
                    <InputNumber
                      value={inputs.education_allowance_usd}
                      onChange={(value) => handleInputChange('education_allowance_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بدل سكن
                    </label>
                    <InputNumber
                      value={inputs.housing_allowance_usd}
                      onChange={(value) => handleInputChange('housing_allowance_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بدل مواصلات
                    </label>
                    <InputNumber
                      value={inputs.transport_allowance_usd}
                      onChange={(value) => handleInputChange('transport_allowance_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بدل غلاء معيشة
                    </label>
                    <InputNumber
                      value={inputs.col_allowance_usd}
                      onChange={(value) => handleInputChange('col_allowance_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بدل أطفال
                    </label>
                    <InputNumber
                      value={inputs.children_allowance_usd}
                      onChange={(value) => handleInputChange('children_allowance_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بدل خاص
                    </label>
                    <InputNumber
                      value={inputs.special_allowance_usd}
                      onChange={(value) => handleInputChange('special_allowance_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بدل وقود
                    </label>
                    <InputNumber
                      value={inputs.fuel_allowance_usd}
                      onChange={(value) => handleInputChange('fuel_allowance_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مخصص نهاية الخدمة
                    </label>
                    <InputNumber
                      value={inputs.eos_accrual_usd}
                      onChange={(value) => handleInputChange('eos_accrual_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      إضافات استثنائية
                    </label>
                    <InputNumber
                      value={inputs.exceptional_additions_usd}
                      onChange={(value) => handleInputChange('exceptional_additions_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ساعات إضافية
                    </label>
                    <InputNumber
                      value={inputs.overtime_hours}
                      onChange={(value) => handleInputChange('overtime_hours', value)}
                      min={0}
                      step="0.1"
                      className="p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">الاستقطاعات (USD)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      قروض وغرامات
                    </label>
                    <InputNumber
                      value={inputs.deduction_loan_penalty_usd}
                      onChange={(value) => handleInputChange('deduction_loan_penalty_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      دفعات
                    </label>
                    <InputNumber
                      value={inputs.deduction_payment_usd}
                      onChange={(value) => handleInputChange('deduction_payment_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      استقطاعات أخرى
                    </label>
                    <InputNumber
                      value={inputs.deductions_other_usd}
                      onChange={(value) => handleInputChange('deductions_other_usd', value)}
                      min={0}
                      step="0.01"
                      className="p-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">معاينة الحساب</h3>
                </div>

                {isLoading && (
                  <div className="text-center py-8">
                    <div className="text-gray-500">جاري التحميل...</div>
                  </div>
                )}

                {!isLoading && preview && (
                  <div className="space-y-4">
                    {/* Exchange Rate */}
                    <div className="text-sm text-gray-600 text-center">
                      تم الحساب بسعر: 1 USD = {preview.rate.toFixed(2)} TRY
                      {isCalculating && (
                        <div className="inline-flex items-center ml-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>

                    {/* USD Column */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3">بالدولار الأمريكي (USD)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>مجموع الراتب:</span>
                          <span className="font-medium">${preview.usd.total_salary.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>إجمالي الراتب:</span>
                          <span className="font-medium">${preview.usd.gross_salary.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الأجر اليومي:</span>
                          <span className="font-medium">${preview.usd.daily_rate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الأجر الساعي:</span>
                          <span className="font-medium">${preview.usd.hourly_rate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الإضافي:</span>
                          <span className="font-medium">${preview.usd.overtime_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>الخصومات:</span>
                          <span className="font-medium">-${preview.usd.total_deductions.toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-semibold text-green-600">
                          <span>الصافي:</span>
                          <span>${preview.usd.net_salary.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* TRY Column */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3">بالليرة التركية (TRY)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>مجموع الراتب:</span>
                          <span className="font-medium">₺{preview.try.total_salary.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>إجمالي الراتب:</span>
                          <span className="font-medium">₺{preview.try.gross_salary.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الأجر اليومي:</span>
                          <span className="font-medium">₺{preview.try.daily_rate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الأجر الساعي:</span>
                          <span className="font-medium">₺{preview.try.hourly_rate.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الإضافي:</span>
                          <span className="font-medium">₺{preview.try.overtime_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>الخصومات:</span>
                          <span className="font-medium">-₺{preview.try.total_deductions.toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-semibold text-green-600">
                          <span>الصافي:</span>
                          <span>₺{preview.try.net_salary.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isLoading && !preview && selectedEmployeeId && inputs.base_salary_usd > 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500">جاري حساب المعاينة...</div>
                  </div>
                )}

                {!selectedEmployeeId && (
                  <div className="text-center py-8">
                    <div className="text-gray-500">اختر الموظف لعرض المعاينة</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            إلغاء
          </Button>
          <Button
            onClick={() => safeRun(handleSave)}
            disabled={!selectedEmployeeId || !inputs.base_salary_usd || isSaving || isLoading}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
