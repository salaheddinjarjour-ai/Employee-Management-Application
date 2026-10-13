import { useState, useEffect } from 'react'

export default function DbHealth() {
  const [info, setInfo] = useState<any>(null)

  useEffect(() => {
    const loadHealthInfo = async () => {
      try {
        if (window.api?.listRecords) {
          const employees = await window.api.listRecords('employees')
          const courses = await window.api.listRecords('courses')
          const evaluations = await window.api.listRecords('evaluations')
          const promotions = await window.api.listRecords('promotions')
          const rewards = await window.api.listRecords('rewards')
          const leaves = await window.api.listRecords('leaves')
          const absences = await window.api.listRecords('absences')
          
          setInfo({
            employees: employees?.length ?? 0,
            courses: courses?.length ?? 0,
            evaluations: evaluations?.length ?? 0,
            promotions: promotions?.length ?? 0,
            rewards: rewards?.length ?? 0,
            leaves: leaves?.length ?? 0,
            absences: absences?.length ?? 0,
          })
        }
      } catch (error) {
        console.error('[DbHealth] Failed to load health info:', error)
        setInfo({ error: 'Failed to load database info' })
      }
    }

    loadHealthInfo()
  }, [])

  return (
    <div className="bg-gray-50 p-3 rounded border">
      <h3 className="text-sm font-medium text-gray-900 mb-2">حالة قاعدة البيانات</h3>
      <pre className="text-xs text-gray-600">
        {info ? (
          info.error ? (
            `خطأ: ${info.error}`
          ) : (
            `الموظفون: ${info.employees}
الدورات: ${info.courses}
التقييمات: ${info.evaluations}
الترقيات: ${info.promotions}
المكافآت: ${info.rewards}
الإجازات: ${info.leaves}
الغيابات: ${info.absences}

مسار قاعدة البيانات: مسجل في وحدة التحكم الرئيسية`
          )
        ) : (
          'جاري تحميل المعلومات...'
        )}
      </pre>
    </div>
  )
}
