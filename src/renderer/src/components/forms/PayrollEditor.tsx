import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/Button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Calculator, DollarSign, Minus, Plus, Save, X } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { useAppStore } from '../../store/appStore'
import { EmployeeSearchSelect } from './EmployeeSearchSelect'

// Payroll form schema with comprehensive validation
const payrollSchema = z.object({
  employee_id: z.number().min(1, 'يجب اختيار موظف'),
  month: z.string().min(1, 'الشهر مطلوب'),
  
  // Base salary components
  base_salary_usd: z.number().min(0, 'الراتب الأساسي يجب أن يكون صفر أو أكثر'),
  
  // Allowances
  admin_allowance_usd: z.number().min(0, 'بدل إداري يجب أن يكون صفر أو أكثر').default(0),
  education_allowance_usd: z.number().min(0, 'بدل تعليمي يجب أن يكون صفر أو أكثر').default(0),
  housing_allowance_usd: z.number().min(0, 'بدل سكن يجب أن يكون صفر أو أكثر').default(0),
  transport_allowance_usd: z.number().min(0, 'بدل نقل يجب أن يكون صفر أو أكثر').default(0),
  col_allowance_usd: z.number().min(0, 'بدل غلاء معيشة يجب أن يكون صفر أو أكثر').default(0),
  children_allowance_usd: z.number().min(0, 'بدل أطفال يجب أن يكون صفر أو أكثر').default(0),
  special_allowance_usd: z.number().min(0, 'بدل خاص يجب أن يكون صفر أو أكثر').default(0),
  fuel_allowance_usd: z.number().min(0, 'بدل وقود يجب أن يكون صفر أو أكثر').default(0),
  
  // Overtime
  overtime_hours: z.number().min(0, 'ساعات إضافية يجب أن تكون صفر أو أكثر').default(0),
  hourly_rate_usd: z.number().min(0, 'سعر الساعة يجب أن يكون صفر أو أكثر').default(0),
  
  // Deductions
  loan_deduction_usd: z.number().min(0, 'خصم قرض يجب أن يكون صفر أو أكثر').default(0),
  advance_deduction_usd: z.number().min(0, 'خصم سلفة يجب أن يكون صفر أو أكثر').default(0),
  other_deductions_usd: z.number().min(0, 'خصومات أخرى يجب أن تكون صفر أو أكثر').default(0),
  
  // Exchange rate
  exchange_rate: z.number().min(0.01, 'سعر الصرف يجب أن يكون أكبر من صفر'),
  
  // Status and notes
  status: z.enum(['draft', 'finalized', 'paid']).default('draft'),
  notes: z.string().optional().default('')
})

type PayrollFormData = z.infer<typeof payrollSchema>

interface PayrollEditorProps {
  employee?: any
  onSave: (data: PayrollFormData) => Promise<void>
  onCancel: () => void
}

