import React, { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { AttachmentUpload } from './AttachmentUpload'
import { cn } from './ui/utils'
import { X, User, BookOpen, Star, TrendingUp, Gift, Calendar, Clock, DollarSign, FileText, Edit } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { formatCurrency } from '@/utils/currency'
import { arabicUnit, AR_DAYS, AR_YEARS } from '@/utils/format'

interface Employee {
  id: number
  employee_no: string
  full_name: string
  email: string
  department?: string
  unit?: string
  job_title?: string
  hire_date: string
  salary_grade_id: number
  phone?: string
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
  notes?: string
  roles?: {
    role_type: string
    entity_name: string
    job_title?: string
    is_primary: boolean
  }[]
}

interface EmployeeDetailsProps {
  employee: Employee
  onClose: () => void
  onEdit?: (employee: Employee) => void
  mode?: 'drawer' | 'fullpage'
  className?: string
}

const TABS = [
  { id: 'basic', label: 'المعلومات الأساسية', icon: User },
  { id: 'courses', label: 'الدورات التدريبية', icon: BookOpen },
  { id: 'evaluations', label: 'التقييمات', icon: Star },
  { id: 'promotions', label: 'الترقيات والمكافآت', icon: TrendingUp },
  { id: 'rewards', label: 'المكافآت', icon: Gift },
  { id: 'leaves', label: 'الإجازات', icon: Calendar },
  { id: 'absences', label: 'الغياب', icon: Clock },
  { id: 'payroll', label: 'كشف الراتب', icon: DollarSign },
  { id: 'service', label: 'سنوات الخدمة', icon: Clock },
  { id: 'attachments', label: 'المرفقات', icon: FileText },
]

export function EmployeeDetails({ employee, onClose, onEdit, mode = 'drawer', className }: EmployeeDetailsProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const { currencyView, activeRate } = useAppStore()

  const isDrawer = mode === 'drawer'

  const containerClasses = isDrawer
    ? "fixed inset-0 z-50 flex"
    : "min-h-screen bg-gray-50"

  const contentClasses = isDrawer
    ? "ml-auto w-[70vw] bg-white shadow-xl flex flex-col max-h-screen"
    : "max-w-6xl mx-auto bg-white shadow-sm rounded-lg"

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">رقم الموظف</label>
                  <p className="text-lg font-semibold text-gray-900">{employee.employee_no}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الاسم الكامل</label>
                  <p className="text-lg font-semibold text-gray-900">{employee.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                  <p className="text-gray-900">{employee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">رقم الهاتف</label>
                  <p className="text-gray-900">{employee.phone || 'غير محدد'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="col-span-full">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">الأدوار والجهات</label>
                  {employee.roles && employee.roles.length > 0 ? (
                    <div className="flex flex-col space-y-2">
                      {employee.roles.filter(r => r.is_primary).map((r, i) => (
                        <div key={`primary-${i}`} className="flex items-center space-x-reverse space-x-2">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100 placeholder-hide shrink-0">أساسي</span>
                          <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200 shrink-0">
                            {r.role_type === 'committee' ? 'لجنة' : r.role_type === 'unit' ? 'وحدة' : 'قسم'}
                          </span>
                          {r.job_title && <span className="text-gray-900 font-medium text-sm">{r.job_title}</span>}
                          <span className="text-gray-600 text-sm">- {r.entity_name}</span>
                        </div>
                      ))}
                      {employee.roles.filter(r => !r.is_primary).map((r, i) => (
                        <div key={`backup-${i}`} className="flex items-center space-x-reverse space-x-2">
                          <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200 shrink-0">
                            {r.role_type === 'committee' ? 'لجنة' : r.role_type === 'unit' ? 'وحدة' : 'قسم'}
                          </span>
                          {r.job_title && <span className="text-gray-800 text-sm">{r.job_title}</span>}
                          <span className="text-gray-600 text-sm">- {r.entity_name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">لا توجد أدوار مسندة</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">تاريخ التوظيف</label>
                  <p className="text-gray-900">{new Date(employee.hire_date).toLocaleDateString('ar')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الحالة</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ملاحظات</label>
                  <p className="text-gray-900">{employee.notes || 'لا توجد ملاحظات'}</p>
                </div>
              </div>
            </div>

            {/* Service Years Calculation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">معلومات الخدمة</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">سنوات الخدمة</span>
                  <p className="font-semibold text-blue-900">
                    {(() => { const y = Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365)); return `${y} ${arabicUnit(y, AR_YEARS)}` })()} 
                  </p>
                </div>
                <div>
                  <span className="text-blue-600">درجة الراتب</span>
                  <p className="font-semibold text-blue-900">الدرجة {employee.salary_grade_id}</p>
                </div>
                <div>
                  <span className="text-blue-600">تاريخ الانضمام</span>
                  <p className="font-semibold text-blue-900">{new Date(employee.hire_date).toLocaleDateString('ar')}</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'courses':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">الدورات التدريبية</h3>
              <Button size="sm">إضافة دورة</Button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد دورات تدريبية مسجلة</p>
              <p className="text-sm text-gray-400 mt-1">سيتم عرض دورات الموظف التدريبية هنا</p>
            </div>
          </div>
        )

      case 'evaluations':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">التقييمات</h3>
              <Button size="sm">إضافة تقييم</Button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد تقييمات</p>
              <p className="text-sm text-gray-400 mt-1">سيتم عرض تقييمات أداء الموظف هنا</p>
            </div>
          </div>
        )

      case 'promotions':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">الترقيات</h3>
              <Button size="sm">إضافة ترقية</Button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد ترقيات</p>
              <p className="text-sm text-gray-400 mt-1">سيتم عرض تاريخ ترقيات الموظف هنا</p>
            </div>
          </div>
        )

      case 'rewards':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">المكافآت</h3>
              <Button size="sm">إضافة مكافأة</Button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد مكافآت</p>
              <p className="text-sm text-gray-400 mt-1">سيتم عرض مكافآت الموظف هنا</p>
            </div>
          </div>
        )

      case 'leaves':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">الإجازات</h3>
              <Button size="sm">طلب إجازة</Button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد إجازات</p>
              <p className="text-sm text-gray-400 mt-1">سيتم عرض طلبات إجازات الموظف هنا</p>
            </div>
          </div>
        )

      case 'absences':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">الغياب</h3>
              <Button size="sm">تسجيل غياب</Button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">لا توجد سجلات غياب</p>
              <p className="text-sm text-gray-400 mt-1">سيتم عرض سجلات غياب الموظف هنا</p>
            </div>
          </div>
        )

      case 'payroll':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">كشف الراتب</h3>
              <Button size="sm">إضافة راتب</Button>
            </div>

            {/* Sample Payroll Data */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h4 className="font-medium text-gray-900">الراتب الحالي</h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">الراتب الأساسي</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(4200, currencyView, activeRate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">البدلات</label>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(800, currencyView, activeRate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">الإجمالي</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(5000, currencyView, activeRate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">سجلات الرواتب السابقة</p>
              <p className="text-sm text-gray-400 mt-1">سيتم عرض تاريخ رواتب الموظف هنا</p>
            </div>
          </div>
        )

      case 'service':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">سنوات الخدمة</h3>

            {/* Service Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-blue-900">بداية الخدمة</h4>
                    <p className="text-sm text-blue-700">{new Date(employee.hire_date).toLocaleDateString('ar')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-900">
                      {Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                    </p>
                    <p className="text-sm text-blue-700">{arabicUnit(Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365)), AR_YEARS)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-900">الأيام المتبقية للتقاعد</h5>
                    <p className="text-lg font-semibold text-gray-700">
                      {(() => { const d = Math.max(0, 25 * 365 - Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24))); return `${d} ${arabicUnit(d, AR_DAYS)}` })()} 
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-900">إجمالي أيام العمل</h5>
                    <p className="text-lg font-semibold text-gray-700">
                      {(() => { const d = Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24)); return `${d} ${arabicUnit(d, AR_DAYS)}` })()} 
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'attachments':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">المرفقات</h3>
            <AttachmentUpload
              entityType="employee"
              entityId={employee.id}
              uploadedBy={1} // TODO: Get from current user
            />
          </div>
        )

      default:
        return <div>محتوى غير متوفر</div>
    }
  }

  return (
    <div className={containerClasses}>
      {isDrawer && (
        <div className="flex-1 bg-black/50" onClick={onClose} />
      )}

      <div className={cn(contentClasses, className)}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{employee.full_name}</h1>
              <p className="text-sm text-gray-500">
                {employee.employee_no} • {employee.roles?.find(r => r.is_primary)?.job_title || 'موظف'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-reverse space-x-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(employee)}>
                <Edit className="w-4 h-4 mr-2" />
                تحرير
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-white">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-reverse space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          "flex-1 p-6 bg-gray-50",
          isDrawer ? "overflow-y-auto" : ""
        )}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
