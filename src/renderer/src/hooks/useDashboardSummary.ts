import { useEffect, useState } from 'react'

export interface DashboardSummary {
  period: string
  totals: {
    sum_try: number
    sum_usd: number
  }
  employeeCount: number
  avg: {
    avg_usd: number | null
    avg_try: number | null
  }
  evaluations: {
    completed: number
    assigned: number
    percent: number
  }
  absences?: {
    total: number
    finesTRY: number
    finesUSD: number
  }
  leaves?: {
    pending: number
    total: number
  }
  exchange: {
    rate: number
    effective_at: string
  } | null
  recent: Array<{
    kind: string
    message: string
    created_at: string
  }>
}

export function useDashboardSummary(period?: string) {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reasons, setReasons] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    console.log('[useDashboardSummary] Fetching data for period:', period)
    
    // Use the direct IPC invoke method to get the new response format
    window.api.invoke('dashboard:summary', { period })
      .then((res: any) => {
        console.log('[useDashboardSummary] Received response:', res)
        if (!mounted) return
        if (res?.ok) {
          setData(res.data)
          setReasons(res.reasons || [])
          setError(null)
        } else {
          setData(null)
          setReasons([])
          setError(res?.error ?? 'Unknown error')
        }
      })
      .catch((e: any) => {
        console.error('[useDashboardSummary] Error:', e)
        if (mounted) {
          setError(String(e?.message ?? e))
          setReasons([])
        }
      })
      .finally(() => mounted && setLoading(false))
    
    return () => { mounted = false }
  }, [period])

  return { data, loading, error, reasons }
}
