import { useState, useEffect, useMemo } from 'react'
import { Plus, Clock, User, AlertTriangle, Calendar, MessageSquare, Settings, X } from 'lucide-react'
import { Button } from '../ui/Button'
import ActionsBar from '../table/ActionsBar'
import Modal from '../ui/Modal'
import CreateEntityModal from '../form/CreateEntityModal'
import { absenceSchema } from '../../schemas/absence'
import { formatISODate, arabicUnit, AR_HOURS } from '../../utils/format'
import Confirm from '../ui/Confirm'
import { toast } from 'sonner'


interface Absence {
  id: number
  employee_id: number
  employee_name: string
  from_date: string
  to_date: string
  days_count: number
  type: string
  hours_missed: number
  reason: string
  status: string
  fine_amount?: number
  fine_currency?: string
  direct_manager_notes?: string
  hr_manager_notes?: string
  manager_notes?: string
}

// Dynamic absence form fields function
const getAbsenceFields = (absenceTypes: {id: number, name: string}[]) => [
  {
    type: 'employee-search' as const,
    name: 'employee_id',
    label: 'الموظف',
    required: true,
    placeholder: 'ابحث عن الموظف...'
  },
  {
    type: 'select' as const,
    name: 'type',
    label: 'نوع الغياب/التأخير',
    required: true,
    options: absenceTypes.length > 0
      ? absenceTypes.map(t => ({ label: t.name, value: t.name }))
      : [
          { label: 'غياب غير مبرر', value: 'غياب غير مبرر' },
          { label: 'تأخير', value: 'تأخير' },
          { label: 'مغادرة مبكرة', value: 'مغادرة مبكرة' },
          { label: 'عدم حضور', value: 'عدم حضور' },
        ]
  },
  { type: 'date' as const, name: 'from_date', label: 'تاريخ البداية', required: true },
  { type: 'date' as const, name: 'to_date', label: 'تاريخ النهاية', required: true },
  { type: 'number' as const, name: 'days_count', label: 'عدد الأيام', required: true },
  { type: 'number' as const, name: 'hours_missed', label: 'الساعات المفقودة (اختياري)', required: false },
  { type: 'text' as const, name: 'reason', label: 'سبب الغياب/التأخير', placeholder: 'اذكر سبب الغياب أو التأخير...' },
  {
    type: 'number' as const,
    name: 'fine_amount',
    label: 'مبلغ الغرامة (اختياري)',
    placeholder: '0.00',
    min: 0,
    step: 0.01,
  },
  {
    type: 'select' as const,
    name: 'fine_currency',
    label: 'عملة الغرامة',
    options: [
      { label: '₺ ليرة تركية', value: 'TRY' },
      { label: '$ دولار', value: 'USD' },
    ]
  },
  { type: 'textarea' as const, name: 'direct_manager_notes', label: 'ملاحظات المسؤول المباشر', placeholder: 'ملاحظات المسؤول المباشر...', rows: 2 },
  { type: 'textarea' as const, name: 'hr_manager_notes', label: 'ملاحظات مسؤول شؤون الموظفين', placeholder: 'ملاحظات مسؤول شؤون الموظفين...', rows: 2 },
  { type: 'textarea' as const, name: 'manager_notes', label: 'ملاحظات المدير التنفيذي', placeholder: 'ملاحظات المدير التنفيذي...', rows: 2 },
]

