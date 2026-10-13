// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState, useEffect } from 'react'
import { Button } from '../src/components/ui/Button'
import { Plus, Download, Edit, Trash2, Eye } from 'lucide-react'
import { AddAbsenceModal } from '../src/features/absences/AddAbsenceModal'

interface Absence {
  id: number
  employee_name: string
  employee_no: string
  absence_date: string
  absence_type: string
  hours: number
  reason: string
  status: 'معتمد' | 'قيد المراجعة' | 'مرفوض'
  approved_by: string
}

export function AbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const loadAbsences = async () => {
    setLoading(true)
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('absences')
        setAbsences(data)
      }
    } catch (error) {
      console.error('Failed to load absences:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sample data matching Figma design
  useEffect(() => {
    if (absences.length === 0 && !loading) {
      const figmaDesignAbsences: Absence[] = [
        {
          id: 1,
          employee_name: 'أحمد محمد علي',
          employee_no: 'EMP001',
          absence_date: '2024-09-15',
          absence_type: 'غياب بعذر',
          hours: 8,
          reason: 'ظروف طارئة',
          status: 'معتمد',
          approved_by: 'مدير الموارد البشرية'
        },
        {
          id: 2,
          employee_name: 'فاطمة عبد الله',
          employee_no: 'EMP002',
          absence_date: '2024-08-22',
          absence_type: 'تأخير',
          hours: 2,
          reason: 'زحمة مرورية',
          status: 'معتمد',
          approved_by: 'مدير المالية'
        },
        {
          id: 3,
          employee_name: 'خالد عبد الرحمن',
          employee_no: 'EMP003',
          absence_date: '2024-07-10',
          absence_type: 'انصراف مبكر',
          hours: 4,
          reason: 'موعد طبي',
          status: 'قيد المراجعة',
          approved_by: ''
        }
      ]
    
      setTimeout(() => {
        setAbsences(figmaDesignAbsences)
        setLoading(false)
      }, 500)
    }
  }, [loading])

  useEffect(() => {
    loadAbsences()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'معتمد': return 'bg-green-100 text-green-800'
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800'
      case 'مرفوض': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'غياب بعذر': return 'bg-blue-100 text-blue-800'
      case 'تأخير': return 'bg-orange-100 text-orange-800'
      case 'انصراف مبكر': return 'bg-purple-100 text-purple-800'
      case 'غياب بدون عذر': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['اسم الموظف', 'رقم الموظف', 'تاريخ الغياب', 'نوع الغياب', 'عدد الساعات', 'السبب', 'الحالة', 'معتمد من'],
      ...absences.map(absence => [
        absence.employee_name,
        absence.employee_no,
        absence.absence_date,
        absence.absence_type,
        absence.hours.toString(),
        absence.reason,
        absence.status,
        absence.approved_by
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `absences-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

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
          إدارة الغياب والحضور
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
        إدارة الغياب والحضور
      </h1>

      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
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
          <span>إضافة غياب</span>
        </Button>
      </div>

      {/* Absences Table */}
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
                  اسم الموظف
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  تاريخ الغياب
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  نوع الغياب
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  عدد الساعات
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  السبب
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
              {absences.map((absence, index) => (
                <tr 
                  key={absence.id} 
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
                    <div>
                      <div>{absence.employee_name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                        {absence.employee_no}
                      </div>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {absence.absence_date}
                  </td>
                  <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      borderRadius: '9999px'
                    }} className={getTypeColor(absence.absence_type)}>
                      {absence.absence_type}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '600',
                    color: 'var(--warning-amber)' 
                  }}>
                    {absence.hours} ساعة
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {absence.reason}
                  </td>
                  <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      borderRadius: '9999px'
                    }} className={getStatusColor(absence.status)}>
                      {absence.status}
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

      {/* Add Absence Modal */}
      <AddAbsenceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => loadAbsences()}
      />
    </div>
  )
}
