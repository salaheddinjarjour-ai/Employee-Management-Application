import React, { useState, useEffect } from 'react'
import { X, User, Building, Briefcase, Calendar, ExternalLink, Users, Award, Plane, Clock, DollarSign } from 'lucide-react'
import PayrollPreview from '../../components/payroll/PayrollPreview'
import { navigateToPayrollPage } from '../../utils/navigation'
import { arabicUnit, AR_DAYS } from '../../utils/format'

interface EmployeeProfile {
  employee: {
    id: number
    employee_no: string
    full_name: string
    department: string
    job_title: string
    hire_date: string
    phone?: string
    email?: string
    status: string
  }
  counts: {
    courses: number
    evaluations: number
    promotions: number
    rewards: number
    leaves: number
    absences: number
  }
  recent: {
    courses: any[]
    evaluations: any[]
    promotions: any[]
    rewards: any[]
    leaves: any[]
    absences: any[]
  }
}

interface EmployeeDrawerProps {
  open: boolean
  onClose: () => void
  employeeId: number | null
}

type TabKey = 'courses' | 'evaluations' | 'promotions' | 'rewards' | 'leaves' | 'absences' | 'payroll'

const tabConfig = {
  courses: {
    label: 'الدورات',
    icon: Users,
    color: 'blue',
    emptyText: 'لم يحضر أي دورات بعد'
  },
  evaluations: {
    label: 'التقييمات',
    icon: Award,
    color: 'green',
    emptyText: 'لا توجد تقييمات بعد'
  },
  promotions: {
    label: 'الترقيات',
    icon: ExternalLink,
    color: 'purple',
    emptyText: 'لا توجد ترقيات بعد'
  },
  rewards: {
    label: 'المكافآت',
    icon: Award,
    color: 'yellow',
    emptyText: 'لا توجد مكافآت بعد'
  },
  leaves: {
    label: 'الإجازات',
    icon: Plane,
    color: 'indigo',
    emptyText: 'لا توجد إجازات بعد'
  },
  absences: {
    label: 'الغياب',
    icon: Clock,
    color: 'red',
    emptyText: 'لا توجد سجلات غياب'
  },
  payroll: {
    label: 'الرواتب',
    icon: DollarSign,
    color: 'emerald',
    emptyText: 'لا توجد رواتب بعد'
  }
}

