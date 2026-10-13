import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { ArrowRight, User, Briefcase, Calendar, DollarSign, Award, BookOpen, Clock, Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { arabicUnit, AR_YEARS, AR_MONTHS } from '../../utils/format'

interface EmployeeData {
  id: number
  employee_no: string
  full_name: string
  job_title: string
  department: string
  join_date: string
  basic_salary: number
  currency: string
  status: string
  phone?: string
  email?: string
  address?: string
  nationality?: string
  birth_date?: string
  gender?: string
  marital_status?: string
  education_level?: string
  contract_type?: string
  contract_end?: string
}

export function EmployeeProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [leaves, setLeaves] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [promotions, setPromotions] = useState<any[]>([])

  useEffect(() => {
    if (id) loadProfile()
  }, [id])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const emp = await window.electronAPI.getEmployee(Number(id))
      setEmployee(emp)

      // Load related data
      const [leavesList, coursesList, promosList] = await Promise.all([
        window.electronAPI.invoke('leaves:list').catch(() => []),
        window.api?.listRecords?.('courses').catch(() => []) || [],
        window.electronAPI.listPromotions?.().catch(() => []) || []
      ])

      setLeaves((leavesList || []).filter((l: any) => l.employee_id === Number(id)))
      setCourses((coursesList || []).filter((c: any) => c.employee_id === Number(id)))
      setPromotions((promosList || []).filter((p: any) => p.employee_id === Number(id)))
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('فشل تحميل ملف الموظف')
    } finally {
      setLoading(false)
    }
  }

  const calculateServiceYears = (joinDate: string) => {
    const start = new Date(joinDate)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
    const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
    return { years, months }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold text-gray-900">ملف الموظف</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع
        </Button>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">الموظف غير موجود</h3>
        </div>
      </div>
    )
  }

  const service = calculateServiceYears(employee.join_date)

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Back button */}
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowRight className="w-4 h-4 ml-2" />
        رجوع
      </Button>

      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.full_name}</h1>
              <p className="text-gray-600">{employee.job_title} — {employee.department}</p>
              <p className="text-sm text-gray-400 mt-1">رقم الموظف: {employee.employee_no}</p>
            </div>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${employee.status === 'نشط' || employee.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}>
            {employee.status === 'active' ? 'نشط' : employee.status}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">سنوات الخدمة</p>
            <p className="text-lg font-bold text-gray-900">{service.years} {arabicUnit(service.years, AR_YEARS)} {service.months} {arabicUnit(service.months, AR_MONTHS)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">الراتب الأساسي</p>
            <p className="text-lg font-bold text-green-600">
              {(employee.basic_salary || 0).toLocaleString()} {employee.currency || 'TRY'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">الدورات التدريبية</p>
            <p className="text-lg font-bold text-purple-600">{courses.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-3">
          <Award className="w-8 h-8 text-orange-600" />
          <div>
            <p className="text-xs text-gray-500">الترقيات</p>
            <p className="text-lg font-bold text-orange-600">{promotions.length}</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            البيانات الشخصية
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {employee.birth_date && (
              <div>
                <label className="text-gray-500">تاريخ الميلاد</label>
                <p className="font-medium text-gray-900">{employee.birth_date}</p>
              </div>
            )}
            {employee.nationality && (
              <div>
                <label className="text-gray-500">الجنسية</label>
                <p className="font-medium text-gray-900">{employee.nationality}</p>
              </div>
            )}
            {employee.gender && (
              <div>
                <label className="text-gray-500">الجنس</label>
                <p className="font-medium text-gray-900">{employee.gender}</p>
              </div>
            )}
            {employee.marital_status && (
              <div>
                <label className="text-gray-500">الحالة الاجتماعية</label>
                <p className="font-medium text-gray-900">{employee.marital_status}</p>
              </div>
            )}
            {employee.education_level && (
              <div>
                <label className="text-gray-500">المستوى التعليمي</label>
                <p className="font-medium text-gray-900">{employee.education_level}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            معلومات الاتصال
          </h3>
          <div className="space-y-3 text-sm">
            {employee.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900" dir="ltr">{employee.phone}</span>
              </div>
            )}
            {employee.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900" dir="ltr">{employee.email}</span>
              </div>
            )}
            {employee.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{employee.address}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              بيانات التوظيف
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-gray-500">تاريخ الانضمام</label>
                <p className="font-medium text-gray-900">{employee.join_date}</p>
              </div>
              {employee.contract_type && (
                <div>
                  <label className="text-gray-500">نوع العقد</label>
                  <p className="font-medium text-gray-900">{employee.contract_type}</p>
                </div>
              )}
              {employee.contract_end && (
                <div>
                  <label className="text-gray-500">نهاية العقد</label>
                  <p className="font-medium text-gray-900">{employee.contract_end}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          سجل الإجازات ({leaves.length})
        </h3>
        {leaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">النوع</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">من</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">إلى</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الأيام</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaves.slice(0, 10).map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{leave.leave_type}</td>
                    <td className="px-4 py-2">{leave.from_date}</td>
                    <td className="px-4 py-2">{leave.to_date}</td>
                    <td className="px-4 py-2 font-bold">{leave.days_count}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leave.status === 'معتمد' ? 'bg-green-100 text-green-800' :
                          leave.status === 'مرفوض' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>{leave.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">لا توجد إجازات مسجلة</p>
        )}
      </div>

      {/* Courses & Promotions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            الدورات التدريبية ({courses.length})
          </h3>
          {courses.length > 0 ? (
            <div className="space-y-3">
              {courses.slice(0, 5).map((c: any) => (
                <div key={c.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="font-medium text-gray-900">{c.course_name}</p>
                  <p className="text-sm text-gray-600">{c.provider} — {c.start_date}</p>
                  {c.grade && <p className="text-sm text-purple-600 font-bold mt-1">الدرجة: {c.grade}%</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">لا توجد دورات مسجلة</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            الترقيات ({promotions.length})
          </h3>
          {promotions.length > 0 ? (
            <div className="space-y-3">
              {promotions.slice(0, 5).map((p: any) => (
                <div key={p.id} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="font-medium text-gray-900">{p.new_position || p.new_title}</p>
                  <p className="text-sm text-gray-600">{p.promotion_date || p.effective_date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">لا توجد ترقيات مسجلة</p>
          )}
        </div>
      </div>
    </div>
  )
}
