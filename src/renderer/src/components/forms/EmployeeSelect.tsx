import React, { useState, useEffect } from 'react'

interface EmployeeSelectProps {
  value: string | number | undefined
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function EmployeeSelect({ value, onChange, placeholder = "اختر الموظف", label = "الموظف" }: EmployeeSelectProps) {
  const [employees, setEmployees] = useState<Array<{ id: number; full_name: string; employee_no: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await window.api.listEmployeesBasic()
        setEmployees(data)
      } catch (error) {
        console.error('Failed to load employees:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEmployees()
  }, [])

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select 
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? 'جاري التحميل...' : placeholder}</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id.toString()}>
            {emp.employee_no} - {emp.full_name}
          </option>
        ))}
      </select>
    </div>
  )
}
