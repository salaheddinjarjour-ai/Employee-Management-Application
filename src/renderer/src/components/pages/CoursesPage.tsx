import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { Button } from '../ui/Button'
import { Plus, Edit, Eye, Trash2, Download, Filter, Paperclip } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import CreateEntityModal from '../form/CreateEntityModal'
import ActionsBar from '../table/ActionsBar'
import Confirm from '../ui/Confirm'
import { courseSchema } from '../../schemas/course'
import { CourseForm } from '../forms/CourseForm'

interface Course {
  id: number
  course_name: string
  employee_name: string
  provider: string
  trainer_name?: string
  training_org?: string
  start_date: string
  end_date: string
  result: string
  grade: number | null
  status: 'مخطط' | 'جاري' | 'مكتمل' | 'ملغي'
  attachment_name?: string
  attachment_path?: string
  attachment_size?: number
}

// Using the imported courseSchema from schemas/course.ts

// Dynamic course form fields function
const getCourseFields = (employees: any[]) => [
  {
    type: 'select' as const,
    name: 'employee_id',
    label: 'الموظف',
    required: true,
    options: employees.map(e => ({
      label: `${e.employee_no} - ${e.full_name}`,
      value: e.id, // IMPORTANT: numeric ID
    })),
    placeholder: 'اختر الموظف'
  },
  { type: 'text' as const, name: 'course_name', label: 'اسم الدورة', required: true, placeholder: 'مثال: React المتقدم' },
  { type: 'text' as const, name: 'provider', label: 'مقدم التدريب', required: true, placeholder: 'مثال: معهد التقنية' },
  { type: 'date' as const, name: 'start_date', label: 'تاريخ البداية', required: true },
  { type: 'date' as const, name: 'end_date', label: 'تاريخ النهاية', required: true },
  {
    type: 'select' as const,
    name: 'status',
    label: 'الحالة',
    required: true,
    options: [
      { label: 'مخطط', value: 'مخطط' },
      { label: 'جاري', value: 'جاري' },
      { label: 'مكتمل', value: 'مكتمل' },
      { label: 'ملغي', value: 'ملغي' }
    ],
    placeholder: 'اختر الحالة'
  },
  {
    type: 'select' as const,
    name: 'result',
    label: 'النتيجة',
    options: [
      { label: 'ممتاز', value: 'ممتاز' },
      { label: 'جيد جداً', value: 'جيد جداً' },
      { label: 'جيد', value: 'جيد' },
      { label: 'مقبول', value: 'مقبول' },
      { label: 'في التقدم', value: 'في التقدم' }
    ],
    placeholder: 'اختر النتيجة'
  },
  { type: 'text' as const, name: 'grade', label: 'الدرجة %', placeholder: '85' },
]

