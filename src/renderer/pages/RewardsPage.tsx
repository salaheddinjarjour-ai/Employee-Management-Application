// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState, useEffect } from 'react'
import { Button } from '../src/components/ui/Button'
import { Plus, Download, Edit, Trash2, Eye } from 'lucide-react'
import { AddRewardModal } from '../src/features/rewards/AddRewardModal'

interface Reward {
  id: number
  employee_name: string
  employee_no: string
  reward_type: string
  amount: number
  reward_date: string
  reason: string
  status: 'معتمدة' | 'قيد المراجعة' | 'مرفوضة'
  reference: string
}

export function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const loadRewards = async () => {
    setLoading(true)
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('rewards')
        setRewards(data)
      }
    } catch (error) {
      console.error('Failed to load rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sample data matching Figma design
  useEffect(() => {
    if (rewards.length === 0 && !loading) {
      const figmaDesignRewards: Reward[] = [
        {
          id: 1,
          employee_name: 'أحمد محمد علي',
          employee_no: 'EMP001',
          reward_type: 'مكافأة أداء',
          amount: 5000,
          reward_date: '2024-01-15',
          reason: 'تميز في الأداء والإنجاز',
          status: 'معتمدة',
          reference: 'قرار رقم 2024/001'
        },
        {
          id: 2,
          employee_name: 'فاطمة عبد الله',
          employee_no: 'EMP002',
          reward_type: 'مكافأة مشروع',
          amount: 3000,
          reward_date: '2024-02-10',
          reason: 'إنجاز مشروع بنجاح',
          status: 'معتمدة',
          reference: 'قرار رقم 2024/002'
        },
        {
          id: 3,
          employee_name: 'خالد عبد الرحمن',
          employee_no: 'EMP003',
          reward_type: 'مكافأة تقدير',
          amount: 2000,
          reward_date: '2024-03-05',
          reason: 'خدمة متميزة للعملاء',
          status: 'قيد المراجعة',
          reference: 'قرار رقم 2024/003'
        }
      ]
    
      setTimeout(() => {
        setRewards(figmaDesignRewards)
        setLoading(false)
      }, 500)
    }
  }, [loading])

  useEffect(() => {
    loadRewards()
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
      case 'مكافأة أداء': return 'bg-blue-100 text-blue-800'
      case 'مكافأة مشروع': return 'bg-green-100 text-green-800'
      case 'مكافأة تقدير': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['اسم الموظف', 'رقم الموظف', 'نوع المكافأة', 'المبلغ', 'تاريخ المكافأة', 'السبب', 'الحالة', 'المرجع'],
      ...rewards.map(reward => [
        reward.employee_name,
        reward.employee_no,
        reward.reward_type,
        reward.amount.toString(),
        reward.reward_date,
        reward.reason,
        reward.status,
        reward.reference
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rewards-${new Date().toISOString().split('T')[0]}.csv`
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
          المكافآت والحوافز
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
        المكافآت والحوافز
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
          <span>إضافة مكافأة</span>
        </Button>
      </div>

      {/* Rewards Table */}
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
                  نوع المكافأة
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  المبلغ
                </th>
                <th style={{ 
                  padding: '0 var(--spacing-lg)', 
                  textAlign: 'right', 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'bold', 
                  color: 'var(--neutral-900)' 
                }}>
                  تاريخ المكافأة
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
              {rewards.map((reward, index) => (
                <tr 
                  key={reward.id} 
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
                      <div>{reward.employee_name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                        {reward.employee_no}
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
                    }} className={getTypeColor(reward.reward_type)}>
                      {reward.reward_type}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: '600',
                    color: 'var(--success-green)' 
                  }}>
                    {reward.amount.toLocaleString()} ريال
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {reward.reward_date}
                  </td>
                  <td style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    color: 'var(--neutral-900)' 
                  }}>
                    {reward.reason}
                  </td>
                  <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      borderRadius: '9999px'
                    }} className={getStatusColor(reward.status)}>
                      {reward.status}
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

      {/* Add Reward Modal */}
      <AddRewardModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => loadRewards()}
      />
    </div>
  )
}