export default function EmployeeDrawer({ open, onClose, employeeId }: EmployeeDrawerProps) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('courses')

  const loadProfile = async () => {
    if (!employeeId) return

    setLoading(true)
    setError(null)

    try {
      const result = await window.api.getEmployeeProfile(employeeId)

      // Handle both wrapped {success:true, data:...} and direct {employee:...} formats
      if (result && result.employee) {
        setProfile(result)
      } else if (result && result.success && result.data) {
        setProfile(result.data)
      } else {
        throw new Error(result?.error || 'فشل في تحميل ملف الموظف')
      }
    } catch (err: any) {
      console.error('Failed to load employee profile:', err)
      setError(err.message || 'حدث خطأ أثناء تحميل ملف الموظف')
    } finally {
      setLoading(false)
    }
  }

  // Load profile when drawer opens or employee changes
  useEffect(() => {
    if (!open || !employeeId) return
    loadProfile()
  }, [open, employeeId])

  // Live refresh: listen to targeted events
  useEffect(() => {
    if (!open || !employeeId) return

    const handleRefresh = (payload: any) => {
      if (payload?.employee_id === employeeId) {
        console.log('Employee profile: refreshing due to targeted event', payload)
        loadProfile()
      }
    }

    // Listen to all module refresh events
    const events = [
      'courses:refreshOne',
      'evaluations:refreshOne',
      'promotions:refreshOne',
      'rewards:refreshOne',
      'leaves:refreshOne',
      'absences:refreshOne'
    ]

    events.forEach(event => {
      window.events?.on?.(event, handleRefresh)
    })

    return () => {
      events.forEach(event => {
        window.events?.off?.(event, handleRefresh)
      })
    }
  }, [open, employeeId])

  const handleViewAll = (module: string) => {
    // Navigate to module page with employee filter
    const url = `/${module}?employeeId=${employeeId}`
    window.location.hash = url
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
            <div className="flex items-center space-x-reverse space-x-3">
              <User className="h-8 w-8 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {loading ? 'جاري التحميل...' : profile?.employee.full_name || 'ملف الموظف'}
                </h2>
                {profile && (
                  <p className="text-sm text-gray-500">
                    {profile.employee.employee_no} • {profile.employee.department}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
                  <p className="text-gray-500">جاري تحميل ملف الموظف...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={loadProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              </div>
            )}

            {profile && (
              <div className="h-full flex flex-col">
                {/* Employee Info */}
                <div className="border-b bg-white px-6 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">المسمى الوظيفي:</span>
                      <span className="font-medium">{profile.employee.job_title}</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">القسم:</span>
                      <span className="font-medium">{profile.employee.department}</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">تاريخ التوظيف:</span>
                      <span className="font-medium">
                        {new Date(profile.employee.hire_date).toLocaleDateString('ar')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${profile.employee.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {profile.employee.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="border-b bg-gray-50 px-6 py-4">
                  <div className="grid grid-cols-6 gap-3">
                    {Object.entries(tabConfig).map(([key, config]) => {
                      const count = key === 'payroll' ? '-' : profile.counts[key as TabKey]
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key as TabKey)}
                          className={`p-3 rounded-lg text-center transition-colors ${activeTab === key
                            ? `bg-${config.color}-100 text-${config.color}-700 border-2 border-${config.color}-300`
                            : 'bg-white hover:bg-gray-100 border-2 border-gray-200'
                            }`}
                        >
                          <Icon className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs font-medium">{config.label}</div>
                          <div className="text-lg font-bold">{count}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {/* Special handling for payroll tab */}
                  {activeTab === 'payroll' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          الرواتب
                        </h3>
                      </div>
                      <PayrollPreview
                        employeeId={employeeId!}
                        onNavigateToPayroll={(empId, period) => {
                          navigateToPayrollPage({ employeeId: empId, period })
                          onClose()
                        }}
                      />
                    </div>
                  )}

                  {/* Regular tab content for other tabs */}
                  {Object.entries(tabConfig).map(([key, config]) => {
                    const tabKey = key as TabKey
                    const items = profile.recent[tabKey] || []

                    if (activeTab !== tabKey || tabKey === 'payroll') return null

                    return (
                      <div key={key} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {config.label} ({profile.counts[tabKey]})
                          </h3>
                          {profile.counts[tabKey] > 0 && (
                            <button
                              onClick={() => handleViewAll(key)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-reverse space-x-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>عرض الكل</span>
                            </button>
                          )}
                        </div>

                        {items.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">
                              <config.icon className="h-12 w-12 mx-auto" />
                            </div>
                            <p className="text-gray-500">{config.emptyText}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {items.map((item, index) => (
                              <div key={item.id || index} className="bg-white rounded-lg border p-4">
                                {/* Render different content based on module type */}
                                {tabKey === 'courses' && (
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.course_name}</h4>
                                    <p className="text-sm text-gray-600">{item.provider}</p>
                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                      <span>{item.start_date} - {item.end_date}</span>
                                      <span className={`px-2 py-1 rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        item.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {item.status}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {tabKey === 'evaluations' && (
                                  <div>
                                    <h4 className="font-medium text-gray-900">تقييم {item.evaluation_period}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-sm text-gray-600">النتيجة: {item.overall_score}%</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(item.evaluation_date).toLocaleDateString('ar')}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {tabKey === 'promotions' && (
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.promo_type}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-sm text-gray-600">{item.reference}</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(item.promo_date).toLocaleDateString('ar')}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {tabKey === 'rewards' && (
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.reward_type}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-sm text-gray-600">
                                        {item.amount ? `${item.amount} ليرة` : 'غير مالي'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(item.reward_date).toLocaleDateString('ar')}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {tabKey === 'leaves' && (
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.leave_type}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-sm text-gray-600">
                                        {item.days} {arabicUnit(Number(item.days), AR_DAYS)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(item.from_date).toLocaleDateString('ar')} - {new Date(item.to_date).toLocaleDateString('ar')}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {tabKey === 'absences' && (
                                  <div>
                                    <h4 className="font-medium text-gray-900">غياب</h4>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-sm text-gray-600">
                                        {item.days_count} {arabicUnit(Number(item.days_count), AR_DAYS)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(item.from_date).toLocaleDateString('ar')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
