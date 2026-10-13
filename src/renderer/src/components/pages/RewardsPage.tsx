import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Plus, Edit, Eye, Gift, Star, Trophy, DollarSign, Trash2, X, Award, Target, Lightbulb, Heart, Settings, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { useAppStore } from '@/store/appStore'
import { RewardForm } from '../forms/RewardForm'
import Confirm from '../ui/Confirm'
import { toast } from 'sonner'

interface Reward {
  id: number
  employee_id: number
  employee_name: string
  title: string
  description?: string
  notes?: string
  kind: 'مكافأة' | 'تقدير' | 'إنجاز' | 'ابتكار' | 'خاص'
  amount_usd?: number
  reward_currency?: string
  reward_date: string
  status: string
  payroll_action?: string
  payroll_month?: string
  payroll_synced?: number
  created_at: string
  updated_at: string
}

// Helper functions
const getKindIcon = (kind: string) => {
  switch (kind) {
    case 'مكافأة': return <Gift className="w-4 h-4" />
    case 'تقدير': return <Heart className="w-4 h-4" />
    case 'إنجاز': return <Trophy className="w-4 h-4" />
    case 'ابتكار': return <Lightbulb className="w-4 h-4" />
    case 'خاص': return <Star className="w-4 h-4" />
    default: return <Award className="w-4 h-4" />
  }
}

const getKindColor = (kind: string) => {
  switch (kind) {
    case 'مكافأة': return 'text-green-600 bg-green-100'
    case 'تقدير': return 'text-pink-600 bg-pink-100'
    case 'إنجاز': return 'text-yellow-600 bg-yellow-100'
    case 'ابتكار': return 'text-purple-600 bg-purple-100'
    case 'خاص': return 'text-blue-600 bg-blue-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'مدفوع': return 'text-green-800 bg-green-100'
    case 'في الانتظار': return 'text-yellow-800 bg-yellow-100'
    case 'معتمد': return 'text-blue-800 bg-blue-100'
    default: return 'text-gray-800 bg-gray-100'
  }
}

