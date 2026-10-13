import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Plus, Edit, Eye, TrendingUp, Users, Award, Calendar, Trash2, Filter, RefreshCw } from 'lucide-react'
import { PromotionForm } from '../forms/PromotionForm'
import Confirm from '../ui/Confirm'
import { X } from 'lucide-react'

interface Promotion {
  id: number
  employee_id: number
  employee_name: string
  from_title?: string
  to_title?: string
  from_grade?: number
  to_grade?: number
  promo_type: string
  status: string
  effective_date: string
  increase_amount_usd?: number
  increase_currency?: string
  increase_percent?: number
  notes?: string
  created_at: string
  updated_at: string
}

export function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState<{ totals: any, dist: any[] }>({
    totals: { total: 0, executed_count: 0, pending_count: 0, total_raise_usd: 0 },
    dist: []
  })
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)

  // Modal states
  const [viewOpen, setViewOpen] = useState(false)
  const [viewRow, setViewRow] = useState<Promotion | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<Promotion | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [syncingId, setSyncingId] = useState<number | null>(null)

  const refetch = async () => {
    setLoading(true)
    try {
      const [promotionsList, promotionsStats] = await Promise.all([
        window.api?.listPromotions?.(typeFilter) || [],
        window.api?.promotionsStats?.() || { totals: { total: 0, executed_count: 0, pending_count: 0, total_raise_usd: 0 }, dist: [] }
      ])

      setPromotions(promotionsList)
      setStats(promotionsStats)
    } catch (error) {
      console.error('Failed to load promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('employees')
        setEmployees(data)
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }

  // Load promotions and employees
  useEffect(() => {
    refetch()
  }, [typeFilter])

  useEffect(() => {
    loadEmployees()
  }, [])

  // Action handlers
  const onEdit = (promotion: Promotion) => {
    setEditRow(promotion)
    setEditOpen(true)
  }

  const onView = (promotion: Promotion) => {
    setViewRow(promotion)
    setViewOpen(true)
  }

  const onDelete = (promotion: Promotion) => {
    setConfirmDeleteId(promotion.id)
  }

  const handleCreateSave = () => {
    refetch()
  }

  const handleEditSave = () => {
    refetch()
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return

    try {
      await window.api.deletePromotion(confirmDeleteId)
      if (window.toast?.success) {
        window.toast.success('تم حذف الترقية بنجاح')
      }
      refetch()
    } catch (error) {
      console.error('Delete error:', error)
      if (window.toast?.error) {
        window.toast.error('حدث خطأ أثناء حذف الترقية')
      }
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleSyncToPayroll = async (promotion: Promotion) => {
    if (promotion.status !== 'معتمد' && promotion.status !== 'منفذ') {
      if (window.toast?.error) {
        window.toast.error('يجب أن تكون الترقية معتمدة لمزامنتها مع كشف الرواتب')
      }
      return
    }

    setSyncingId(promotion.id)
    try {
      await window.api.invoke('promotions:sync-to-payroll', promotion.id)
      if (window.toast?.success) {
        window.toast.success('تم مزامنة الترقية مع كشف الرواتب بنجاح')
      }
      refetch()
    } catch (error) {
      console.error('Sync error:', error)
      if (window.toast?.error) {
        window.toast.error('حدث خطأ أثناء المزامنة')
      }
    } finally {
      setSyncingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'في الانتظار': return 'bg-yellow-100 text-yellow-800'
      case 'معتمد': return 'bg-blue-100 text-blue-800'
      case 'منفذ': return 'bg-green-100 text-green-800'
      case 'مرفوض': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const renderSalaryIncrease = (promotion: Promotion) => {
    const currSymbol = promotion.increase_currency === 'TRY' ? '₺' : '$'
    if (promotion.increase_amount_usd && promotion.increase_percent) {
      return (
        <div className="text-sm">
          <div className="font-medium text-green-600">
            +{currSymbol}{Number(promotion.increase_amount_usd).toLocaleString('ar', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-gray-500">
            ({promotion.increase_percent}%)
          </div>
        </div>
      )
    } else if (promotion.increase_amount_usd) {
      return (
        <div className="text-sm font-medium text-green-600">
          +{currSymbol}{Number(promotion.increase_amount_usd).toLocaleString('ar', { minimumFractionDigits: 2 })}
        </div>
      )
    } else if (promotion.increase_percent) {
      return (
        <div className="text-sm font-medium text-green-600">
          +{promotion.increase_percent}%
        </div>
      )
    } else {
      return (
        <div className="text-sm text-gray-400">
          غير محدد
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">الترقيات</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  // Use real stats from the database
  const totalPromotions = stats.totals.total || 0
  const executedPromotions = stats.totals.executed_count || 0
  const pendingPromotions = stats.totals.pending_count || 0
  const totalRaiseUSD = stats.totals.total_raise_usd || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">الترقيات</h1>
        <div className="flex items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter ?? ''}
              onChange={e => setTypeFilter(e.target.value || undefined)}
            >
              <option value="">كل الأنواع</option>
              <option value="درجة">درجة</option>
              <option value="مسمى">مسمى</option>
              <option value="سنوية">سنوية</option>
              <option value="استثنائية">استثنائية</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة ترقية جديدة
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">إجمالي الترقيات</h3>
              <p className="text-2xl font-bold text-gray-900">{totalPromotions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-green-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">الترقيات المنفذة</h3>
              <p className="text-2xl font-bold text-green-600">{executedPromotions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">في الانتظار</h3>
              <p className="text-2xl font-bold text-yellow-600">{pendingPromotions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">زيادة الرواتب</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalRaiseUSD)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">سجل الترقيات</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المسمى السابق
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المسمى الجديد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدرجة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  زيادة الراتب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ السريان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {promotion.employee_name || <span className="text-gray-400">-</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      {promotion.promo_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {promotion.from_title || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {promotion.to_title || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promotion.from_grade && promotion.to_grade ? (
                      <div className="flex items-center">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {promotion.from_grade}
                        </span>
                        <TrendingUp className="w-4 h-4 mx-2 text-green-500" />
                        <span className="bg-green-100 px-2 py-1 rounded text-xs text-green-800">
                          {promotion.to_grade}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">غير محدد</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderSalaryIncrease(promotion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(promotion.effective_date).toLocaleDateString('ar')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(promotion.status)}`}>
                      {promotion.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        title="تعديل"
                        onClick={(e) => { e.stopPropagation(); onEdit(promotion); }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        title="عرض"
                        onClick={(e) => { e.stopPropagation(); onView(promotion); }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        title="حذف"
                        onClick={(e) => { e.stopPropagation(); onDelete(promotion); }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {(promotion.status === 'معتمد' || promotion.status === 'منفذ') && (
                        <button
                          title="مزامنة مع كشف الرواتب"
                          onClick={(e) => { e.stopPropagation(); handleSyncToPayroll(promotion); }}
                          disabled={syncingId === promotion.id}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-5 h-5 ${syncingId === promotion.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع الترقيات حسب الحالة</h3>
          <div className="space-y-4">
            {['في الانتظار', 'معتمد', 'منفذ', 'مرفوض'].map(status => {
              const byStatus = Object.fromEntries(stats.dist.map(d => [d.status, d.c]))
              const count = byStatus[status] || 0
              const percentage = totalPromotions > 0 ? (count / totalPromotions) * 100 : 0

              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                      {status}
                    </span>
                    <span className="mr-2 text-sm text-gray-600">({count})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-left">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات إضافية</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">معدل التنفيذ</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${totalPromotions > 0 ? (executedPromotions / totalPromotions) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {totalPromotions > 0 ? Math.round((executedPromotions / totalPromotions) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">متوسط الزيادة</span>
              <span className="text-sm font-bold text-gray-900">
                {executedPromotions > 0 ? formatCurrency(totalRaiseUSD / executedPromotions) : formatCurrency(0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">الترقيات المعلقة</span>
              <span className="text-sm font-bold text-yellow-600">
                {pendingPromotions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Promotion Form */}
      <PromotionForm
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSaved={handleCreateSave}
        employees={employees}
      />

      {/* Edit Promotion Form */}
      <PromotionForm
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditRow(null)
        }}
        onSaved={handleEditSave}
        initial={editRow}
        employees={employees}
      />

      {/* View Promotion Modal */}
      {viewOpen && viewRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">عرض الترقية</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع الترقية</label>
                  <p className="text-sm text-gray-900">{viewRow.promo_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المسمى السابق</label>
                  <p className="text-sm text-gray-900">{viewRow.from_title || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الجديد</label>
                  <p className="text-sm text-gray-900">{viewRow.to_title || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الدرجة السابقة</label>
                  <p className="text-sm text-gray-900">{viewRow.from_grade || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الدرجة الجديدة</label>
                  <p className="text-sm text-gray-900">{viewRow.to_grade || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ السريان</label>
                  <p className="text-sm text-gray-900">{new Date(viewRow.effective_date).toLocaleDateString('ar')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewRow.status)}`}>
                    {viewRow.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">زيادة الراتب</label>
                  {renderSalaryIncrease(viewRow)}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <p className="text-sm text-gray-900">{viewRow.notes || 'لا توجد ملاحظات'}</p>
                </div>
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
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="حذف الترقية"
        message="هل أنت متأكد من حذف هذه الترقية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  )
}
