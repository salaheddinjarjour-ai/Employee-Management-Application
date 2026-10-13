import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { ExternalLink } from 'lucide-react'
import { getCurrentPeriod } from '../../utils/period'

interface PayrollRow {
  id: number
  employee_id: number
  period: string
  currency: 'TRY' | 'USD'
  base_amount: number
  additions: number
  deductions: number
  net_amount: number
  created_at?: string
  updated_at?: string
}

interface PayrollTotal {
  currency: 'TRY' | 'USD'
  sum_base: number
  sum_add: number
  sum_ded: number
  sum_net: number
}

interface PayrollPreviewProps {
  employeeId: number
  period?: string
  onNavigateToPayroll?: (employeeId: number, period?: string) => void
}

export default function PayrollPreview({ employeeId, period, onNavigateToPayroll }: PayrollPreviewProps) {
  const [payrolls, setPayrolls] = useState<PayrollRow[]>([])
  const [totals, setTotals] = useState<PayrollTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadPayrollData = async () => {
      if (!employeeId) return

      // Ensure numeric employee ID
      const idToQuery = Number(employeeId)
      if (!Number.isFinite(idToQuery)) {
        console.warn('[PayrollPreview] Invalid employee.id:', employeeId)
        setError('معرف الموظف غير صحيح')
        setLoading(false)
        return
      }

      // Use current period if none provided
      const currentPeriod = period || getCurrentPeriod()
      const limit = 5

      console.log('[PayrollPreview] employee.id ->', idToQuery, 'period ->', currentPeriod)

      setLoading(true)
      setError(null)
      setUsingFallback(false)

      try {
        // Check if API methods exist
        if (!window.api?.payrollListByEmployee || !window.api?.payrollTotalsByEmployee) {
          console.error('[PayrollPreview] API methods not available')
          throw new Error('API methods not available')
        }

        // Try with period first (if available)
        const tryWithPeriod = currentPeriod && currentPeriod.length >= 7
        let rowsResponse = tryWithPeriod
          ? await window.api.payrollListByEmployee(idToQuery, currentPeriod, limit)
          : await window.api.payrollListByEmployee(idToQuery, undefined, limit)

        console.log('[PayrollPreview] rows (initial):', rowsResponse)
        console.log('[PayrollPreview] rowsResponse structure:', JSON.stringify(rowsResponse, null, 2))

        // Use response directly (fetchApi returns data, not wrapped)
        let rows = Array.isArray(rowsResponse) ? rowsResponse : []
        console.log('[PayrollPreview] extracted rows:', rows)

        // If period query returns empty, fallback to "latest across all periods"
        if (tryWithPeriod && rows.length === 0) {
          console.log('[PayrollPreview] No rows for period', currentPeriod, '— falling back to latest across all periods.')
          const fallbackResponse = await window.api.payrollListByEmployee(idToQuery, undefined, limit)
          console.log('[PayrollPreview] rows (fallback):', fallbackResponse)

          rows = Array.isArray(fallbackResponse) ? fallbackResponse : []

          if (mounted && rows.length > 0) {
            setUsingFallback(true)
          }
        }

        if (!mounted) return

        // Ensure we always set arrays
        setPayrolls(rows)

        // Totals: if we used period and got rows, use totalsByEmployee with period; otherwise use totals without period
        let sumsResponse
        if (tryWithPeriod && rows.length > 0) {
          sumsResponse = await window.api.payrollTotalsByEmployee(idToQuery, currentPeriod)
          console.log('[PayrollPreview] totals (period):', sumsResponse)
          let sums = Array.isArray(sumsResponse) ? sumsResponse : []
          if (sums.length === 0) {
            sumsResponse = await window.api.payrollTotalsByEmployee(idToQuery, undefined)
            console.log('[PayrollPreview] totals (fallback all periods):', sumsResponse)
            sums = Array.isArray(sumsResponse) ? sumsResponse : []
          }
          if (!mounted) return
          setTotals(sums)
        } else {
          sumsResponse = await window.api.payrollTotalsByEmployee(idToQuery, undefined)
          console.log('[PayrollPreview] totals (no period):', sumsResponse)
          const sums = Array.isArray(sumsResponse) ? sumsResponse : []
          if (!mounted) return
          setTotals(sums)
        }
        setError(null)
      } catch (error) {
        console.error('[PayrollPreview] Failed to load payroll data:', error)
        if (mounted) {
          setPayrolls([])
          setTotals([])
          setError(error instanceof Error ? error.message : 'حدث خطأ في تحميل البيانات')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadPayrollData()

    return () => {
      mounted = false
    }
  }, [employeeId, period])

  const handleOpenFullPayroll = () => {
    if (onNavigateToPayroll) {
      onNavigateToPayroll(employeeId, period)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-20 bg-gray-100 rounded-lg"></div>
          </div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-red-500 mb-3">{error}</div>
        <Button
          className="mt-3"
          onClick={() => window.location.reload()}
        >
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  if (!Array.isArray(payrolls) || payrolls.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-gray-500">لا توجد رواتب لهذه الفترة</div>
        <Button
          className="mt-3"
          onClick={handleOpenFullPayroll}
        >
          فتح صفحة الرواتب
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Fallback indicator */}
      {usingFallback && (
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
          لا توجد رواتب لهذه الفترة. يتم عرض أحدث الرواتب عبر جميع الفترات.
        </div>
      )}

      {/* Totals header: show per currency */}
      {totals.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {totals.map(t => (
            <div key={t.currency} className="rounded-lg border p-3">
              <div className="text-sm text-gray-500">
                {t.currency === 'TRY' ? 'إجمالي صافي الراتب (TL)' : 'إجمالي صافي الراتب (USD)'}
              </div>
              <div className="text-lg font-semibold">
                {t.currency === 'TRY' ? '₺' : '$'}
                {Number(t.sum_net || 0).toLocaleString('ar-SA')}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                الأساس: {Number(t.sum_base || 0).toLocaleString('ar-SA')} •
                البدلات: {Number(t.sum_add || 0).toLocaleString('ar-SA')} •
                الاستقطاعات: {Number(t.sum_ded || 0).toLocaleString('ar-SA')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Latest payrolls list */}
      <ul className="divide-y rounded border">
        {Array.isArray(payrolls) && payrolls.map(p => (
          <li key={`${p.id}-${p.currency}`} className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">فترة {p.period} • {p.currency}</div>
              <div className="text-xs text-gray-500">
                الأساسي: {Number(p.base_amount).toLocaleString('ar-SA')} •
                البدلات: {Number(p.additions).toLocaleString('ar-SA')} •
                الاستقطاعات: {Number(p.deductions).toLocaleString('ar-SA')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">الصافي</div>
              <div className="text-base font-semibold">
                {p.currency === 'TRY' ? '₺' : '$'}{Number(p.net_amount).toLocaleString('ar-SA')}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* CTA to open full page, prefiltered */}
      <Button
        className="w-full"
        onClick={handleOpenFullPayroll}
      >
        <ExternalLink className="w-4 h-4 ml-2" />
        فتح صفحة الرواتب
      </Button>
    </div>
  )
}
