// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState, useEffect } from 'react'
import { Button } from '../src/components/ui/Button'
import { Plus, Search, Download, Edit, Trash2, Eye } from 'lucide-react'
import { AddEmployeeModal } from '../src/features/employees/AddEmployeeModal'

interface Employee {
  id: number
  employee_no: string
  full_name: string
  email: string
  department: string
  job_title: string
  hire_date: string
  phone: string
  status: 'نشط' | 'غير نشط' | 'إجازة'
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadEmployees = async () => {
    setLoading(true)
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('employees')
        setEmployees(data)
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sample data matching Figma design
  useEffect(() => {
    if (employees.length === 0 && !loading) {
      const figmaDesignEmployees: Employee[] = [
        {
          id: 1,
          employee_no: 'EMP001',
          full_name: 'أحمد محمد علي',
          email: 'ahmed@company.com',
          department: 'تقنية المعلومات',
          job_title: 'مطور أول',
          hire_date: '2020-01-15',
          phone: '0501234567',
          status: 'نشط'
        },
        {
          id: 2,
          employee_no: 'EMP002',
          full_name: 'فاطمة عبد الله',
          email: 'fatima@company.com',
          department: 'المالية',
          job_title: 'محاسبة',
          hire_date: '2019-03-20',
          phone: '0509876543',
          status: 'نشط'
        },
        {
          id: 3,
          employee_no: 'EMP003',
          full_name: 'خالد عبد الرحمن',
          email: 'khalid@company.com',
          department: 'العمليات',
          job_title: 'مدير مشروع',
          hire_date: '2018-07-10',
          phone: '0512345678',
          status: 'إجازة'
        },
        {
          id: 4,
          employee_no: 'EMP004',
          full_name: 'سارة أحمد',
          email: 'sara@company.com',
          department: 'الموارد البشرية',
          job_title: 'أخصائية موارد بشرية',
          hire_date: '2021-05-12',
          phone: '0555123456',
          status: 'نشط'
        }
      ]
    
      setTimeout(() => {
        setEmployees(figmaDesignEmployees)
        setLoading(false)
      }, 500)
    }
  }, [loading])

  useEffect(() => {
    loadEmployees()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-green-100 text-green-800'
      case 'غير نشط': return 'bg-red-100 text-red-800'
      case 'إجازة': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExport = () => {
    const filteredData = searchTerm 
      ? employees.filter(emp => 
          emp.full_name.includes(searchTerm) ||
          emp.employee_no.includes(searchTerm) ||
          emp.department.includes(searchTerm)
        )
      : employees

    const csvContent = [
      ['رقم الموظف', 'الاسم الكامل', 'القسم', 'المسمى الوظيفي', 'تاريخ التوظيف', 'الهاتف', 'البريد الإلكتروني', 'الحالة'],
      ...filteredData.map(emp => [
        emp.employee_no,
        emp.full_name,
        emp.department,
        emp.job_title,
        emp.hire_date,
        emp.phone,
        emp.email,
        emp.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `employees-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const filteredEmployees = searchTerm 
    ? employees.filter(emp => 
        emp.full_name.includes(searchTerm) ||
        emp.employee_no.includes(searchTerm) ||
        emp.department.includes(searchTerm)
      )
    : employees

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-xl)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-3xl)', 
          fontWeight: 'bold', 
          color: 'var(--neutral-900)', 
          textAlign: 'right',
          marginBottom: 'var(--spacing-lg)'
        }}>
          إدارة الموظفين
        </h1>
        <div style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--neutral-200)',
          padding: 'var(--spacing-xl)'
        }}>
          <p style={{ color: 'var(--neutral-500)', textAlign: 'right' }}>جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      {/* Header */}
      <h1 style={{ 
        fontSize: 'var(--font-size-3xl)', 
        fontWeight: 'bold', 
        color: 'var(--neutral-900)', 
        textAlign: 'right',
        marginBottom: 'var(--spacing-lg)'
      }}>
        إدارة الموظفين
      </h1>

      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search style={{ 
              position: 'absolute', 
              right: 'var(--spacing-sm)', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--neutral-400)', 
              width: '16px', 
              height: '16px' 
            }} />
            <input
              type="text"
              placeholder="البحث بالاسم أو رقم الموظف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: '1px solid var(--neutral-300)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-sm) var(--spacing-lg) var(--spacing-sm) var(--spacing-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--neutral-700)',
                backgroundColor: 'white',
                width: '300px',
                textAlign: 'right'
              }}
            />
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            <span>تصدير</span>
          </Button>
        </div>
        
        <Button 
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: 'var(--primary-blue)',
            color: 'white',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>إضافة موظف</span>
        </Button>
      </div>

      {/* Employees Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--neutral-200)',
        overflow: 'hidden'
      }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
              <tr style={{ height: 'var(--table-row-height)' }}>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  رقم الموظف
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  الاسم الكامل
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  القسم
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  المسمى الوظيفي
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  تاريخ التوظيف
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  الحالة
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--neutral-200)' }}>
              {filteredEmployees.map((employee, index) => (
                <tr 
                  key={employee.id} 
                  style={{
                    height: 'var(--table-row-height)',
                    backgroundColor: index % 2 === 0 ? 'white' : 'var(--neutral-50)',
                    borderBottom: '1px solid var(--neutral-200)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-100)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : 'var(--neutral-50)'}
                >
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '500', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {employee.employee_no}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {employee.full_name}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {employee.department}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {employee.job_title}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {employee.hire_date}
                  </td>
                  <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      borderRadius: '9999px'
                    }} className={getStatusColor(employee.status)}>
                      {employee.status}
                    </span>
                  </td>
                  <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)' }}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="عرض التفاصيل"
                        style={{ padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Eye style={{ width: '16px', height: '16px', color: 'var(--neutral-600)' }} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="تحرير"
                        style={{ padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Edit style={{ width: '16px', height: '16px', color: 'var(--neutral-600)' }} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="حذف"
                        style={{ padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Trash2 style={{ width: '16px', height: '16px', color: 'var(--error-red)' }} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => loadEmployees()}
      />
    </div>
  )
}
