import React, { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/Modal'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react'
import { FormulaInspector, EnhancedPreviewEmployee } from './FormulaInspector'

interface ExcelImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface PreviewData {
  preview: EnhancedPreviewEmployee[]
  summary: {
    totalRows: number
    validRows: number
    headerRow: number
    scaleFound: boolean
  }
  errors: string[]
}

interface ImportResult {
  summary: {
    totalRows: number
    added: number
    updated: number
    errors: number
    skipped: number
  }
  employees: Array<{
    employee_no: string
    full_name: string
    status: 'added' | 'updated' | 'error' | 'skipped'
    error?: string
    row_number: number
  }>
  errors: string[]
  salaryScaleFound: boolean
  errorReport?: string
}

type Step = 'upload' | 'preview' | 'import' | 'result'

export default function ExcelImportModal({ open, onClose, onSuccess }: ExcelImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [loading, setLoading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [importMonth, setImportMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EnhancedPreviewEmployee | null>(null)

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setFilePath(file.name)

    // Automatically preview
    await handlePreview(file)
  }

  const handlePreview = async (fileToPreview?: File) => {
    const file = fileToPreview || selectedFile

    if (!file) {
      setError('يرجى اختيار ملف Excel أولاً')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await window.api.excelPreview(file)

      if (!result.success) {
        throw new Error(result.error || 'فشل في معاينة الملف')
      }

      setPreviewData(result.data)
      setStep('preview')
    } catch (err: any) {
      console.error('Preview failed:', err)
      setError(err.message || 'خطأ في معاينة الملف')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!filePath || !importMonth) {
      setError('يرجى التأكد من اختيار الملف والشهر')
      return
    }

    setLoading(true)
    setError(null)
    setStep('import')

    try {
      if (!selectedFile) throw new Error("No file selected")
      const result = await window.api.excelImport(selectedFile, {
        month: importMonth,
        overwriteExisting: true
      })

      if (!result.success) {
        throw new Error(result.error || 'فشل في استيراد الملف')
      }

      setImportResult(result.data)
      setStep('result')

      if (onSuccess && result.data.summary.added + result.data.summary.updated > 0) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Import failed:', err)
      setError(err.message || 'خطأ في استيراد الملف')
      setStep('preview') // Go back to preview on error
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadErrors = () => {
    if (!importResult?.errorReport) return

    const blob = new Blob([importResult.errorReport], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `import-errors-${importMonth}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportPreviewCSV = async () => {
    if (!filePath) {
      setError('الرجاء اختيار الملف أولاً')
      return
    }

    setExportingCSV(true)
    setError(null)

    try {
      const result = await window.api.exportExcelPreviewCSV(filePath)

      if (!result.success) {
        throw new Error(result.error || 'فشل في تصدير ملف المعاينة')
      }

      // Show success message
      const fileName = result.path?.split(/[/\\]/).pop() || 'employees_preview.csv'
      alert(`تم حفظ ملف المعاينة في سطح المكتب: ${fileName}`)

    } catch (err: any) {
      console.error('Export CSV failed:', err)
      setError(err.message || 'خطأ في تصدير ملف المعاينة')
    } finally {
      setExportingCSV(false)
    }
  }

  const handleClose = () => {
    setStep('upload')
    setFilePath(null)
    setPreviewData(null)
    setImportResult(null)
    setError(null)
    setSelectedEmployee(null)
    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG').format(amount)
  }

  const getStepTitle = () => {
    switch (step) {
      case 'upload': return 'اختيار ملف Excel'
      case 'preview': return 'معاينة البيانات'
      case 'import': return 'جاري الاستيراد...'
      case 'result': return 'نتائج الاستيراد'
      default: return ''
    }
  }

  return (
    <Modal open={open} onClose={handleClose} className="max-w-7xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">{getStepTitle()}</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <XCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-medium">نموذج سلسلة الرتب والرواتب</span>
              </div>
              <p className="text-sm text-blue-700">
                يقوم هذا المستورد بقراءة ملف Excel الأصلي مع الحفاظ على التنسيق العربي والأرقام بالأصفار البادئة
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر ملف Excel
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx,.xls,.xlsm"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  اختر ملف نموذج الرواتب
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  يدعم ملفات .xlsx, .xlsm, .xls
                </p>
                <Button onClick={handleChooseFile} disabled={loading} loading={loading}>
                  <Upload className="w-4 h-4 mr-2" />
                  اختيار ملف Excel
                </Button>
              </div>
              {filePath && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800">الملف المختار:</p>
                  <p className="text-xs text-green-700 truncate mt-1" title={filePath}>
                    {filePath.split(/[/\\]/).pop()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">المسار: {filePath}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شهر الاستيراد
              </label>
              <Input
                type="month"
                value={importMonth}
                onChange={(e) => setImportMonth(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <div className="flex gap-3 pt-4">
              {!filePath && (
                <p className="text-sm text-gray-500 flex-1 text-center py-2">
                  اختر ملف Excel لرؤية المعاينة
                </p>
              )}
              <Button variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && previewData && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">قراءة من النموذج الأصلي</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-green-700">إجمالي الصفوف:</span>
                  <span className="font-medium mr-1">{previewData.summary.totalRows}</span>
                </div>
                <div>
                  <span className="text-green-700">الصفوف الصالحة:</span>
                  <span className="font-medium mr-1">{previewData.summary.validRows}</span>
                </div>
                <div>
                  <span className="text-green-700">صف العناوين:</span>
                  <span className="font-medium mr-1">{previewData.summary.headerRow}</span>
                </div>
                <div>
                  <span className="text-green-700">سلم الرواتب:</span>
                  <span className="font-medium mr-1">
                    {previewData.summary.scaleFound ? '✓ موجود' : '✗ غير موجود'}
                  </span>
                </div>
              </div>
            </div>

            {previewData.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">تحذيرات</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {previewData.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left side - Preview table */}
              <div className="lg:col-span-2">
                <h3 className="font-medium mb-3">معاينة أول 10 موظفين</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                          رقم الموظف
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                          الاسم
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                          الراتب الأساسي
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                          البدلات
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                          الإجمالي
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 border-b">
                          الصافي
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.preview.map((emp, index) => (
                        <tr
                          key={index}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedEmployee?.employee_no === emp.employee_no ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          onClick={() => setSelectedEmployee(emp)}
                        >
                          <td className="px-3 py-2 text-sm font-mono">
                            {emp.employee_no}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {emp.full_name}
                          </td>
                          <td className="px-3 py-2 text-sm text-left">
                            {formatCurrency(emp.computedUSD.base_salary)}
                          </td>
                          <td className="px-3 py-2 text-sm text-left">
                            {formatCurrency(emp.computedUSD.total_allowances)}
                          </td>
                          <td className="px-3 py-2 text-sm text-left font-medium">
                            {formatCurrency(emp.computedUSD.gross_salary)}
                          </td>
                          <td className="px-3 py-2 text-sm text-left font-medium text-green-600">
                            {formatCurrency(emp.computedUSD.net_salary)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right side - Formula Inspector */}
              <div className="lg:col-span-1">
                <FormulaInspector selectedEmployee={selectedEmployee} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleImport}
                disabled={loading || !filePath}
                loading={loading}
                className="flex-1"
              >
                بدء الاستيراد لشهر {importMonth}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPreviewCSV}
                disabled={exportingCSV || !filePath}
                loading={exportingCSV}
                className="flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                تصدير معاينة كملف CSV
              </Button>
              <Button variant="outline" onClick={() => setStep('upload')}>
                رجوع
              </Button>
              <Button variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'import' && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-medium">جاري استيراد البيانات...</p>
            <p className="text-sm text-gray-600 mt-2">يرجى الانتظار حتى اكتمال العملية</p>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && importResult && (
          <div className="space-y-4">
            <div className={`border rounded-md p-4 ${importResult.summary.errors > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
              }`}>
              <div className={`flex items-center gap-2 mb-3 ${importResult.summary.errors > 0 ? 'text-yellow-800' : 'text-green-800'
                }`}>
                {importResult.summary.errors > 0 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span className="font-medium">نتائج الاستيراد</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">الإجمالي:</span>
                  <span className="font-medium mr-1">{importResult.summary.totalRows}</span>
                </div>
                <div>
                  <span className="text-green-600">تم إضافة:</span>
                  <span className="font-medium mr-1">{importResult.summary.added}</span>
                </div>
                <div>
                  <span className="text-blue-600">تم تحديث:</span>
                  <span className="font-medium mr-1">{importResult.summary.updated}</span>
                </div>
                <div>
                  <span className="text-red-600">أخطاء:</span>
                  <span className="font-medium mr-1">{importResult.summary.errors}</span>
                </div>
                <div>
                  <span className="text-gray-600">تم التخطي:</span>
                  <span className="font-medium mr-1">{importResult.summary.skipped}</span>
                </div>
              </div>
            </div>

            {importResult.summary.errors > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">الصفوف التي تحتوي على أخطاء</span>
                  </div>
                  {importResult.errorReport && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadErrors}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      تحميل تقرير الأخطاء
                    </Button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {importResult.employees
                    .filter(emp => emp.status === 'error' || emp.status === 'skipped')
                    .slice(0, 10)
                    .map((emp, index) => (
                      <div key={index} className="text-sm text-red-700 py-1">
                        صف {emp.row_number}: {emp.employee_no} - {emp.full_name} ({emp.error})
                      </div>
                    ))}
                  {importResult.employees.filter(emp => emp.status === 'error' || emp.status === 'skipped').length > 10 && (
                    <div className="text-sm text-red-600 pt-2 border-t border-red-200">
                      ... و {importResult.employees.filter(emp => emp.status === 'error' || emp.status === 'skipped').length - 10} أخطاء أخرى
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleClose} className="flex-1">
                إغلاق
              </Button>
              <Button variant="outline" onClick={() => setStep('upload')}>
                استيراد ملف آخر
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
