// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState, useEffect } from 'react'
import { Button } from '../src/components/ui/Button'
import { Plus, Download, Edit, Trash2, Eye } from 'lucide-react'
import { AddLeaveModal } from '../src/features/leaves/AddLeaveModal'

interface Leave {
  id: number
  employee_name: string
  employee_no: string
  leave_type: string
  from_date: string
  to_date: string
  duration_days: number
  status: 'معتمدة' | 'قيد المراجعة' | 'مرفوضة'
  notes: string
}

export function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const loadLeaves = async () => {
    setLoading(true)
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('leaves')
        setLeaves(data)
      }
    } catch (error) {
      console.error('Failed to load leaves:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sample data matching Figma design
  useEffect(() => {
    if (leaves.length === 0 && !loading) {
      const figmaDesignLeaves: Leave[] = [
        {
          id: 1,
          employee_name: 'أحمد محمد علي',
          employee_no: 'EMP001',
          leave_type: 'إجازة سنوية',
          from_date: '2024-07-01',
          to_date: '2024-07-15',
          duration_days: 15,
          status: 'معتمدة',
          notes: 'إجازة سفر للعائلة'
        },
        {
          id: 2,
          employee_name: 'فاطمة عبد الله',
          employee_no: 'EMP002',
          leave_type: 'إجازة مرضية',
          from_date: '2024-05-10',
          to_date: '2024-05-12',
          duration_days: 3,
          status: 'معتمدة',
          notes: 'راحة طبية'
        },
        {
          id: 3,
          employee_name: 'خالد عبد الرحمن',
          employee_no: 'EMP003',
          leave_type: 'إجازة طارئة',
          from_date: '2024-06-15',
          to_date: '2024-06-17',
          duration_days: 3,
          status: 'قيد المراجعة',
          notes: 'ظروف عائلية طارئة'
        }
      ]
    
      setTimeout(() => {
        setLeaves(figmaDesignLeaves)
        setLoading(false)
      }, 500)
    }
  }, [loading])

  useEffect(() => {
    loadLeaves()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'معتمدة': return 'bg-green-100 text-green-800'
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800'
      case 'مرفوضة': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'إجازة سنوية': return 'bg-blue-100 text-blue-800'
      case 'إجازة مرضية': return 'bg-red-100 text-red-800'
      case 'إجازة طارئة': return 'bg-orange-100 text-orange-800'
      case 'إجازة أمومة': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['اسم الموظف', 'رقم الموظف', 'نوع الإجازة', 'من تاريخ', 'إلى تاريخ', 'عدد الأيام', 'الحالة', 'ملاحظات'],
      ...leaves.map(leave => [
        leave.employee_name,
        leave.employee_no,
        leave.leave_type,
        leave.from_date,
        leave.to_date,
        leave.duration_days.toString(),
        leave.status,
        leave.notes
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leaves-${new Date().toISOString().split('T')[0]}.csv`
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
          إدارة الإجازات
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
        إدارة الإجازات
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
          <span>إضافة إجازة</span>
        </Button>
      </div>

      {/* Leaves Table */}
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
                  نوع الإجازة
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  من تاريخ
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  إلى تاريخ
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  عدد الأيام
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
              {leaves.map((leave, index) => (
                <tr 
                  key={leave.id} 
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
                      <div>{leave.employee_name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                        {leave.employee_no}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      borderRadius: '9999px'
                    }} className={getTypeColor(leave.leave_type)}>
                      {leave.leave_type}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {leave.from_date}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {leave.to_date}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '600',
                    color: 'var(--primary-blue)' 
                  }}>
                    {leave.duration_days} يوم
                  </td>
                  <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      borderRadius: '9999px'
                    }} className={getStatusColor(leave.status)}>
                      {leave.status}
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

      {/* Add Leave Modal */}
      <AddLeaveModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => loadLeaves()}
      />
    </div>
  )
}