export function AbsencePage() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null)
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Manage types state
  const [manageTypesOpen, setManageTypesOpen] = useState(false)
  const [absenceTypes, setAbsenceTypes] = useState<{id: number, name: string}[]>([])
  const [newTypeName, setNewTypeName] = useState('')

  const loadAbsenceTypes = async () => {
    try {
      const types = await (window.api as any).listAbsenceTypes?.().catch?.(() => []) ?? []
      if (Array.isArray(types) && types.length > 0) setAbsenceTypes(types)
      else setAbsenceTypes(['غياب غير مبرر','تأخير','مغادرة مبكرة','عدم حضور'].map((n,i) => ({id:i,name:n})))
    } catch {
      setAbsenceTypes(['غياب غير مبرر','تأخير','مغادرة مبكرة','عدم حضور'].map((n,i) => ({id:i,name:n})))
    }
  }

  useEffect(() => { loadAbsenceTypes() }, [])



  const totalFinesTRY = useMemo(
    () => absences.filter(a => !a.fine_currency || a.fine_currency === 'TRY').reduce((acc, absence) => acc + Number(absence.fine_amount || 0), 0),
    [absences]
  )

  const totalFinesUSD = useMemo(
    () => absences.filter(a => a.fine_currency === 'USD').reduce((acc, absence) => acc + Number(absence.fine_amount || 0), 0),
    [absences]
  )

  const affectedEmployees = useMemo(
    () => new Set(absences.map(a => a.employee_id)).size,
    [absences]
  )

  const totalLostHours = useMemo(
    () => absences.reduce((acc, absence) => acc + Number(absence.hours_missed || 0), 0),
    [absences]
  )

  const loadAbsences = async () => {
    setLoading(true)
    try {
      const absencesData = await window.electronAPI.invoke('absences:list')
      setAbsences(absencesData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAbsences()

    if (window.events) {
      const sub = window.events.on('absences:refresh', loadAbsences)
      return () => { if (sub) sub() }
    }
    return () => { }
  }, [])

  const getAbsenceTypeColor = (type: string) => {
    switch (type) {
      case 'unexcused': case 'غياب غير مبرر': return 'bg-red-100 text-red-800'
      case 'late': case 'تأخير': return 'bg-yellow-100 text-yellow-800'
      case 'early_departure': case 'مغادرة مبكرة': return 'bg-orange-100 text-orange-800'
      case 'no_show': case 'عدم حضور': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAbsenceTypeText = (type: string) => {
    switch (type) {
      case 'unexcused': return 'غياب غير مبرر'
      case 'late': return 'تأخير'
      case 'early_departure': return 'مغادرة مبكرة'
      case 'no_show': return 'عدم حضور'
      default: return type || ''
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-blue-100 text-blue-800'
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800'
      case 'disputed': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'reported': return 'تم الإبلاغ'
      case 'acknowledged': return 'تم الاعتراف'
      case 'disputed': return 'متنازع عليه'
      case 'resolved': return 'تم الحل'
      default: return status || ''
    }
  }

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'unexcused':
      case 'no_show':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'early_departure':
        return <Calendar className="w-5 h-5 text-orange-500" />
      default:
        return <User className="w-5 h-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">سجل الغياب والتأخير</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500 text-right">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">سجل الغياب والتأخير</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setManageTypesOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            إدارة الأنواع
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة سجل غياب
          </Button>
        </div>
      </div>



      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">إجمالي الحالات</h3>
                <p className="text-2xl font-bold text-gray-900">{absences.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">الساعات المفقودة</h3>
              <p className="text-2xl font-bold text-yellow-600">{totalLostHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <User className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">موظفين متأثرين</h3>
              <p className="text-2xl font-bold text-blue-600">{affectedEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">₺</span>
            </div>
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">إجمالي الغرامات</h3>
              <p className="text-lg font-bold text-purple-600">₺{totalFinesTRY.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</p>
              {totalFinesUSD > 0 && (
                <p className="text-sm font-semibold text-green-600">${totalFinesUSD.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Absences Table */}
      {(
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900 text-right">سجل الغياب والتأخير</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right" dir="rtl">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الموظف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الساعات المفقودة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    السبب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الغرامة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {absences.map((absence) => (
                  <tr key={absence.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {absence.employee_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAbsenceTypeColor(absence.type)}`}>
                          {getAbsenceTypeText(absence.type)}
                        </span>
                        <span className="ml-2">{getSeverityIcon(absence.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatISODate(absence.from_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-red-600">{absence.hours_missed}</span>
                      <span className="text-sm text-gray-500 ml-1">ساعة</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {absence.reason || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {absence.fine_amount && absence.fine_amount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                          {absence.fine_currency === 'USD' ? '$' : '₺'}{Number(absence.fine_amount).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">لا توجد</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(absence.status)}`}>
                        {getStatusText(absence.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <ActionsBar
                        onEdit={() => {
                          setEditingAbsence(absence)
                          setShowCreateModal(true)
                        }}
                        onView={() => {
                          setSelectedAbsence(absence)
                          setShowViewModal(true)
                        }}
                        onDelete={async () => {
                          setConfirmDeleteId(absence.id)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      )}

      {/* Add/Edit Absence Modal */}
      <CreateEntityModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingAbsence(null)
        }}
        title={editingAbsence ? "تعديل سجل غياب" : "إضافة سجل غياب جديد"}
        entity="absences"
        schema={absenceSchema}
        fields={getAbsenceFields(absenceTypes)}
        defaults={editingAbsence || {}}
        recordId={editingAbsence?.id}
        onSuccess={() => loadAbsences()}
      />

      {/* View Absence Modal */}
      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        className="max-w-3xl"
      >
        <div className="p-6 text-right" dir="rtl">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">تفاصيل الغياب</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedAbsence ? getStatusColor(selectedAbsence.status) : ''}`}>
                {selectedAbsence ? getStatusText(selectedAbsence.status) : ''}
              </span>
            </div>
          </div>

          {selectedAbsence && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">الموظف</label>
                  <p className="text-sm font-medium text-gray-900">{selectedAbsence.employee_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">النوع</label>
                  <div className="flex items-center justify-end">
                    <span className="text-sm text-gray-900 mr-1">{getAbsenceTypeText(selectedAbsence.type)}</span>
                    <span className="ml-1">{getSeverityIcon(selectedAbsence.type)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">تاريخ الغياب</label>
                  <p className="text-sm text-gray-900">{formatISODate(selectedAbsence.from_date)} - {formatISODate(selectedAbsence.to_date)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">عدد الأيام</label>
                  <p className="text-sm text-gray-900">{selectedAbsence.days_count}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">الساعات المفقودة</label>
                  <p className="text-sm text-gray-900">{selectedAbsence.hours_missed} {arabicUnit(Number(selectedAbsence.hours_missed), AR_HOURS)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">الغرامة</label>
                  <p className="text-sm font-bold text-rose-600">
                    {selectedAbsence.fine_amount ? `₺${Number(selectedAbsence.fine_amount).toLocaleString('ar-SA')}` : 'لا توجد'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-xs font-medium text-gray-500 block mb-2">سبب الغياب</label>
                <p className="text-sm text-gray-900">{selectedAbsence.reason || 'لم يتم تحديد سبب'}</p>
              </div>

              {(selectedAbsence.direct_manager_notes || selectedAbsence.hr_manager_notes || selectedAbsence.manager_notes) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-end">
                    الملاحظات الإدارية
                    <MessageSquare className="w-4 h-4 ml-2" />
                  </h3>
                  <div className="space-y-4">
                    {selectedAbsence.direct_manager_notes && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <label className="text-xs font-bold text-blue-700 block mb-1">ملاحظات المسؤول المباشر</label>
                        <p className="text-sm text-gray-800">{selectedAbsence.direct_manager_notes}</p>
                      </div>
                    )}
                    {selectedAbsence.hr_manager_notes && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <label className="text-xs font-bold text-purple-700 block mb-1">ملاحظات مسؤول شؤون الموظفين</label>
                        <p className="text-sm text-gray-800">{selectedAbsence.hr_manager_notes}</p>
                      </div>
                    )}
                    {selectedAbsence.manager_notes && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <label className="text-xs font-bold text-amber-700 block mb-1">ملاحظات المدير</label>
                        <p className="text-sm text-gray-800">{selectedAbsence.manager_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Confirm
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (confirmDeleteId === null) return
          try {
            await window.electronAPI.invoke('absences:delete', confirmDeleteId)
            window.toast?.success?.('تم الحذف بنجاح')
            loadAbsences()
          } catch (error) {
            console.error('Failed to delete absence:', error)
            window.toast?.error?.('فشل الحذف')
          } finally {
            setConfirmDeleteId(null)
          }
        }}
        title="تأكيد حذف سجل الغياب"
        message="هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
      />

      {/* Manage Absence Types Modal */}
      {manageTypesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">إدارة أنواع الغياب والتأخير</h2>
              <button onClick={() => setManageTypesOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                {absenceTypes.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-gray-900">{t.name}</span>
                    <button
                      onClick={async () => {
                        await (window.api as any).deleteAbsenceType?.(t.id)
                        toast.success('تم الحذف')
                        loadAbsenceTypes()
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
                  placeholder="نوع غياب/تأخير جديد..."
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newTypeName.trim()) {
                      try {
                        await (window.api as any).createAbsenceType?.({ name: newTypeName.trim() })
                        toast.success('تمت الإضافة')
                        setNewTypeName('')
                        loadAbsenceTypes()
                      } catch (err: any) { toast.error(err.message) }
                    }
                  }}
                />
                <Button
                  onClick={async () => {
                    if (!newTypeName.trim()) return
                    try {
                      await (window.api as any).createAbsenceType?.({ name: newTypeName.trim() })
                      toast.success('تمت الإضافة')
                      setNewTypeName('')
                      loadAbsenceTypes()
                    } catch (err: any) { toast.error(err.message) }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  إضافة
                </Button>
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
