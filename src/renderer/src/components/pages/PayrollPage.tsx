import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit, Trash2, Calendar, DollarSign } from 'lucide-react'
import { Button } from '../ui/Button'
import PayrollBuilder from '../payroll/PayrollBuilder'
import { EmployeeLite } from '../../types/employee'
import { toast } from 'react-hot-toast'
import { normalizePeriod, getCurrentPeriod, formatPeriodForDisplay } from '../../utils/period'
import { arabicYearsLabel } from '../../utils/ar'
import { formatGregorian } from '../../utils/format'

interface PayrollRecord {
  header: {
    id: number
    employee_id: number
    period: string
    employee_name?: string
    base_min: number
    base_min_currency: string
    years_of_exp: number
    experience_allowance_amount: number
    experience_allowance_currency: string
    created_at: string
    updated_at: string
  }
  lines: Array<{
    id: number
    category: string
    label: string
    currency: string
    amount: number
  }>
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(() => normalizePeriod(getCurrentPeriod()))
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAvailablePeriods()
  }, [])

  useEffect(() => {
    if (selectedPeriod) {
      loadPayrollsByPeriod()
    }
  }, [selectedPeriod])

  const loadAvailablePeriods = async () => {
    try {
      const periods = await window.electronAPI.payrollListPeriods()
      setAvailablePeriods(periods)
    } catch (error) {
      console.error('Failed to load periods:', error)
      toast.error('فشل في تحميل الفترات المتاحة')
    }
  }

  const loadPayrollsByPeriod = async () => {
    try {
      setLoading(true)
      const normalizedPeriod = normalizePeriod(selectedPeriod)
      console.log('[PayrollPage] Loading payrolls for period:', normalizedPeriod)
      const result = await window.electronAPI.payrollListByPeriod(normalizedPeriod)
      console.log('[PayrollPage] Raw result from API:', result)
      console.log('[PayrollPage] Result type:', typeof result)
      console.log('[PayrollPage] Result length:', result?.length)

      if (result && result.length > 0) {
        console.log('[PayrollPage] First payroll structure:', JSON.stringify(result[0], null, 2))
      }

      setPayrolls(result || [])
      console.log('[PayrollPage] Payrolls state set to:', result || [])
    } catch (error) {
      console.error('Failed to load payrolls:', error)
      toast.error('فشل في تحميل بيانات الرواتب')
      setPayrolls([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingPayroll(null)
    setShowBuilder(true)
  }

  const handleEdit = (payroll: PayrollRecord) => {
    setEditingPayroll(payroll)
    setShowBuilder(true)
  }

  const handleDelete = async (payroll: PayrollRecord) => {
    if (!payroll?.header) {
      toast.error('بيانات الراتب غير صحيحة')
      return
    }

    const employeeName = payroll.header.employee_name || `الموظف #${payroll.header.employee_id || 'غير معروف'}`
    const period = payroll.header.period || 'غير معروف'

    if (!confirm(`هل أنت متأكد من حذف راتب ${employeeName} للفترة ${period}؟`)) {
      return
    }

    try {
      await window.electronAPI.payrollDelete(payroll.header.id)
      toast.success('تم حذف الراتب بنجاح')
      loadPayrollsByPeriod()
    } catch (error) {
      console.error('Failed to delete payroll:', error)
      toast.error('فشل في حذف الراتب')
    }
  }

  const handleBuilderSaved = (saved?: { period: string }) => {
    setShowBuilder(false)
    setEditingPayroll(null)

    // If the saved period is different from current, update it
    if (saved?.period) {
      const normalizedSavedPeriod = normalizePeriod(saved.period)
      if (normalizedSavedPeriod !== selectedPeriod) {
        setSelectedPeriod(normalizedSavedPeriod)
      }
    }

    // Reload the list and available periods
    loadPayrollsByPeriod()
    loadAvailablePeriods()
  }

  const formatMoney = (amount: number, currency: string) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  }

  const calculateTotals = (payroll: PayrollRecord) => {
    const result = { grossTRY: 0, grossUSD: 0, dedTRY: 0, dedUSD: 0, netTRY: 0, netUSD: 0 }

    // Safety check for header
    if (!payroll?.header) {
      return result
    }

    // Add base amount (with fallback to TRY for older records)
    const baseCurrency = payroll.header.base_min_currency || 'TRY'
    const baseAmount = payroll.header.base_min || 0
    if (baseCurrency === 'TRY') {
      result.grossTRY += baseAmount
    } else {
      result.grossUSD += baseAmount
    }

    // Add experience allowance (with fallbacks for older records)
    const expAmount = (payroll.header.experience_allowance_amount || 0) * (payroll.header.years_of_exp || 0)
    const expCurrency = payroll.header.experience_allowance_currency || 'TRY'
    if (expCurrency === 'TRY') {
      result.grossTRY += expAmount
    } else {
      result.grossUSD += expAmount
    }

    // Add lines (with safety check)
    if (payroll.lines && Array.isArray(payroll.lines)) {
      payroll.lines.forEach(line => {
        const amount = line.amount || 0
        if (line.category === 'allowance' || line.category === 'exception') {
          if (line.currency === 'TRY') {
            result.grossTRY += amount
          } else {
            result.grossUSD += amount
          }
        } else if (line.category === 'deduction') {
          if (line.currency === 'TRY') {
            result.dedTRY += amount
          } else {
            result.dedUSD += amount
          }
        }
      })
    }

    // Net = Gross - Deductions
    result.netTRY = result.grossTRY - result.dedTRY
    result.netUSD = result.grossUSD - result.dedUSD

    return result
  }

  const filteredPayrolls = payrolls
    .filter(payroll => {
      const hasHeader = payroll?.header
      console.log('[PayrollPage] Filter check - payroll has header:', hasHeader, payroll)
      return hasHeader
    }) // First filter out invalid payrolls
    .filter(payroll => {
      if (!searchQuery) return true
      const employeeName = payroll.header.employee_name || ''
      const matches = employeeName.toLowerCase().includes(searchQuery.toLowerCase())
      console.log('[PayrollPage] Search filter - employee:', employeeName, 'query:', searchQuery, 'matches:', matches)
      return matches
    })

  // Calculate totals for the current period
  const periodTotals = useMemo(() => {
    return filteredPayrolls.reduce(
      (acc: { grossTry: number; grossUsd: number; netTry: number; netUsd: number }, payroll: PayrollRecord) => {
        const totals = calculateTotals(payroll)
        acc.grossTry += totals.grossTRY || 0
        acc.grossUsd += totals.grossUSD || 0
        acc.netTry += totals.netTRY || 0
        acc.netUsd += totals.netUSD || 0
        return acc
      },
      { grossTry: 0, grossUsd: 0, netTry: 0, netUsd: 0 }
    )
  }, [filteredPayrolls])

  console.log('[PayrollPage] Original payrolls count:', payrolls.length)
  console.log('[PayrollPage] Filtered payrolls count:', filteredPayrolls.length)
  console.log('[PayrollPage] Search query:', searchQuery)

  if (showBuilder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PayrollBuilder
          employeeId={editingPayroll?.header.employee_id}
          period={selectedPeriod}
          initial={editingPayroll ? {
            header: editingPayroll.header as any,
            lines: editingPayroll.lines as any
          } : undefined}
          onSaved={handleBuilderSaved}
          onClose={() => setShowBuilder(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الرواتب</h1>
              <p className="text-gray-600">إدارة وتتبع رواتب الموظفين</p>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء راتب جديد
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفترة</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(normalizePeriod(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">كل الفترات</option>
                <option value={getCurrentPeriod()}>
                  الشهر الحالي ({formatPeriodForDisplay(getCurrentPeriod())})
                </option>
                {availablePeriods.map(period => (
                  <option key={period} value={period}>
                    {formatPeriodForDisplay(period)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث بالاسم..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">إجمالي الرواتب TRY</div>
                <div className="mt-1 text-2xl font-semibold">₺ {periodTotals.grossTry.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-emerald-600">₺</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">صافي الرواتب TRY</div>
                <div className="mt-1 text-2xl font-semibold text-green-700">₺ {periodTotals.netTry.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <span className="text-green-600">₺</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">إجمالي الرواتب USD</div>
                <div className="mt-1 text-2xl font-semibold">$ {periodTotals.grossUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center">
                <span className="text-sky-600">$</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">صافي الرواتب USD</div>
                <div className="mt-1 text-2xl font-semibold text-green-700">$ {periodTotals.netUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <span className="text-green-600">$</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              رواتب الفترة {selectedPeriod} ({filteredPayrolls.length} راتب)
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد رواتب</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لم يتم إنشاء أي رواتب لهذه الفترة بعد'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء راتب جديد
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الموظف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الراتب الأساسي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      سنوات الخبرة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      إجمالي TRY
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      إجمالي USD
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">
                      صافي TRY
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">
                      صافي USD
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      آخر تحديث
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayrolls.map((payroll) => {
                    // Safety check for payroll structure
                    if (!payroll?.header) {
                      return null
                    }

                    const totals = calculateTotals(payroll)
                    const header = payroll.header

                    return (
                      <tr key={`${header.employee_id || 'unknown'}-${header.period || 'unknown'}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {header.employee_name || `موظف #${header.employee_id || 'غير معروف'}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {header.employee_id || 'غير معروف'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMoney(header.base_min || 0, header.base_min_currency || 'TRY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {header.years_of_exp || 0} {arabicYearsLabel(Number(header.years_of_exp || 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMoney(totals.grossTRY, 'TRY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMoney(totals.grossUSD, 'USD')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                          {formatMoney(totals.netTRY, 'TRY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                          {formatMoney(totals.netUSD, 'USD')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatGregorian(header.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(payroll)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(payroll)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
