import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { UnifiedEmployeeForm } from '../forms/UnifiedEmployeeForm'
import { EmployeeAttachmentsList } from '../attachments/EmployeeAttachmentsList'
import ExcelImportModal from '../../features/import/ExcelImportModal'
import { EmployeeDetails } from '../EmployeeDetails'
import ActionsBar from '../table/ActionsBar'
import Confirm from '../ui/Confirm'
import EmployeeDrawer from '../../features/employees/EmployeeDrawer'
import { Plus, Edit, Upload, Eye, FileSpreadsheet, Download, Paperclip, Search } from 'lucide-react'

interface Employee {
  id: number
  employee_no: string
  full_name: string
  email: string
  status: string
  hire_date?: string
  salary_grade_id?: number
  attachments_count?: number
  roles?: {
    role_type: string
    entity_name: string
    job_title?: string
    is_primary: boolean
  }[]
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployeeForAttachments, setSelectedEmployeeForAttachments] = useState<Employee | null>(null)
  const [showExcelImport, setShowExcelImport] = useState(false)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false)
  const [detailsEmployee, setDetailsEmployee] = useState<Employee | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [profileEmployeeId, setProfileEmployeeId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load employees from database
  useEffect(() => {
    loadEmployees()
  }, [])

  // Listen for refresh events
  useEffect(() => {
    const handler = () => {
      console.log('[EmployeesPage] Refresh event received, reloading employees')
      loadEmployees()
    }

    if (window.events?.on) {
      const unsubscribe = window.events.on('employees:refresh', handler)
      return unsubscribe
    }

    window.addEventListener('employees:refresh', handler)
    return () => window.removeEventListener('employees:refresh', handler)
  }, [])

  const handleExcelImport = async (employeeData: any[]) => {
    if (!window.electronAPI) {
      return false
    }

    try {
      const result = await window.electronAPI.db.excel.import(employeeData)
      if (result.success) {
        loadEmployees()
        return true
      }
      return false
    } catch (error) {
      console.error('Excel import error:', error)
      return false
    }
  }

  const handleExportEmployees = async () => {
    try {
      // Use the new export handler natively via electronAPI
      const result = await window.electronAPI.exportEmployees({})

      if (result.success) {
        const message = `تم تصدير ${result.count} موظف بنجاح إلى: ${result.filePath}`
        if (window.toast?.success) {
          window.toast.success(message)
        } else {
          alert(message)
        }
      } else if (result.canceled) {
        // User canceled the save dialog
        return
      } else {
        const errorMessage = result.error || 'حدث خطأ أثناء تصدير الموظفين'
        if (window.toast?.error) {
          window.toast.error(errorMessage)
        } else {
          alert(errorMessage)
        }
      }
    } catch (error: any) {
      console.error('Export error:', error)
      const errorMessage = 'حدث خطأ أثناء تصدير الموظفين'
      if (window.toast?.error) {
        window.toast.error(errorMessage)
      } else {
        alert(errorMessage + ': ' + error.message)
      }
    }
  }

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setShowEmployeeForm(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowEmployeeForm(true)
  }

  const handleFormSuccess = () => {
    setShowEmployeeForm(false)
    loadEmployees()
  }

  const handleViewDetails = (employee: Employee) => {
    setDetailsEmployee(employee)
    setShowEmployeeDetails(true)
  }

  const handleEditFromDetails = (employee: Employee) => {
    setShowEmployeeDetails(false)
    setEditingEmployee(employee)
    setShowEmployeeForm(true)
  }

  const loadEmployees = async () => {
    setLoading(true)
    try {
      if (window.api?.listRecords) {
        const data = await window.api.listRecords('employees')
        setEmployees(data)
      } else if (window.electronAPI) {
        const result = await window.electronAPI.db.employees.findAll()
        if (result.success && result.data) {
          setEmployees(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: number) => {
    setConfirmDeleteId(id)
  }

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return

    try {
      if (window.api?.deleteRecord) {
        await window.api.deleteRecord('employees', confirmDeleteId)
        setConfirmDeleteId(null)
        await loadEmployees()
        if (window.toast?.success) {
          window.toast.success('تم حذف الموظف بنجاح')
        }
      }
    } catch (error) {
      console.error('Failed to delete employee:', error)
      if (window.toast?.error) {
        window.toast.error('حدث خطأ أثناء حذف الموظف')
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">الموظفون</h1>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  // Handle instant search filtering
  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()

    // Check primary fields
    if (emp.full_name?.toLowerCase().includes(term)) return true
    if (emp.employee_no?.toLowerCase().includes(term)) return true

    // Check roles array
    if (emp.roles && emp.roles.length > 0) {
      if (emp.roles.some(r => r.entity_name?.toLowerCase().includes(term) || r.job_title?.toLowerCase().includes(term))) {
        return true
      }
    }

    return false
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">الموظفون</h1>

        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم، القسم، الوحدة، المسمى الوظيفي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="flex items-center space-x-reverse space-x-3">
          <Button
            onClick={handleAddEmployee}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  رقم الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  الاسم الكامل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  الأدوار والأقسام
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  المرفقات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  الحالة
                </th>
                <th className="w-[160px] text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {employee.employee_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {employee.full_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    <div className="flex flex-col space-y-2">
                      {employee.roles && employee.roles.length > 0 ? (
                        <>
                          {employee.roles.filter(r => r.is_primary).map((r, i) => (
                            <div key={`primary-${i}`} className="flex items-center space-x-reverse space-x-2">
                              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100 placeholder-hide shrink-0">أساسي</span>
                              <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200 shrink-0">
                                {r.role_type === 'committee' ? 'لجنة' : r.role_type === 'unit' ? 'وحدة' : 'قسم'}
                              </span>
                              {r.job_title && <span className="text-gray-900 font-medium">{r.job_title}</span>}
                              <span className="text-gray-500 text-xs truncate max-w-[120px]" title={r.entity_name}>- {r.entity_name}</span>
                            </div>
                          ))}
                          {employee.roles.filter(r => !r.is_primary).map((r, i) => (
                            <div key={`backup-${i}`} className="flex items-center space-x-reverse space-x-2">
                              <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200 shrink-0">
                                {r.role_type === 'committee' ? 'لجنة' : r.role_type === 'unit' ? 'وحدة' : 'قسم'}
                              </span>
                              {r.job_title && <span className="text-gray-700">{r.job_title}</span>}
                              <span className="text-gray-500 text-xs truncate max-w-[120px]" title={r.entity_name}>- {r.entity_name}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs italic">لا توجد أدوار مسندة</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedEmployeeForAttachments(employee)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Paperclip className="w-4 h-4 ml-1" />
                      عرض
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                      {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="text-center">
                    <ActionsBar
                      onView={() => setProfileEmployeeId(employee.id)}
                      onEdit={() => handleEditEmployee(employee)}
                      onDelete={() => handleDelete(employee.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachments Modal */}
      {selectedEmployeeForAttachments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[70vw] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                ملفات الموظف: {selectedEmployeeForAttachments.full_name}
              </h2>
              <button
                onClick={() => setSelectedEmployeeForAttachments(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <EmployeeAttachmentsList employeeId={selectedEmployeeForAttachments.id} />
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        open={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onSuccess={() => {
          setShowExcelImport(false)
          loadEmployees()
        }}
      />

      {/* Unified Employee Form Modal */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[95vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
            <UnifiedEmployeeForm
              initialData={editingEmployee || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowEmployeeForm(false)}
            />
          </div>
        </div>
      )}

      {/* Employee Details Drawer */}
      {showEmployeeDetails && detailsEmployee && (
        <EmployeeDetails
          employee={detailsEmployee as any}
          onClose={() => setShowEmployeeDetails(false)}
          onEdit={handleEditFromDetails as any}
          mode="drawer"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Confirm
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="تأكيد حذف الموظف"
        message={confirmDeleteId ? `سيتم حذف سجل الموظف نهائياً. هذا الإجراء لا يمكن التراجع عنه.` : ''}
        confirmText="حذف نهائي"
      />

      {/* Employee Profile Drawer */}
      <EmployeeDrawer
        open={profileEmployeeId !== null}
        onClose={() => setProfileEmployeeId(null)}
        employeeId={profileEmployeeId}
      />
    </div>
  )
}
