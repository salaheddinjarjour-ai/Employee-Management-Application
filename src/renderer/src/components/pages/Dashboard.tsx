import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDashboardSummary } from '@/hooks/useDashboardSummary'
import { Users, DollarSign, TrendingUp, Activity, RefreshCw, CheckCircle, AlertCircle, Clock, Plane } from 'lucide-react'
import { cn } from '../ui/utils'
import { formatDate, formatCurrency } from '../../utils/dateFormat'
import { arabicUnit, AR_DAYS, AR_MINUTES, AR_HOURS } from '../../utils/format'
import { useNavigate } from 'react-router-dom'

function currentYYYYMM(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getMonthOptions() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const arabicMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    const label = i === 0 ? 'الشهر الحالي' : `${arabicMonths[d.getMonth()]} ${d.getFullYear()}`
    months.push({ value, label })
  }
  return months
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `منذ ${diffMins} ${arabicUnit(diffMins, AR_MINUTES)}`
  if (diffHours < 24) return `منذ ${diffHours} ${arabicUnit(diffHours, AR_HOURS)}`
  return `منذ ${diffDays} ${arabicUnit(diffDays, AR_DAYS)}`
}

function KindIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'employee': return <Users className="w-4 h-4 text-blue-500" />
    case 'leave': return <Activity className="w-4 h-4 text-orange-500" />
    case 'promotion': return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'reward': return <CheckCircle className="w-4 h-4 text-purple-500" />
    case 'course': return <Activity className="w-4 h-4 text-indigo-500" />
    case 'system': return <Activity className="w-4 h-4 text-gray-500" />
    default: return <Activity className="w-4 h-4 text-gray-500" />
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  colorClass
}: {
  title: string
  value: React.ReactNode
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  colorClass?: string
}) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {trend && (
            <div className="mt-1 flex items-center text-xs">
              <span className={cn(
                "font-medium",
                trend === 'up' ? "text-green-600" : trend === 'down' ? "text-red-600" : "text-gray-500"
              )}>
                {trendValue}
              </span>
              <span className="text-muted-foreground mr-1">من الشهر الماضي</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl bg-primary/5", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { currencyView } = useAppStore()
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState(currentYYYYMM())
  const { data, loading, error, reasons } = useDashboardSummary(selectedPeriod)

  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [showAllActivities, setShowAllActivities] = useState(false)

  // Run diagnostics on mount
  React.useEffect(() => {
    runDiagnostics()
  }, [])

  async function runDiagnostics() {
    try {
      if (window.api?.invoke) {
        const result = await window.api.invoke('diagnostics:run-all')
        setDiagnostics(result)
      }
    } catch (e) {
      console.error('[DIAG] Error:', e)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">جاري التحميل...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card p-6 rounded-xl shadow-sm border border-border/50 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-3"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive font-medium">خطأ في تحميل البيانات: {error}</p>
        </div>
      </div>
    )
  }



  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على أداء المؤسسة</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="pl-3 pr-10 py-2 bg-background border border-border/50 rounded-lg text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none"
            >
              {getMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <Activity className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="إجمالي الموظفين"
          value={data?.employeeCount || 0}
          icon={Users}
          colorClass="text-blue-600 bg-blue-50/50"
        />

        <StatCard
          title="إجمالي كشف الرواتب"
          value={
            <div className="space-y-1">
              {data?.totals?.sum_try > 0 && (
                <div className="text-blue-600">
                  {formatCurrency(data.totals.sum_try, 'TRY')}
                </div>
              )}
              {data?.totals?.sum_usd > 0 && (
                <div className="text-blue-600">
                  {formatCurrency(data.totals.sum_usd, 'USD')}
                </div>
              )}
              {(!data?.totals?.sum_try && !data?.totals?.sum_usd) && (
                <span className="text-base font-normal text-muted-foreground">--</span>
              )}
            </div>
          }
          icon={DollarSign}
          colorClass="text-blue-600 bg-blue-50/50"
        />

        <StatCard
          title="التقييمات المكتملة"
          value={
            <div className="flex items-baseline gap-2">
              <span className="text-blue-600">{data?.evaluations?.percent || 0}%</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({data?.evaluations?.completed || 0} من {data?.evaluations?.assigned || 0})
              </span>
            </div>
          }
          icon={CheckCircle}
          colorClass="text-blue-600 bg-blue-50/50"
        />

        <StatCard
          title="الغياب والتأخير"
          value={
            <div className="space-y-1">
              <div className="text-orange-600">{data?.absences?.total || 0} سجل</div>
              {(data?.absences?.finesTRY || 0) > 0 && (
                <div className="text-xs font-normal text-red-500">₺{(data.absences!.finesTRY).toFixed(2)}</div>
              )}
              {(data?.absences?.finesUSD || 0) > 0 && (
                <div className="text-xs font-normal text-red-500">${(data.absences!.finesUSD).toFixed(2)}</div>
              )}
            </div>
          }
          icon={Clock}
          colorClass="text-orange-600 bg-orange-50/50"
        />

        <StatCard
          title="الإجازات"
          value={
            <div className="space-y-1">
              <div className="text-sky-600">{data?.leaves?.total || 0} إجازة</div>
              {(data?.leaves?.pending || 0) > 0 && (
                <div className="text-xs font-normal text-yellow-600">{data.leaves!.pending} في الانتظار</div>
              )}
            </div>
          }
          icon={Plane}
          colorClass="text-sky-600 bg-sky-50/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الأنشطة الأخيرة */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">الأنشطة الأخيرة</h2>
            {data?.recent && data.recent.length > 5 && (
              <button
                className="text-xs text-primary hover:underline font-medium"
                onClick={() => setShowAllActivities(!showAllActivities)}
              >
                {showAllActivities ? 'عرض أقل' : 'عرض الكل'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {data?.recent && data.recent.length > 0 ? (
              (showAllActivities ? data.recent : data.recent.slice(0, 5)).map((activity, index) => {
                console.log('[Dashboard Frontend] Activity:', activity)
                console.log('[Dashboard Frontend] Description:', activity.description || activity.message)
                console.log('[Dashboard Frontend] Entity Type:', activity.entity_type || activity.kind)
                return (
                  <div key={index} className="flex items-start gap-4 text-sm group p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                      <KindIcon kind={activity.entity_type || activity.kind} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-foreground font-medium leading-none">{activity.description || activity.message}</p>
                      <p className="text-muted-foreground text-xs">{timeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>لا توجد أنشطة حديثة</p>
              </div>
            )}
          </div>
        </div>

        {/* معدل الصرف النشط */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">معدل الصرف النشط</h2>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
              {currencyView}
            </span>
          </div>

          {data?.exchange ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg shadow-sm">
                    $
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">USD مقابل TRY</p>
                    <p className="text-xs text-muted-foreground mt-0.5">سعر البنك المركزي</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-foreground block tracking-tight">{data.exchange.rate}</span>
                  <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> نشط
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-border/40 pt-4">
                <span className="text-muted-foreground">تاريخ السريان</span>
                <span className="font-medium text-foreground">
                  {formatDate(data.exchange.effective_at)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-muted/20 border border-border/50 text-center">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-sm mb-4">
                <DollarSign className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-foreground font-medium mb-1">لم يتم ضبط سعر صرف</h3>
              <p className="text-muted-foreground text-sm mb-5 max-w-[200px] leading-relaxed">
                قم بإضافة سعر صرف جديد للبدء في حساب الرواتب
              </p>
              <button
                onClick={() => navigate('/exchange-rates')}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                إضافة سعر صرف جديد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
