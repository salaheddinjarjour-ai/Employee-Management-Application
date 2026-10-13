import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { Copy, DollarSign, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

// Types for enhanced preview data
export interface PayrollInputs {
  base_salary_usd: number
  admin_allowance_usd: number
  education_allowance_usd: number
  housing_allowance_usd: number
  transport_allowance_usd: number
  col_allowance_usd: number
  children_allowance_usd: number
  special_allowance_usd: number
  fuel_allowance_usd: number
  eos_accrual_usd: number
  exceptional_additions_usd: number
  deduction_loan_penalty_usd: number
  deduction_payment_usd: number
  deductions_other_usd: number
  overtime_hours: number
  hours_per_day: number
  days_per_month: number
  overtime_multiplier: number
}

export interface PayrollOutputUSD {
  base_salary: number
  total_allowances: number
  allowances_breakdown: {
    admin_allowance: number
    education_allowance: number
    housing_allowance: number
    transport_allowance: number
    col_allowance: number
    children_allowance: number
    special_allowance: number
    fuel_allowance: number
  }
  overtime_amount: number
  eos_accrual: number
  exceptional_additions: number
  gross_salary: number
  total_deductions: number
  deductions_breakdown: {
    loan_penalty: number
    payment: number
    other: number
  }
  net_salary: number
}

export interface PayrollOutputTRY {
  base_salary: number
  total_allowances: number
  allowances_breakdown: {
    admin_allowance: number
    education_allowance: number
    housing_allowance: number
    transport_allowance: number
    col_allowance: number
    children_allowance: number
    special_allowance: number
    fuel_allowance: number
  }
  overtime_amount: number
  eos_accrual: number
  exceptional_additions: number
  gross_salary: number
  total_deductions: number
  deductions_breakdown: {
    loan_penalty: number
    payment: number
    other: number
  }
  net_salary: number
}

export interface EnhancedPreviewEmployee {
  employee_no: string
  full_name: string
  inputs: PayrollInputs
  computedUSD: PayrollOutputUSD
  computedTRY?: PayrollOutputTRY
  rate_used?: number
  row_number: number
}

interface FormulaInspectorProps {
  selectedEmployee: EnhancedPreviewEmployee | null
}

export const FormulaInspector: React.FC<FormulaInspectorProps> = ({ selectedEmployee }) => {
  const [currency, setCurrency] = useState<'USD' | 'TRY'>('USD')

  if (!selectedEmployee) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            مفتش الصيغ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            اختر موظفاً من الجدول لعرض تفاصيل الحسابات
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentData = currency === 'USD' ? selectedEmployee.computedUSD : selectedEmployee.computedTRY
  const currencySymbol = currency === 'USD' ? '$' : '₺'

  const copyFormula = () => {
    if (!currentData) return

    const formula = `
الراتب الأساسي: ${currentData.base_salary.toFixed(2)} ${currencySymbol}
إجمالي البدلات: ${currentData.total_allowances.toFixed(2)} ${currencySymbol}
- بدل إداري: ${currentData.allowances_breakdown.admin_allowance.toFixed(2)} ${currencySymbol}
- بدل تعليمي: ${currentData.allowances_breakdown.education_allowance.toFixed(2)} ${currencySymbol}
- بدل سكن: ${currentData.allowances_breakdown.housing_allowance.toFixed(2)} ${currencySymbol}
- بدل مواصلات: ${currentData.allowances_breakdown.transport_allowance.toFixed(2)} ${currencySymbol}
- بدل غلاء معيشة: ${currentData.allowances_breakdown.col_allowance.toFixed(2)} ${currencySymbol}
- بدل أطفال: ${currentData.allowances_breakdown.children_allowance.toFixed(2)} ${currencySymbol}
- بدل خاص: ${currentData.allowances_breakdown.special_allowance.toFixed(2)} ${currencySymbol}
- بدل وقود: ${currentData.allowances_breakdown.fuel_allowance.toFixed(2)} ${currencySymbol}

العمل الإضافي: ${currentData.overtime_amount.toFixed(2)} ${currencySymbol}
مخصص نهاية الخدمة: ${currentData.eos_accrual.toFixed(2)} ${currencySymbol}
إضافات استثنائية: ${currentData.exceptional_additions.toFixed(2)} ${currencySymbol}

الراتب الإجمالي: ${currentData.gross_salary.toFixed(2)} ${currencySymbol}

إجمالي الخصومات: ${currentData.total_deductions.toFixed(2)} ${currencySymbol}
- خصم قرض/غرامة: ${currentData.deductions_breakdown.loan_penalty.toFixed(2)} ${currencySymbol}
- خصم دفعة: ${currentData.deductions_breakdown.payment.toFixed(2)} ${currencySymbol}
- خصومات أخرى: ${currentData.deductions_breakdown.other.toFixed(2)} ${currencySymbol}

الراتب الصافي: ${currentData.net_salary.toFixed(2)} ${currencySymbol}
${selectedEmployee.rate_used ? `سعر الصرف المستخدم: ${selectedEmployee.rate_used.toFixed(4)} TRY/USD` : ''}
    `.trim()

    navigator.clipboard.writeText(formula)
    toast.success('تم نسخ الصيغة إلى الحافظة')
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            مفتش الصيغ
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={currency === 'USD' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrency('USD')}
              className="flex items-center gap-1"
            >
              <DollarSign className="h-4 w-4" />
              USD
            </Button>
            <Button
              variant={currency === 'TRY' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrency('TRY')}
              disabled={!selectedEmployee.computedTRY}
            >
              ₺ TRY
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedEmployee.full_name} - رقم الموظف: {selectedEmployee.employee_no}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentData ? (
          <div className="text-center text-muted-foreground py-4">
            لا توجد بيانات متاحة لهذه العملة
          </div>
        ) : (
          <>
            {/* Base Salary */}
            <div>
              <div className="flex justify-between items-center">
                <span className="font-medium">الراتب الأساسي</span>
                <Badge variant="secondary">
                  {currentData.base_salary.toFixed(2)} {currencySymbol}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Allowances */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">إجمالي البدلات</span>
                <Badge variant="secondary">
                  {currentData.total_allowances.toFixed(2)} {currencySymbol}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground mr-4">
                <div className="flex justify-between">
                  <span>بدل إداري</span>
                  <span>{currentData.allowances_breakdown.admin_allowance.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل تعليمي</span>
                  <span>{currentData.allowances_breakdown.education_allowance.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل سكن</span>
                  <span>{currentData.allowances_breakdown.housing_allowance.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل مواصلات</span>
                  <span>{currentData.allowances_breakdown.transport_allowance.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل غلاء معيشة</span>
                  <span>{currentData.allowances_breakdown.col_allowance.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل أطفال</span>
                  <span>{currentData.allowances_breakdown.children_allowance.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل خاص</span>
                  <span>{currentData.allowances_breakdown.special_allowance.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل وقود</span>
                  <span>{currentData.allowances_breakdown.fuel_allowance.toFixed(2)} {currencySymbol}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Components */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>العمل الإضافي</span>
                <span>{currentData.overtime_amount.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>مخصص نهاية الخدمة</span>
                <span>{currentData.eos_accrual.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>إضافات استثنائية</span>
                <span>{currentData.exceptional_additions.toFixed(2)} {currencySymbol}</span>
              </div>
            </div>

            <Separator />

            {/* Gross Salary */}
            <div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-600">الراتب الإجمالي</span>
                <Badge variant="default" className="bg-green-600">
                  {currentData.gross_salary.toFixed(2)} {currencySymbol}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Deductions */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-red-600">إجمالي الخصومات</span>
                <Badge variant="destructive">
                  {currentData.total_deductions.toFixed(2)} {currencySymbol}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground mr-4">
                <div className="flex justify-between">
                  <span>خصم قرض/غرامة</span>
                  <span>{currentData.deductions_breakdown.loan_penalty.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>خصم دفعة</span>
                  <span>{currentData.deductions_breakdown.payment.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>خصومات أخرى</span>
                  <span>{currentData.deductions_breakdown.other.toFixed(2)} {currencySymbol}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Net Salary */}
            <div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-600">الراتب الصافي</span>
                <Badge variant="default" className="bg-blue-600">
                  {currentData.net_salary.toFixed(2)} {currencySymbol}
                </Badge>
              </div>
            </div>

            {/* Exchange Rate Info */}
            {selectedEmployee.rate_used && currency === 'TRY' && (
              <>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>سعر الصرف المستخدم</span>
                    <span>{selectedEmployee.rate_used.toFixed(4)} TRY/USD</span>
                  </div>
                </div>
              </>
            )}

            {/* Copy Formula Button */}
            <div className="pt-4">
              <Button onClick={copyFormula} className="w-full" variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                نسخ الصيغة
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