export function RewardsPage() {
  const { currencyView, activeRate } = useAppStore()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{ totals: any, dist: any[] }>({
    totals: { total: 0, paid_amount: 0, pending_amount: 0, this_month_count: 0 },
    dist: []
  })

  // Filter state
  const [kindFilter, setKindFilter] = useState<string | undefined>(undefined)

  // Manage types state
  const [manageTypesOpen, setManageTypesOpen] = useState(false)
  const [rewardTypes, setRewardTypes] = useState<{id: number, name: string}[]>([])
  const [rewardStatuses, setRewardStatuses] = useState<{id: number, name: string}[]>([])
  const [newTypeName, setNewTypeName] = useState('')
  const [newStatusName, setNewStatusName] = useState('')

  const loadRewardOptions = async () => {
    try {
      const [types, statuses] = await Promise.all([
        (window.api as any).listRewardTypes?.().catch?.(() => []) ?? [],
        (window.api as any).listRewardStatuses?.().catch?.(() => []) ?? [],
      ])
      if (Array.isArray(types) && types.length > 0) setRewardTypes(types)
      else setRewardTypes(['مكافأة','تقدير','إنجاز','ابتكار','خاص'].map((n,i) => ({id:i,name:n})))
      if (Array.isArray(statuses) && statuses.length > 0) setRewardStatuses(statuses)
      else setRewardStatuses(['مدفوع','في الانتظار','معتمد'].map((n,i) => ({id:i,name:n})))
    } catch {
      setRewardTypes(['مكافأة','تقدير','إنجاز','ابتكار','خاص'].map((n,i) => ({id:i,name:n})))
      setRewardStatuses(['مدفوع','في الانتظار','معتمد'].map((n,i) => ({id:i,name:n})))
    }
  }

  useEffect(() => { loadRewardOptions() }, [])

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRow, setEditRow] = useState<Reward | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewRow, setViewRow] = useState<Reward | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [syncingId, setSyncingId] = useState<number | null>(null)

  const refetch = async () => {
    setLoading(true)
    try {
      const filters = kindFilter ? { kind: kindFilter } : undefined
      const [rewardsList, rewardsStats] = await Promise.all([
        window.api?.listRewards?.(filters) || [],
        window.api?.rewardsStats?.() || { totals: { total: 0, paid_amount: 0, pending_amount: 0, this_month_count: 0 }, dist: [] }
      ])

      setRewards(rewardsList)
      setStats(rewardsStats)
    } catch (error) {
      console.error('Failed to load rewards:', error)
      toast.error('حدث خطأ أثناء تحميل المكافآت')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const result = await window.electronAPI?.listEmployees?.()
      if (Array.isArray(result)) {
        setEmployees(result)
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }

  useEffect(() => {
    refetch()
    loadEmployees()
  }, [kindFilter])

  const onEdit = (reward: Reward) => {
    setEditRow(reward)
    setDrawerOpen(true)
  }

  const onView = (reward: Reward) => {
    setViewRow(reward)
    setViewOpen(true)
  }

  const onDelete = (reward: Reward) => {
    setConfirmDeleteId(reward.id)
  }

  const handleSave = () => {
    setDrawerOpen(false)
    setEditRow(null)
    refetch()
  }

  const handleSyncToPayroll = async (reward: Reward) => {
    setSyncingId(reward.id)
    try {
      const result = await (window.electronAPI as any).rewardSyncToPayroll?.(reward.id)
      if (result?.success) {
        toast.success(`تمت إضافة المكافأة لراتب ${result.period ?? reward.payroll_month}`)
        refetch()
      } else {
        toast.error(result?.message || 'حدث خطأ أثناء إضافة المكافأة للراتب')
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('حدث خطأ أثناء إضافة المكافأة للراتب')
    } finally {
      setSyncingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return

    try {
      const result = await window.api.deleteReward(confirmDeleteId)
      if (result.success) {
        toast.success('تم حذف المكافأة بنجاح')
        refetch()
      } else {
        toast.error(result.error || 'حدث خطأ أثناء حذف المكافأة')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('حدث خطأ أثناء حذف المكافأة')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  // Format currency based on reward's own currency
  const formatAmount = (amountUsd?: number, rewardCurrency?: string) => {
    if (!amountUsd) return 'غير مالي'
    const currency = rewardCurrency || 'USD'
    const symbol = currency === 'TRY' ? '₺' : '$'
    return `${symbol} ${Number(amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Stats calculations
  const totalRewards = stats.totals.total || 0
  const paidAmount = stats.totals.paid_amount || 0
  const pendingAmount = stats.totals.pending_amount || 0
  const thisMonthCount = stats.totals.this_month_count || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">جارٍ التحميل...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المكافآت والتقدير</h1>
          <p className="text-gray-600">إدارة مكافآت وتقدير الموظفين</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setManageTypesOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            إدارة الأنواع
          </Button>
          <Button
            onClick={() => {
              setEditRow(null)
              setDrawerOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة مكافأة جديدة
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Gift className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">إجمالي المكافآت</h3>
              <p className="text-2xl font-bold text-gray-900">{totalRewards}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">المبلغ المدفوع</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(paidAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">في انتظار الدفع</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {formatAmount(pendingAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">هذا الشهر</h3>
              <p className="text-2xl font-bold text-purple-600">{thisMonthCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution by Kind */}
      {stats.dist.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">التوزيع حسب النوع</h3>
          <div className="flex flex-wrap gap-3">
            {stats.dist.map((item: any) => (
              <div key={item.kind} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getKindColor(item.kind)}`}>
                {getKindIcon(item.kind)}
                <span className="mr-2">{item.kind}</span>
                <span className="mr-1">({item.c})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">تصفية حسب النوع:</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={kindFilter ?? ''}
            onChange={(e) => setKindFilter(e.target.value || undefined)}
          >
            <option value="">كل الأنواع</option>
            {rewardTypes.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العنوان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rewards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    لا توجد مكافآت مسجلة
                  </td>
                </tr>
              ) : (
                rewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reward.employee_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getKindColor(reward.kind)}`}>
                        {getKindIcon(reward.kind)}
                        <span className="mr-1">{reward.kind}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{reward.title}</div>
                      {reward.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {reward.description}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reward.status)}`}>
                        {reward.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reward.reward_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatAmount(reward.amount_usd, reward.reward_currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          title="عرض"
                          onClick={(e) => { e.stopPropagation(); onView(reward); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          title="تعديل"
                          onClick={(e) => { e.stopPropagation(); onEdit(reward); }}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          title="حذف"
                          onClick={(e) => { e.stopPropagation(); onDelete(reward); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {reward.payroll_action === 'payroll' && !reward.payroll_synced && (
                          <button
                            title="إضافة للراتب"
                            disabled={syncingId === reward.id}
                            onClick={(e) => { e.stopPropagation(); handleSyncToPayroll(reward); }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${syncingId === reward.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        {reward.payroll_action === 'payroll' && !!reward.payroll_synced && (
                          <span className="text-xs text-emerald-600 font-medium">✓ مضاف</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reward Form Drawer */}
      <RewardForm
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditRow(null)
        }}
        onSaved={handleSave}
        initial={editRow}
        employees={employees}
      />

      {/* View Reward Modal */}
      {viewOpen && viewRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">عرض المكافأة</h2>
              <button
                onClick={() => {
                  setViewOpen(false)
                  setViewRow(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]" dir="rtl">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الموظف</label>
                  <p className="text-sm text-gray-900">{viewRow.employee_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getKindColor(viewRow.kind)}`}>
                    {getKindIcon(viewRow.kind)}
                    <span className="mr-1">{viewRow.kind}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                  <p className="text-sm text-gray-900">{viewRow.title}</p>
                </div>
                {viewRow.notes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                    <p className="text-sm text-gray-900">{viewRow.notes}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                  <p className="text-sm text-gray-900">{viewRow.reward_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewRow.status)}`}>
                    {viewRow.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                  <p className="text-sm text-gray-900 font-semibold">{formatAmount(viewRow.amount_usd, viewRow.reward_currency)}</p>
                </div>
                {viewRow.description && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                    <p className="text-sm text-gray-900">{viewRow.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setViewOpen(false)
                  setViewRow(null)
                }}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <Confirm
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="حذف المكافأة"
        message="هل أنت متأكد من حذف هذه المكافأة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
      />

      {/* Manage Types Modal */}
      {manageTypesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">إدارة أنواع المكافآت والحالات</h2>
              <button onClick={() => setManageTypesOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-8">
              {/* Reward Types */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">أنواع المكافآت</h3>
                <div className="space-y-2 mb-4">
                  {rewardTypes.map(t => (
                    <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-gray-900">{t.name}</span>
                      <button
                        onClick={async () => {
                          await (window.api as any).deleteRewardType?.(t.id)
                          toast.success('تم الحذف')
                          loadRewardOptions()
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="نوع مكافأة جديد..."
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newTypeName.trim()) {
                        try {
                          await (window.api as any).createRewardType?.({ name: newTypeName.trim() })
                          toast.success('تمت الإضافة')
                          setNewTypeName('')
                          loadRewardOptions()
                        } catch (err: any) { toast.error(err.message) }
                      }
                    }}
                  />
                  <Button
                    onClick={async () => {
                      if (!newTypeName.trim()) return
                      try {
                        await (window.api as any).createRewardType?.({ name: newTypeName.trim() })
                        toast.success('تمت الإضافة')
                        setNewTypeName('')
                        loadRewardOptions()
                      } catch (err: any) { toast.error(err.message) }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    إضافة
                  </Button>
                </div>
              </div>

              {/* Reward Statuses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">أنواع الحالات</h3>
                <div className="space-y-2 mb-4">
                  {rewardStatuses.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-gray-900">{s.name}</span>
                      <button
                        onClick={async () => {
                          await (window.api as any).deleteRewardStatus?.(s.id)
                          toast.success('تم الحذف')
                          loadRewardOptions()
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="حالة جديدة..."
                    value={newStatusName}
                    onChange={e => setNewStatusName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newStatusName.trim()) {
                        try {
                          await (window.api as any).createRewardStatus?.({ name: newStatusName.trim() })
                          toast.success('تمت الإضافة')
                          setNewStatusName('')
                          loadRewardOptions()
                        } catch (err: any) { toast.error(err.message) }
                      }
                    }}
                  />
                  <Button
                    onClick={async () => {
                      if (!newStatusName.trim()) return
                      try {
                        await (window.api as any).createRewardStatus?.({ name: newStatusName.trim() })
                        toast.success('تمت الإضافة')
                        setNewStatusName('')
                        loadRewardOptions()
                      } catch (err: any) { toast.error(err.message) }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    إضافة
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t">
              <Button onClick={() => setManageTypesOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
