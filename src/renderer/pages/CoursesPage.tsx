// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState, useEffect } from 'react'
import { Button } from '../src/components/ui/Button'
import { Plus, Edit, Eye, Trash2, Download, Filter } from 'lucide-react'
import { useAppStore } from '../src/store/appStore'
import Modal from '../src/components/Modal'
import AddCourseForm from '../src/features/courses/AddCourseForm'
import ActionsBar from '../src/components/table/ActionsBar'
import CourseViewModal from '../features/courses/CourseViewModal'

interface Course {
  id: number
  course_name: string
  employee_name: string
  provider: string
  start_date: string
  end_date: string
  result: string
  grade: number | null
  status: 'مخطط' | 'جاري' | 'مكتمل' | 'ملغي'
}

export function CoursesPage() {
  const { currencyView, activeRate } = useAppStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // Modal states for view/edit/delete
  const [viewOpen, setViewOpen] = useState(false)
  const [viewCourse, setViewCourse] = useState<Course | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const loadCourses = async () => {
    setLoading(true)
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('courses')
        setCourses(data)
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for courses
  useEffect(() => {
    loadCourses()
  }, [])

  // Action handlers
  function openView(course: Course) {
    setViewCourse(course)
    setViewOpen(true)
  }

  function openEdit(course: Course) {
    setEditCourse(course)
    setEditOpen(true)
  }

  async function confirmDelete(course: Course) {
    if (!confirm(`هل أنت متأكد من حذف الدورة "${course.course_name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) return
    
    setDeleting(course.id)
    try {
      await window.api.deleteCourse(course.id)
      // Show success message (you can add toast here)
      console.log('تم حذف الدورة بنجاح')
      loadCourses() // Refresh the list
    } catch (error) {
      console.error('تعذر الحذف:', error)
      alert('تعذر حذف الدورة. يرجى المحاولة مرة أخرى.')
    } finally {
      setDeleting(null)
    }
  }

  // Sample data matching Figma design
  useEffect(() => {
    if (courses.length === 0 && !loading) {
      const figmaDesignCourses: Course[] = [
        {
          id: 1,
          course_name: 'React',
          employee_name: 'أحمد محمد علي',
          provider: 'معهد التقنية',
          start_date: '2023-06-01',
          end_date: '2023-06-15',
          result: 'ممتاز',
          grade: 95,
          status: 'مكتمل'
        },
        {
          id: 2,
          course_name: 'المحاسبة المتقدمة',
          employee_name: 'فاطمة عبد الله',
          provider: 'معهد المحاسبين',
          start_date: '2023-04-15',
          end_date: '2023-04-20',
          result: 'ممتاز',
          grade: 94,
          status: 'مكتمل'
        },
        {
          id: 3,
          course_name: 'إدارة المشاريع الاحترافية',
          employee_name: 'خالد عبد الرحمن',
          provider: 'معهد الإدارة',
          start_date: '2023-05-20',
          end_date: '2023-05-25',
          result: 'ممتاز',
          grade: 96,
          status: 'مكتمل'
        },
        {
          id: 4,
          course_name: 'الأمن السيبراني',
          employee_name: 'سارة أحمد',
          provider: 'أكاديمية التقنية',
          start_date: '2023-07-01',
          end_date: '2023-07-10',
          result: 'في التقدم',
          grade: null,
          status: 'جاري'
        }
      ]
    
      setTimeout(() => {
        setCourses(figmaDesignCourses)
        setLoading(false)
      }, 500)
    }
  }, [loading])

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
          onClick={() => setShowAddModal(true)}
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
                  اسم الدورة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  اسم الموظف
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  مقدم التدريب
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  المدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  النتيجة
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  الدرجة
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
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {course.course_name}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {course.employee_name}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {course.provider}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {course.start_date} → {course.end_date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(course.result)}`}>
                      {course.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {course.grade ? `${course.grade}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <ActionsBar
                      onView={() => openView(course)}
                      onEdit={() => openEdit(course)}
                      onDelete={() => confirmDelete(course)}
                    />
                    {deleting === course.id && (
                      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <div className="text-sm text-gray-600">جارٍ الحذف...</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <AddCourseForm onClose={() => setShowAddModal(false)} />
      </Modal>

      {/* Course View Modal */}
      {viewOpen && viewCourse && (
        <CourseViewModal
          course={viewCourse}
          onClose={() => setViewOpen(false)}
        />
      )}

      {/* Course Edit Modal */}
      {editOpen && editCourse && (
        <Modal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title="تعديل الدورة التدريبية"
        >
          <AddCourseForm
            initialData={editCourse}
            onSuccess={() => {
              setEditOpen(false)
              loadCourses()
            }}
          />
        </Modal>
      )}
    </div>
  )
}