export function PayrollEditor({ employee, onSave, onCancel }: PayrollEditorProps) {
  const { currencyView, activeRate } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form with default values
  const form = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      employee_id: employee?.employee_id || 0,
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
      base_salary_usd: employee?.base_salary_usd || 0,
      admin_allowance_usd: 0,
      education_allowance_usd: 0,
      housing_allowance_usd: 0,
      transport_allowance_usd: 0,
      col_allowance_usd: 0,
      children_allowance_usd: 0,
      special_allowance_usd: 0,
      fuel_allowance_usd: 0,
      overtime_hours: employee?.overtime_hours || 0,
      hourly_rate_usd: employee?.hourly_rate_usd || 0,
      loan_deduction_usd: 0,
      advance_deduction_usd: 0,
      other_deductions_usd: 0,
      exchange_rate: activeRate?.rate || 30,
      status: employee?.status || 'draft',
      notes: employee?.notes || ''
    }
  })

  const { watch, setValue, handleSubmit, formState: { errors } } = form

  // Watch all form values for live calculations
  const watchedValues = watch()

  // Live calculations
  const calculations = React.useMemo(() => {
    const {
      base_salary_usd,
      admin_allowance_usd,
      education_allowance_usd,
      housing_allowance_usd,
      transport_allowance_usd,
      col_allowance_usd,
      children_allowance_usd,
      special_allowance_usd,
      fuel_allowance_usd,
      overtime_hours,
      hourly_rate_usd,
      loan_deduction_usd,
      advance_deduction_usd,
      other_deductions_usd,
      exchange_rate
    } = watchedValues

    // Calculate totals in USD
    const total_allowances_usd = 
      admin_allowance_usd + education_allowance_usd + housing_allowance_usd + 
      transport_allowance_usd + col_allowance_usd + children_allowance_usd + 
      special_allowance_usd + fuel_allowance_usd

    const overtime_value_usd = overtime_hours * hourly_rate_usd
    const gross_salary_usd = base_salary_usd + total_allowances_usd + overtime_value_usd
    const total_deductions_usd = loan_deduction_usd + advance_deduction_usd + other_deductions_usd
    const net_salary_usd = gross_salary_usd - total_deductions_usd

    // Calculate TRY equivalents
    const base_salary_try = base_salary_usd * exchange_rate
    const total_allowances_try = total_allowances_usd * exchange_rate
    const overtime_value_try = overtime_value_usd * exchange_rate
    const gross_salary_try = gross_salary_usd * exchange_rate
    const total_deductions_try = total_deductions_usd * exchange_rate
    const net_salary_try = net_salary_usd * exchange_rate

    return {
      usd: {
        total_allowances: total_allowances_usd,
        overtime_value: overtime_value_usd,
        gross_salary: gross_salary_usd,
        total_deductions: total_deductions_usd,
        net_salary: net_salary_usd
      },
      try: {
        base_salary: base_salary_try,
        total_allowances: total_allowances_try,
        overtime_value: overtime_value_try,
        gross_salary: gross_salary_try,
        total_deductions: total_deductions_try,
        net_salary: net_salary_try
      }
    }
  }, [watchedValues])

  const onSubmit = async (data: PayrollFormData) => {
    setIsSubmitting(true)
    try {
      // Add calculated values to the data
      const payrollData = {
        ...data,
        // USD calculations
        total_allowances_usd: calculations.usd.total_allowances,
        overtime_value_usd: calculations.usd.overtime_value,
        gross_salary_usd: calculations.usd.gross_salary,
        total_deductions_usd: calculations.usd.total_deductions,
        net_salary_usd: calculations.usd.net_salary,
        // TRY calculations
        base_salary_try: calculations.try.base_salary,
        total_allowances_try: calculations.try.total_allowances,
        overtime_value_try: calculations.try.overtime_value,
        gross_salary_try: calculations.try.gross_salary,
        total_deductions_try: calculations.try.total_deductions,
        net_salary_try: calculations.try.net_salary,
        rate_used: data.exchange_rate
      }
      
      await onSave(payrollData)
    } catch (error) {
      console.error('Failed to save payroll:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      {/* Employee Selection (only for new payroll) */}
      {!employee && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">اختيار الموظف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <EmployeeSearchSelect
                  selectedId={watchedValues.employee_id || null}
                  onSelect={(emp) => setValue('employee_id', emp?.id || 0)}
                  error={errors.employee_id?.message}
                />
              </div>
              
              <div>
                <Label htmlFor="month" className="text-right block mb-2">
                  الشهر *
                </Label>
                <Input
                  type="month"
                  {...form.register('month')}
                  className="text-right"
                />
                {errors.month && (
                  <p className="text-red-500 text-sm mt-1 text-right">{errors.month.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Components */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              مكونات الراتب (USD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="base_salary_usd" className="text-right block mb-2">
                الراتب الأساسي *
              </Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('base_salary_usd', { valueAsNumber: true })}
                className="text-right"
                placeholder="15000"
              />
              {errors.base_salary_usd && (
                <p className="text-red-500 text-sm mt-1 text-right">{errors.base_salary_usd.message}</p>
              )}
            </div>

            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-right">البدلات</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-right block mb-1 text-sm">بدل إداري</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('admin_allowance_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-right block mb-1 text-sm">بدل تعليمي</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('education_allowance_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-right block mb-1 text-sm">بدل سكن</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('housing_allowance_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-right block mb-1 text-sm">بدل نقل</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('transport_allowance_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-right block mb-1 text-sm">بدل غلاء معيشة</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('col_allowance_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-right block mb-1 text-sm">بدل أطفال</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('children_allowance_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-right block mb-1 text-sm">بدل خاص</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('special_allowance_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-right block mb-1 text-sm">بدل وقود</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('fuel_allowance_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-right">الساعات الإضافية</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-right block mb-1 text-sm">عدد الساعات</Label>
                  <Input
                    type="number"
                    step="0.5"
                    {...form.register('overtime_hours', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label className="text-right block mb-1 text-sm">سعر الساعة</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('hourly_rate_usd', { valueAsNumber: true })}
                    className="text-right"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deductions and Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Minus className="w-5 h-5" />
              الخصومات والإعدادات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-right">الخصومات (USD)</h4>
              
              <div>
                <Label className="text-right block mb-1 text-sm">خصم قرض</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('loan_deduction_usd', { valueAsNumber: true })}
                  className="text-right"
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label className="text-right block mb-1 text-sm">خصم سلفة</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('advance_deduction_usd', { valueAsNumber: true })}
                  className="text-right"
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label className="text-right block mb-1 text-sm">خصومات أخرى</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('other_deductions_usd', { valueAsNumber: true })}
                  className="text-right"
                  placeholder="0"
                />
              </div>
            </div>

            <Separator />
            
            <div>
              <Label htmlFor="exchange_rate" className="text-right block mb-2">
                سعر الصرف (USD إلى TRY) *
              </Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('exchange_rate', { valueAsNumber: true })}
                className="text-right"
                placeholder="30.00"
              />
              {errors.exchange_rate && (
                <p className="text-red-500 text-sm mt-1 text-right">{errors.exchange_rate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status" className="text-right block mb-2">
                الحالة
              </Label>
              <Select
                value={watchedValues.status}
                onValueChange={(value) => setValue('status', value as 'draft' | 'finalized' | 'paid')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="finalized">معتمد</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-right block mb-2">
                ملاحظات
              </Label>
              <Textarea
                {...form.register('notes')}
                className="text-right"
                placeholder="أدخل أي ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Calculations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            ملخص الحسابات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* USD Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold text-right text-blue-700">بالدولار الأمريكي (USD)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{formatCurrency(watchedValues.base_salary_usd, 'USD', activeRate)}</span>
                  <span>الراتب الأساسي:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{formatCurrency(calculations.usd.total_allowances, 'USD', activeRate)}</span>
                  <span>إجمالي البدلات:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{formatCurrency(calculations.usd.overtime_value, 'USD', activeRate)}</span>
                  <span>قيمة الإضافي:</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-green-700">
                  <span>{formatCurrency(calculations.usd.gross_salary, 'USD', activeRate)}</span>
                  <span>الراتب الإجمالي:</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>{formatCurrency(calculations.usd.total_deductions, 'USD', activeRate)}</span>
                  <span>إجمالي الخصومات:</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-green-800">
                  <span>{formatCurrency(calculations.usd.net_salary, 'USD', activeRate)}</span>
                  <span>الراتب الصافي:</span>
                </div>
              </div>
            </div>

            {/* TRY Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold text-right text-orange-700">بالليرة التركية (TRY)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{formatCurrency(calculations.try.base_salary, 'TRY', activeRate)}</span>
                  <span>الراتب الأساسي:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{formatCurrency(calculations.try.total_allowances, 'TRY', activeRate)}</span>
                  <span>إجمالي البدلات:</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{formatCurrency(calculations.try.overtime_value, 'TRY', activeRate)}</span>
                  <span>قيمة الإضافي:</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-green-700">
                  <span>{formatCurrency(calculations.try.gross_salary, 'TRY', activeRate)}</span>
                  <span>الراتب الإجمالي:</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>{formatCurrency(calculations.try.total_deductions, 'TRY', activeRate)}</span>
                  <span>إجمالي الخصومات:</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-green-800">
                  <span>{formatCurrency(calculations.try.net_salary, 'TRY', activeRate)}</span>
                  <span>الراتب الصافي:</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-w-[100px]"
        >
          <X className="w-4 h-4 ml-2" />
          إلغاء
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري الحفظ...
            </div>
          ) : (
            <>
              <Save className="w-4 h-4 ml-2" />
              حفظ الراتب
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
