import React, { useState } from 'react'
import { Button } from '../ui/Button'
import EmployeeSelect from '../ui/EmployeeSelect'
import PayrollBuilder from '../payroll/PayrollBuilder'
import { EmployeeLite } from '../../types/employee'
import { toast } from 'react-hot-toast'

export function TestPayrollPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLite | null>(null)
  const [showPayrollBuilder, setShowPayrollBuilder] = useState(false)

  const getCurrentPeriod = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const handleEmployeeSelect = (employee: EmployeeLite | null) => {
    setSelectedEmployee(employee)
    if (employee) {
      toast.success(`تم اختيار الموظف: ${employee.full_name}`)
    }
  }

  const handleOpenPayroll = () => {
    if (!selectedEmployee) {
      toast.error('يرجى اختيار موظف أولاً')
      return
    }
    setShowPayrollBuilder(true)
  }

  const handlePayrollSaved = () => {
    toast.success('تم حفظ الراتب بنجاح!')
    setShowPayrollBuilder(false)
  }

  if (showPayrollBuilder && selectedEmployee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PayrollBuilder
          employeeId={selectedEmployee.id}
          period={getCurrentPeriod()}
          onSaved={handlePayrollSaved}
          onClose={() => setShowPayrollBuilder(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">اختبار نظام الرواتب</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">1. اختبار البحث عن الموظفين</h2>
              <EmployeeSelect
                value={selectedEmployee}
                onChange={handleEmployeeSelect}
                placeholder="ابحث عن الموظف بالاسم"
                className="max-w-md"
              />
              
              {selectedEmployee && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-800">الموظف المختار:</h3>
                  <p className="text-green-700">الاسم: {selectedEmployee.full_name}</p>
                  <p className="text-green-700">الرقم: {selectedEmployee.employee_no}</p>
                  {selectedEmployee.job_title && (
                    <p className="text-green-700">المسمى الوظيفي: {selectedEmployee.job_title}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">2. اختبار بناء الراتب</h2>
              <Button
                onClick={handleOpenPayroll}
                disabled={!selectedEmployee}
                className="bg-blue-600 hover:bg-blue-700"
              >
                فتح بناء الراتب
              </Button>
              
              {!selectedEmployee && (
                <p className="text-sm text-gray-500 mt-2">
                  يرجى اختيار موظف أولاً لفتح بناء الراتب
                </p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">3. معلومات النظام</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <p><strong>الفترة الحالية:</strong> {getCurrentPeriod()}</p>
                <p><strong>حالة النظام:</strong> جاهز للاختبار</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
