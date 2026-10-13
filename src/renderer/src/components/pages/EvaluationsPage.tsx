import { useState, useEffect } from 'react'
import { Plus, Star, Users, TrendingUp, Calendar, Search } from 'lucide-react'
import { Button } from '../ui/Button'
import ActionsBar from '../table/ActionsBar'
import Modal from '../ui/Modal'
import { EvaluationForm } from '../forms/EvaluationForm'
import { formatISODate } from '../../utils/format'
import Confirm from '../ui/Confirm'


interface Evaluation {
  id: number
  employee_id: number
  employee_name: string
  employee_job_title?: string
  employee_department?: string
  evaluator_id: number
  evaluator_name: string
  period: string
  overall_score: number
  rating: string
  goals_percent: number
  status: string
  evaluation_date: string
  notes?: string
}

export function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRow, setEditingRow] = useState<Evaluation | null>(null)
  const [viewRow, setViewRow] = useState<Evaluation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [employees, setEmployees] = useState<any[]>([])

  const [stats, setStats] = useState<{ totals: any, dist: any[] }>({
    totals: { total: 0, avg_score: 0, approved_count: 0, excellent_count: 0 },
    dist: []
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const refetch = async () => {
    setLoading(true)
    try {
      const [list, s] = await Promise.all([
        window.electronAPI.listEvaluations(),
        window.electronAPI.evaluationsStats()
      ])
      setEvaluations(list)
      setStats(s)
    } catch (error) {
      console.error('Failed to load evaluations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const result = await (window.electronAPI as any).listEmployees?.()
      if (Array.isArray(result)) setEmployees(result)
    } catch (e) {
      console.error('Failed to load employees:', e)
    }
  }

  const filteredEvaluations = evaluations.filter(ev => {
    if (!searchQuery) return true
    return (ev.employee_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.evaluator_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  })

  useEffect(() => {
    refetch()
    loadEmployees()
    const sub = window.events?.on('evaluations:refresh', refetch)
    return () => { if (sub) sub() }
  }, [])

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'ممتاز': return 'bg-green-100 text-green-800'
      case 'جيد جدًا': return 'bg-blue-100 text-blue-800'
      case 'جيد': return 'bg-cyan-100 text-cyan-800'
      case 'وسط': return 'bg-yellow-100 text-yellow-800'
      case 'ضعيف': return 'bg-red-100 text-red-800'
      // legacy values
      case 'مقبول': return 'bg-yellow-100 text-yellow-800'
      case 'يحتاج تحسين': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800'
      case 'معتمد': return 'bg-green-100 text-green-800'
      case 'مرفوض': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">تقييمات الأداء</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500 text-right">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">تقييمات الأداء</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم..."
              className="w-64 px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة تقييم جديد
          </Button>
        </div>
      </div>

      <div className="w-full space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="mr-4 text-right">
                  <h3 className="text-sm font-medium text-gray-500">إجمالي التقييمات</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.totals.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="mr-4 text-right">
                  <h3 className="text-sm font-medium text-gray-500">متوسط الدرجات</h3>
                  <p className="text-2xl font-bold text-green-600">{Math.round(stats.totals.avg_score || 0)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="mr-4 text-right">
                  <h3 className="text-sm font-medium text-gray-500">التقييمات المعتمدة</h3>
                  <p className="text-2xl font-bold text-purple-600">{stats.totals.approved_count}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-600" />
                <div className="mr-4 text-right">
                  <h3 className="text-sm font-medium text-gray-500">التقييمات الممتازة</h3>
                  <p className="text-2xl font-bold text-yellow-600">{stats.totals.excellent_count}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 text-right">سجل التقييمات</h3>
            </div>

            <div className="overflow-x-auto" dir="rtl">
              <table className="w-full text-right hover">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">المسمى الوظيفي</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">القسم/الوحدة</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">المقيم</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الفترة</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">النتيجة الإجمالية</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">التقييم</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                        {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد تقييمات'}
                      </td>
                    </tr>
                  ) : filteredEvaluations.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ev.employee_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ev.employee_job_title || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ev.employee_department || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ev.evaluator_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ev.period}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">{ev.overall_score}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(ev.rating)}`}>
                          {ev.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ev.status)}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <ActionsBar
                          onEdit={() => {
                            setEditingRow(ev)
                            setShowCreateModal(true)
                          }}
                          onView={() => setViewRow(ev)}
                          onDelete={async () => {
                            setConfirmDeleteId(ev.id)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      <EvaluationForm
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingRow(null)
        }}
        initial={editingRow}
        employees={employees}
        onSaved={() => {
          setShowCreateModal(false)
          setEditingRow(null)
          refetch()
        }}
      />

      {viewRow && (
        <Modal open={!!viewRow} onClose={() => setViewRow(null)} className="max-w-2xl">
          <div className="p-6 text-right" dir="rtl">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">تفاصيل التقييم</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">الموظف</label>
                <p className="font-bold">{viewRow.employee_name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">المقيم</label>
                <p className="font-bold">{viewRow.evaluator_name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">الفترة</label>
                <p>{viewRow.period}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">تاريخ التقييم</label>
                <p>{formatISODate(viewRow.evaluation_date)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">النتيجة</label>
                <p className="text-xl font-bold text-blue-600">{viewRow.overall_score}%</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">التقييم</label>
                <p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(viewRow.rating)}`}>
                    {viewRow.rating}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">نسبة تحقيق الأهداف</label>
                <p className="text-lg font-bold text-purple-600">{viewRow.goals_percent || 0}%</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">الحالة</label>
                <p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewRow.status)}`}>
                    {viewRow.status}
                  </span>
                </p>
              </div>
            </div>
            {(viewRow as any).notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <label className="text-xs text-gray-500 block mb-1">ملاحظات</label>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{(viewRow as any).notes}</p>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setViewRow(null)}>إغلاق</Button>
            </div>
          </div>
        </Modal>
      )}
      <Confirm
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (confirmDeleteId === null) return
          try {
            await window.electronAPI.deleteEvaluation(confirmDeleteId)
            window.toast?.success?.('تم الحذف بنجاح')
            refetch()
          } catch (e) {
            window.toast?.error?.('فشل الحذف')
          } finally {
            setConfirmDeleteId(null)
          }
        }}
        title="تأكيد حذف التقييم"
        message="هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
      />
    </div>
  )
}
