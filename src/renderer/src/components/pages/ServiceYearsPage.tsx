import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Plus, Calendar, Award, TrendingUp, Users } from 'lucide-react'
import { AddServiceYearModal } from '../../features/service-years/AddServiceYearModal'
import { arabicUnit, AR_DAYS, AR_YEARS, AR_MONTHS } from '../../utils/format'

interface ServiceRecord {
  id: number
  employee_id: number
  employee_name: string
  hire_date: string
  years_of_service: number
  months_of_service: number
  total_days: number
  milestones: string[]
  benefits_eligible: string[]
  next_milestone: string
  days_to_next_milestone: number
}

export function ServiceYearsPage() {
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const loadServiceYears = async () => {
    setLoading(true)
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('service_years')
        setServiceRecords(data)
      }
    } catch (error) {
      console.error('Failed to load service years:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServiceYears()
  }, [])

  // Show empty state if no data
  const hasData = serviceRecords.length > 0 || loading

  const getMilestoneColor = (years: number) => {
    if (years >= 10) return 'bg-purple-100 text-purple-800'
    if (years >= 5) return 'bg-blue-100 text-blue-800'
    if (years >= 3) return 'bg-green-100 text-green-800'
    if (years >= 1) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">سنوات الخدمة</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  const avgServiceYears = serviceRecords.length > 0
    ? serviceRecords.reduce((sum, r) => sum + r.years_of_service, 0) / serviceRecords.length
    : 0

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">سنوات الخدمة</h1>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة سجل خدمة
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد سجلات خدمة</h3>
          <p className="text-sm text-gray-400">أضف سجل خدمة جديد للبدء</p>
        </div>
        <AddServiceYearModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => loadServiceYears()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">سنوات الخدمة</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة سجل خدمة
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">إجمالي الموظفين</h3>
              <p className="text-2xl font-bold text-gray-900">{serviceRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">متوسط سنوات الخدمة</h3>
              <p className="text-2xl font-bold text-green-600">{avgServiceYears.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-purple-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">موظفين +5 سنوات</h3>
              <p className="text-2xl font-bold text-purple-600">
                {serviceRecords.filter(r => r.years_of_service >= 5).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div className="mr-4">
              <h3 className="text-sm font-medium text-gray-500">موظفين جدد</h3>
              <p className="text-2xl font-bold text-orange-600">
                {serviceRecords.filter(r => r.years_of_service < 2).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">سجل سنوات الخدمة</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التوظيف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">سنوات الخدمة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المعالم المحققة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المزايا المستحقة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المعلم القادم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {serviceRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.employee_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.hire_date).toLocaleDateString('ar')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getMilestoneColor(record.years_of_service)}`}>
                      {record.years_of_service} {arabicUnit(record.years_of_service, AR_YEARS)} و {record.months_of_service} {arabicUnit(record.months_of_service, AR_MONTHS)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {record.milestones.map((milestone, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          {milestone}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {record.benefits_eligible.slice(0, 2).map((benefit, index) => (
                        <div key={index}>• {benefit}</div>
                      ))}
                      {record.benefits_eligible.length > 2 && (
                        <div className="text-xs text-gray-500">+{record.benefits_eligible.length - 2} أخرى</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.next_milestone}</div>
                    <div className="text-xs text-gray-500">بعد {record.days_to_next_milestone} {arabicUnit(record.days_to_next_milestone, AR_DAYS)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع سنوات الخدمة</h3>
          <div className="space-y-4">
            {[
              { label: 'أقل من سنة', min: 0, max: 1, color: 'bg-red-600' },
              { label: '1-3 سنوات', min: 1, max: 3, color: 'bg-yellow-600' },
              { label: '3-5 سنوات', min: 3, max: 5, color: 'bg-green-600' },
              { label: '5+ سنوات', min: 5, max: 100, color: 'bg-blue-600' }
            ].map(range => {
              const count = serviceRecords.filter(r =>
                r.years_of_service >= range.min && r.years_of_service < range.max
              ).length
              const percentage = serviceRecords.length > 0 ? (count / serviceRecords.length) * 100 : 0

              return (
                <div key={range.label} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 ${range.color} rounded mr-2`}></div>
                    <span className="text-sm font-medium text-gray-700">{range.label}</span>
                    <span className="mr-2 text-sm text-gray-600">({count})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className={`${range.color} h-2 rounded-full`}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">المعالم القادمة</h3>
          <div className="space-y-3">
            {serviceRecords
              .sort((a, b) => a.days_to_next_milestone - b.days_to_next_milestone)
              .slice(0, 4)
              .map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">{record.employee_name}</p>
                    <p className="text-sm text-blue-600">{record.next_milestone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-800">{record.days_to_next_milestone} {arabicUnit(record.days_to_next_milestone, AR_DAYS)}</p>
                    <p className="text-xs text-blue-600">متبقي</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Add Service Year Modal */}
      <AddServiceYearModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => loadServiceYears()}
      />
    </div>
  )
}