export function CoursesPage() {
  const { currencyView, activeRate } = useAppStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Modal states
  const [viewOpen, setViewOpen] = useState(false)
  const [viewRow, setViewRow] = useState<Course | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<Course | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const loadCourses = async () => {
    setLoading(true)
    try {
      if (window.api?.listCourses) {
        const data = await window.api.listCourses()
        setCourses(data)
      } else if (window.api?.listRecords) {
        const data = await window.api.listRecords('courses')
        setCourses(data)
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
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

  // Load courses and employees
  useEffect(() => {
    loadCourses()
    loadEmployees()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مخطط': return 'bg-blue-100 text-blue-800'
      case 'جاري': return 'bg-green-100 text-green-800'
      case 'مكتمل': return 'bg-gray-100 text-gray-800'
      case 'ملغي': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'ممتاز': return 'bg-green-100 text-green-800'
      case 'جيد جداً': return 'bg-blue-100 text-blue-800'
      case 'جيد': return 'bg-yellow-100 text-yellow-800'
      case 'مقبول': return 'bg-orange-100 text-orange-800'
      case 'راسب': return 'bg-red-100 text-red-800'
      case 'في التقدم': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExport = () => {
    const filteredData = statusFilter
      ? courses.filter(course => course.status === statusFilter)
      : courses

    const csvContent = [
      ['اسم الدورة', 'اسم الموظف', 'مقدم التدريب', 'تاريخ البداية', 'تاريخ النهاية', 'النتيجة', 'الدرجة', 'الحالة'],
      ...filteredData.map(course => [
        course.course_name,
        course.employee_name,
        course.provider,
        course.start_date,
        course.end_date,
        course.result,
        course.grade ? `${course.grade}%` : '-',
        course.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `courses-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Action handlers
  const onEdit = (row: Course) => {
    setEditRow(row)
    setEditOpen(true)
  }

  const onView = (row: Course) => {
    setViewRow(row)
    setViewOpen(true)
  }

  const onDelete = async (row: Course) => {
    setConfirmDeleteId(row.id)
  }

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return

    try {
      const courseToDelete = courses.find(c => c.id === confirmDeleteId)

      if (window.api?.deleteCourse) {
        await window.api.deleteCourse(confirmDeleteId)

        // Delete stored file if it exists
        if (courseToDelete?.attachment_path && window.api?.removeCourseAttachment) {
          await window.api.removeCourseAttachment(courseToDelete.attachment_path)
        }

        // Show success message
        if (window.toast?.success) {
          window.toast.success('تم حذف الدورة بنجاح')
        }

        // Reload courses
        loadCourses()
      }
    } catch (error) {
      console.error('Delete error:', error)
      if (window.toast?.error) {
        window.toast.error('تعذر حذف الدورة')
      }
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleEditSave = async (data: any) => {
    try {
      if (editRow && window.api?.updateCourse) {
        await window.api.updateCourse(editRow.id, data)

        if (window.toast?.success) {
          window.toast.success('تم تحديث الدورة بنجاح')
        }

        loadCourses()
        setEditOpen(false)
        setEditRow(null)
      }
    } catch (error) {
      console.error('Update error:', error)
      if (window.toast?.error) {
        window.toast.error('تعذر تحديث الدورة')
      }
    }
  }

  const handleCreateSave = async (data: any) => {
    try {
      if (window.api?.createCourse) {
        await window.api.createCourse(data)

        if (window.toast?.success) {
          window.toast.success('تم إضافة الدورة بنجاح')
        }

        loadCourses()
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Create error:', error)
      if (window.toast?.error) {
        window.toast.error('تعذر إضافة الدورة')
      }
    }
  }

  const filteredCourses = statusFilter
    ? courses.filter(course => course.status === statusFilter)
    : courses

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 text-right">إدارة الدورات التدريبية</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500 text-right">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 text-right">إدارة الدورات التدريبية</h1>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">فلترة حسب الحالة</option>
            <option value="مخطط">مخطط</option>
            <option value="جاري">جاري</option>
            <option value="مكتمل">مكتمل</option>
            <option value="ملغي">ملغي</option>
          </select>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center space-x-reverse space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>تصدير</span>
          </Button>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-reverse space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دورة جديدة</span>
        </Button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="h-14">
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  اسم الموظف
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  اسم الدورة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  الجهة المنفذة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  جهة التدريب
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  اسم المدرّب
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  تاريخ الدورة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  الدرجة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  النتيجة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCourses.map((course, index) => (
                <tr key={course.id} className={`h-14 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {course.employee_name}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {course.course_name}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {course.provider}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {course.training_org || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {course.trainer_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {course.start_date} → {course.end_date}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {course.grade ? `${course.grade}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(course.result)}`}>
                      {course.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        title="تعديل"
                        onClick={(e) => { e.stopPropagation(); onEdit(course); }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        title="عرض"
                        onClick={(e) => { e.stopPropagation(); onView(course); }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        title="حذف"
                        onClick={(e) => { e.stopPropagation(); onDelete(course); }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {course.attachment_path && (
                        <button
                          title="فتح الشهادة"
                          onClick={(e) => { e.stopPropagation(); window.api?.openPath(course.attachment_path!); }}
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          <Paperclip className="w-5 h-5" />
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

      {/* Add Course Form */}
      <CourseForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateSave}
        employees={employees}
      />

      {/* View Course Modal */}
      {viewOpen && viewRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">تفاصيل الدورة</h2>
              <button
                onClick={() => setViewOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">اسم الموظف</label>
                  <p className="text-gray-900">{viewRow.employee_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">اسم الدورة</label>
                  <p className="text-gray-900">{viewRow.course_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">الجهة المنفذة</label>
                  <p className="text-gray-900">{viewRow.provider}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">تاريخ البداية</label>
                  <p className="text-gray-900">{viewRow.start_date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">تاريخ النهاية</label>
                  <p className="text-gray-900">{viewRow.end_date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">الدرجة</label>
                  <p className="text-gray-900">{viewRow.grade ? `${viewRow.grade}%` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">النتيجة</label>
                  <p className="text-gray-900">{viewRow.result || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">الحالة</label>
                  <p className="text-gray-900">{viewRow.status}</p>
                </div>
              </div>

              {/* Certificate Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-600">الشهادة</label>
                {viewRow.attachment_path ? (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-gray-900">{viewRow.attachment_name}</span>
                    <button
                      onClick={() => window.api?.openPath(viewRow.attachment_path!)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      فتح الشهادة
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-2">لا يوجد شهادة مرفقة</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Form */}
      <CourseForm
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditRow(null)
        }}
        onSave={handleEditSave}
        initialData={editRow}
        employees={employees}
      />

      {/* Delete Confirmation */}
      <Confirm
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="تأكيد حذف الدورة"
        message={confirmDeleteId ? `سيتم حذف الدورة نهائياً. هذا الإجراء لا يمكن التراجع عنه.` : ''}
        confirmText="حذف نهائي"
      />
    </div>
  )
}
