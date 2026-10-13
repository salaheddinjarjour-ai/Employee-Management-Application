// Layout locked to Figma v2.1 (2024-09-25). Do not alter without design approval.

import React, { useState, useEffect } from 'react'
import { Button } from '../src/components/ui/Button'
import { Plus, Download, Edit, Trash2, Eye } from 'lucide-react'
import dayjs from 'dayjs'
import { CreatePayslipDrawer } from '../src/features/payroll/CreatePayslipDrawer'

interface PayrollRecord {
  id: number
  employee_id: number
  employee_name?: string
  employee_no?: string
  month: string
  basic_salary_usd: number
  allowances_usd: number
  overtime_usd: number
  deductions_usd: number
  net_salary_usd: number
  basic_salary_try: number
  allowances_try: number
  overtime_try: number
  deductions_try: number
  net_salary_try: number
  rate_used: number
  status: 'مسودّة' | 'قيد المراجعة' | 'معالج' | 'ملغي'
  created_at: string
  updated_at?: string
}

export function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  
  // State for Create Payslip drawer
  const [open, setOpen] = useState(false)
  const [createdId, setCreatedId] = useState<number | null>(null)

  const loadPayroll = async () => {
    setLoading(true)
    try {
      if (window.api?.payroll?.listByMonth) {
        const data = await window.api.payroll.listByMonth(selectedMonth)
        setPayroll(data)
      }
    } catch (error) {
      console.error('Failed to load payroll:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableMonths = async () => {
    try {
      if (window.api?.payroll?.getAvailableMonths) {
        const months = await window.api.payroll.getAvailableMonths()
        setAvailableMonths(months)
      }
    } catch (error) {
      console.error('Failed to load available months:', error)
    }
  }

  const refetchList = () => {
    loadPayroll()
    loadAvailableMonths()
  }

  // Safe async wrapper
  async function safeRun(fn: () => Promise<void>) {
    if (createLoading) return
    setCreateLoading(true)
    try {
      await fn()
    } catch (err) {
      console.error(err)
      // Using alert for now since toast is not available in this component
      alert('حدث خطأ غير متوقع')
    } finally {
      setCreateLoading(false)
    }
  }

  useEffect(() => {
    loadPayroll()
  }, [selectedMonth])

  useEffect(() => {
    loadAvailableMonths()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'معالج': return 'bg-green-100 text-green-800'
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800'
      case 'مسودّة': return 'bg-gray-100 text-gray-800'
      case 'ملغي': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      const result = await window.api.exportPayroll(selectedMonth)
      
      if (result.success && result.filePath) {
        toast.success(`تم تصدير البيانات بنجاح إلى: ${result.filePath}`)
      } else {
        toast.error(result.error || 'فشل في تصدير البيانات')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('حدث خطأ أثناء تصدير البيانات')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreatePayroll = () => {
    setOpen(true)
  }

  const handleViewPayroll = (record: PayrollRecord) => {
    console.log('Viewing payroll record:', record)
    // TODO: Implement view payroll functionality
    alert(`عرض تفاصيل كشف راتب ${record.employee_name}`)
  }

  const handleEditPayroll = (record: PayrollRecord) => {
    console.log('Editing payroll record:', record)
    // TODO: Implement edit payroll functionality
    alert(`تحرير كشف راتب ${record.employee_name}`)
  }

  const handleDeletePayroll = async (record: PayrollRecord) => {
    if (confirm(`هل أنت متأكد من حذف كشف راتب ${record.employee_name}؟`)) {
      try {
        if (window.api?.payroll?.delete) {
          await window.api.payroll.delete(record.id)
          await loadPayroll()
          alert('تم حذف كشف الراتب بنجاح')
        }
      } catch (error) {
        console.error('Delete failed:', error)
        alert('فشل في حذف كشف الراتب')
      }
    }
  }

  const handleStatusUpdate = async (record: PayrollRecord, newStatus: string) => {
    try {
      if (window.api?.payroll?.updateStatus) {
        await window.api.payroll.updateStatus(record.id, newStatus)
        await loadPayroll()
        alert('تم تحديث حالة كشف الراتب بنجاح')
      }
    } catch (error) {
      console.error('Status update failed:', error)
      alert('فشل في تحديث حالة كشف الراتب')
    }
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
          كشوف الرواتب
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
        كشوف الرواتب
      </h1>

      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              border: '1px solid var(--neutral-300)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--neutral-700)',
              backgroundColor: 'white'
            }}
          >
            <option value={dayjs().format('YYYY-MM')}>الشهر الحالي</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {dayjs(month).format('MMMM YYYY')}
              </option>
            ))}
          </select>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={payroll.length === 0 || isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            <span>{isExporting ? 'جاري التصدير...' : 'تصدير'}</span>
          </Button>
        </div>
        
        <Button 
          onClick={handleCreatePayroll}
          disabled={createLoading}
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
          <span>{createLoading ? 'جارٍ التحميل…' : 'إنشاء كشف راتب'}</span>
        </Button>
      </div>

      {/* Payroll Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--neutral-200)',
        overflow: 'hidden'
      }}>
        {payroll.length === 0 ? (
          <div style={{ 
            padding: 'var(--spacing-xl)', 
            textAlign: 'center',
            color: 'var(--neutral-500)'
          }}>
            لا توجد كشوف رواتب للشهر المحدد
          </div>
        ) : (
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
                    الشهر
                  </th>
                  <th style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: 'bold', 
                    color: 'var(--neutral-900)' 
                  }}>
                    الراتب الأساسي (TRY)
                  </th>
                  <th style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: 'bold', 
                    color: 'var(--neutral-900)' 
                  }}>
                    البدلات (TRY)
                  </th>
                  <th style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: 'bold', 
                    color: 'var(--neutral-900)' 
                  }}>
                    الاستقطاعات (TRY)
                  </th>
                  <th style={{ 
                    padding: '0 var(--spacing-lg)', 
                    textAlign: 'right', 
                    fontSize: 'var(--font-size-sm)', 
                    fontWeight: 'bold', 
                    color: 'var(--neutral-900)' 
                  }}>
                    صافي الراتب (TRY)
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
                {payroll.map((record, index) => (
                  <tr 
                    key={record.id} 
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
                        <div>{record.employee_name || `موظف ${record.employee_id}`}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                          {record.employee_no || `ID: ${record.employee_id}`}
                        </div>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '0 var(--spacing-lg)', 
                      textAlign: 'right', 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--neutral-900)' 
                    }}>
                      {dayjs(record.month).format('YYYY-MM')}
                    </td>
                    <td style={{ 
                      padding: '0 var(--spacing-lg)', 
                      textAlign: 'right', 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--neutral-900)' 
                    }}>
                      {record.basic_salary_try.toLocaleString()} ₺
                    </td>
                    <td style={{ 
                      padding: '0 var(--spacing-lg)', 
                      textAlign: 'right', 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--success-green)' 
                    }}>
                      +{record.allowances_try.toLocaleString()} ₺
                    </td>
                    <td style={{ 
                      padding: '0 var(--spacing-lg)', 
                      textAlign: 'right', 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--error-red)' 
                    }}>
                      -{record.deductions_try.toLocaleString()} ₺
                    </td>
                    <td style={{ 
                      padding: '0 var(--spacing-lg)', 
                      textAlign: 'right', 
                      fontSize: 'var(--font-size-sm)', 
                      fontWeight: 'bold',
                      color: 'var(--primary-blue)' 
                    }}>
                      {record.net_salary_try.toLocaleString()} ₺
                    </td>
                    <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                      <select
                        value={record.status}
                        onChange={(e) => handleStatusUpdate(record, e.target.value)}
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '600',
                          borderRadius: '9999px',
                          border: '1px solid var(--neutral-300)',
                          padding: 'var(--spacing-xs) var(--spacing-sm)'
                        }}
                        className={getStatusColor(record.status)}
                      >
                        <option value="مسودّة">مسودّة</option>
                        <option value="قيد المراجعة">قيد المراجعة</option>
                        <option value="معالج">معالج</option>
                        <option value="ملغي">ملغي</option>
                      </select>
                    </td>
                    <td style={{ padding: '0 var(--spacing-lg)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)' }}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="عرض التفاصيل"
                          onClick={() => handleViewPayroll(record)}
                          style={{ padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)' }}
                        >
                          <Eye style={{ width: '16px', height: '16px', color: 'var(--neutral-600)' }} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="تحرير"
                          onClick={() => handleEditPayroll(record)}
                          style={{ padding: 'var(--spacing-xs)', borderRadius: 'var(--radius-sm)' }}
                        >
                          <Edit style={{ width: '16px', height: '16px', color: 'var(--neutral-600)' }} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="حذف"
                          onClick={() => handleDeletePayroll(record)}
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
        )}
      </div>

      {/* Create Payslip Drawer */}
      <CreatePayslipDrawer
        open={open}
        month={selectedMonth}
        onClose={() => setOpen(false)}
        onSaved={(id) => {
          setOpen(false)
          setCreatedId(id)
          refetchList()
          // Show success message
          alert('تم إنشاء كشف الراتب بنجاح')
        }}
      />
    </div>
  )
}
