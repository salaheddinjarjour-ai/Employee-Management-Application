// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState, useEffect } from 'react'
import { Button } from '../src/components/ui/Button'
import { Plus, Download, Edit, Trash2, Eye } from 'lucide-react'
import { AddPromotionModal } from '../src/features/promotions/AddPromotionModal'

interface Promotion {
  id: number
  employee_name: string
  employee_no: string
  promo_type: string
  from_position: string
  to_position: string
  from_salary: number
  to_salary: number
  promo_date: string
  status: 'معتمدة' | 'قيد المراجعة' | 'مرفوضة'
  reference: string
  notes: string
}

export function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const loadPromotions = async () => {
    setLoading(true)
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('promotions')
        setPromotions(data)
      }
    } catch (error) {
      console.error('Failed to load promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sample data matching Figma design
  useEffect(() => {
    if (promotions.length === 0 && !loading) {
      const figmaDesignPromotions: Promotion[] = [
        {
          id: 1,
          employee_name: 'أحمد محمد علي',
          employee_no: 'EMP001',
          promo_type: 'ترقية منصب',
          from_position: 'مطور',
          to_position: 'مطور أول',
          from_salary: 12000,
          to_salary: 15000,
          promo_date: '2024-01-01',
          status: 'معتمدة',
          reference: 'قرار رقم 2024/001',
          notes: 'أداء متميز وسنوات خبرة'
        },
        {
          id: 2,
          employee_name: 'فاطمة عبد الله',
          employee_no: 'EMP002',
          promo_type: 'زيادة راتب',
          from_position: 'محاسبة',
          to_position: 'محاسبة',
          from_salary: 10000,
          to_salary: 12000,
          promo_date: '2024-02-01',
          status: 'قيد المراجعة',
          reference: 'قرار رقم 2024/002',
          notes: 'تقييم أداء ممتاز'
        },
        {
          id: 3,
          employee_name: 'خالد عبد الرحمن',
          employee_no: 'EMP003',
          promo_type: 'ترقية درجة',
          from_position: 'مدير مشروع',
          to_position: 'مدير مشروع أول',
          from_salary: 18000,
          to_salary: 22000,
          promo_date: '2024-03-01',
          status: 'معتمدة',
          reference: 'قرار رقم 2024/003',
          notes: 'قيادة متميزة وإنجازات استثنائية'
        }
      ]
    
      setTimeout(() => {
        setPromotions(figmaDesignPromotions)
        setLoading(false)
      }, 500)
    }
  }, [loading])

  useEffect(() => {
    loadPromotions()
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
      case 'ترقية منصب': return 'bg-blue-100 text-blue-800'
      case 'ترقية درجة': return 'bg-green-100 text-green-800'
      case 'زيادة راتب': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['اسم الموظف', 'رقم الموظف', 'نوع الترقية', 'من منصب', 'إلى منصب', 'من راتب', 'إلى راتب', 'تاريخ الترقية', 'الحالة', 'المرجع', 'ملاحظات'],
      ...promotions.map(promotion => [
        promotion.employee_name,
        promotion.employee_no,
        promotion.promo_type,
        promotion.from_position,
        promotion.to_position,
        promotion.from_salary.toString(),
        promotion.to_salary.toString(),
        promotion.promo_date,
        promotion.status,
        promotion.reference,
        promotion.notes
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `promotions-${new Date().toISOString().split('T')[0]}.csv`
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
          الترقيات والمكافآت
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
        الترقيات والمكافآت
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
          <span>إضافة ترقية</span>
        </Button>
      </div>

      {/* Promotions Table */}
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
                  نوع الترقية
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  من منصب
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  إلى منصب
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  تغيير الراتب
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  تاريخ الترقية
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
              {promotions.map((promotion, index) => (
                <tr 
                  key={promotion.id} 
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
                      <div>{promotion.employee_name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                        {promotion.employee_no}
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
                    }} className={getTypeColor(promotion.promo_type)}>
                      {promotion.promo_type}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {promotion.from_position}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {promotion.to_position}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    <div>
                      <div style={{ color: 'var(--neutral-500)' }}>من: {promotion.from_salary.toLocaleString()}</div>
                      <div style={{ color: 'var(--success-green)', fontWeight: '600' }}>
                        إلى: {promotion.to_salary.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {promotion.promo_date}
                  </td>
                  <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      borderRadius: '9999px'
                    }} className={getStatusColor(promotion.status)}>
                      {promotion.status}
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

      {/* Add Promotion Modal */}
      <AddPromotionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => loadPromotions()}
      />
    </div>
  )
}
