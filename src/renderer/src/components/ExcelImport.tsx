import React, { useState, useCallback, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, Check, X, AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'
import { cn } from './ui/utils'
import { toast } from 'sonner'

interface ImportPreviewRow {
  [key: string]: string | number | null
}

interface ColumnMapping {
  csvColumn: string
  dbField: string
  required: boolean
}

interface ExcelImportProps {
  onImport?: (data: ImportPreviewRow[]) => Promise<boolean>
  className?: string
}

const REQUIRED_FIELDS = [
  { field: 'employee_no', label: 'رقم الموظف', required: true },
  { field: 'full_name', label: 'الاسم الكامل', required: true },
  { field: 'email', label: 'البريد الإلكتروني', required: true },
  { field: 'department', label: 'القسم', required: false },
  { field: 'position', label: 'المنصب', required: false },
  { field: 'hire_date', label: 'تاريخ التوظيف', required: false },
  { field: 'salary_grade_id', label: 'درجة الراتب', required: false },
  { field: 'phone', label: 'رقم الهاتف', required: false },
  { field: 'address', label: 'العنوان', required: false },
]

const SAMPLE_DATA = [
  ['رقم الموظف', 'الاسم الكامل', 'البريد الإلكتروني', 'القسم', 'المنصب', 'تاريخ التوظيف'],
  ['EMP001', 'أحمد محمد علي', 'ahmed@company.com', 'تكنولوجيا المعلومات', 'مطور برمجيات', '2023-01-15'],
  ['EMP002', 'فاطمة أحمد', 'fatima@company.com', 'الموارد البشرية', 'أخصائي موارد بشرية', '2023-02-01'],
  ['EMP003', 'محمد حسن', 'mohammed@company.com', 'المالية', 'محاسب', '2023-03-10'],
]

export function ExcelImport({ onImport, className }: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'validate' | 'import'>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(f => 
      f.name.endsWith('.xlsx') || 
      f.name.endsWith('.xls') || 
      f.name.endsWith('.csv')
    )
    
    if (excelFile) {
      handleFileSelect(excelFile)
    } else {
      toast.error('يرجى رفع ملف Excel أو CSV فقط')
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setIsProcessing(true)
    
    try {
      // Mock file parsing - in real implementation, use xlsx library
      // const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array' })
      // const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      // const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      // Mock data for demonstration
      const mockHeaders = ['رقم الموظف', 'الاسم الكامل', 'البريد الإلكتروني', 'القسم', 'المنصب', 'تاريخ التوظيف']
      const mockData = [
        { 'رقم الموظف': 'EMP006', 'الاسم الكامل': 'سارة أحمد', 'البريد الإلكتروني': 'sara@company.com', 'القسم': 'المبيعات', 'المنصب': 'مدير مبيعات', 'تاريخ التوظيف': '2023-04-01' },
        { 'رقم الموظف': 'EMP007', 'الاسم الكامل': 'خالد محمود', 'البريد الإلكتروني': 'khalid@company.com', 'القسم': 'التسويق', 'المنصب': 'أخصائي تسويق', 'تاريخ التوظيف': '2023-05-15' },
      ]
      
      setHeaders(mockHeaders)
      setPreviewData(mockData)
      setStep('preview')
      
      toast.success('تم تحليل الملف بنجاح')
    } catch (error) {
      console.error('File parsing error:', error)
      toast.error('فشل في تحليل الملف')
    } finally {
      setIsProcessing(false)
    }
  }

  const proceedToMapping = () => {
    // Initialize column mapping
    const mapping: ColumnMapping[] = REQUIRED_FIELDS.map(field => ({
      csvColumn: headers.find(h => h.includes(field.label.split(' ')[0])) || '',
      dbField: field.field,
      required: field.required
    }))
    
    setColumnMapping(mapping)
    setStep('mapping')
  }

  const updateColumnMapping = (dbField: string, csvColumn: string) => {
    setColumnMapping(prev => 
      prev.map(mapping => 
        mapping.dbField === dbField 
          ? { ...mapping, csvColumn }
          : mapping
      )
    )
  }

  const validateMapping = () => {
    const errors: string[] = []
    
    // Check required fields
    columnMapping.forEach(mapping => {
      if (mapping.required && !mapping.csvColumn) {
        const fieldLabel = REQUIRED_FIELDS.find(f => f.field === mapping.dbField)?.label
        errors.push(`الحقل المطلوب "${fieldLabel}" غير مرتبط`)
      }
    })
    
    // Check for duplicate employee numbers
    const employeeNumbers = previewData.map(row => {
      const empNoColumn = columnMapping.find(m => m.dbField === 'employee_no')?.csvColumn
      return empNoColumn ? row[empNoColumn] : null
    }).filter(Boolean)
    
    const duplicates = employeeNumbers.filter((num, index) => 
      employeeNumbers.indexOf(num) !== index
    )
    
    if (duplicates.length > 0) {
      errors.push(`أرقام موظفين مكررة: ${duplicates.join(', ')}`)
    }
    
    setValidationErrors(errors)
    
    if (errors.length === 0) {
      setStep('validate')
      toast.success('تم التحقق من البيانات بنجاح')
    } else {
      toast.error(`تم العثور على ${errors.length} خطأ في البيانات`)
    }
  }

  const performImport = async () => {
    if (!onImport) {
      toast.error('وظيفة الاستيراد غير متوفرة')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Transform data according to column mapping
      const transformedData = previewData.map(row => {
        const transformed: ImportPreviewRow = {}
        columnMapping.forEach(mapping => {
          if (mapping.csvColumn && row[mapping.csvColumn] !== undefined) {
            transformed[mapping.dbField] = row[mapping.csvColumn]
          }
        })
        return transformed
      })
      
      const success = await onImport(transformedData)
      
      if (success) {
        setStep('import')
        toast.success(`تم استيراد ${transformedData.length} موظف بنجاح`)
      } else {
        toast.error('فشل في استيراد البيانات')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('حدث خطأ أثناء الاستيراد')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    // Create CSV content
    const csvContent = SAMPLE_DATA.map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'employee_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('تم تحميل القالب بنجاح')
  }

  const resetImport = () => {
    setFile(null)
    setPreviewData([])
    setHeaders([])
    setColumnMapping([])
    setStep('upload')
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">استيراد الموظفين من Excel</h2>
          <p className="text-sm text-gray-500">رفع وتحليل ملفات Excel/CSV لاستيراد بيانات الموظفين</p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          تحميل القالب
        </Button>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400",
              isProcessing && "opacity-50 pointer-events-none"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
            />
            
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            
            {isProcessing ? (
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">جاري تحليل الملف...</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  اسحب ملف Excel هنا أو انقر للاختيار
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  يدعم ملفات .xlsx, .xls, .csv (حد أقصى 10MB)
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  اختيار ملف
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && previewData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">معاينة البيانات</h3>
            <p className="text-sm text-gray-500">
              تم العثور على {previewData.length} صف من البيانات
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th key={index} className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className="px-4 py-2 text-sm text-gray-900">
                        {row[header]?.toString() || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <Button variant="outline" onClick={resetImport}>
              إلغاء
            </Button>
            <Button onClick={proceedToMapping}>
              متابعة إلى ربط الأعمدة
            </Button>
          </div>
        </div>
      )}

      {/* Column Mapping Step */}
      {step === 'mapping' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">ربط الأعمدة</h3>
            <p className="text-sm text-gray-500">
              اربط أعمدة ملف Excel بحقول قاعدة البيانات
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {columnMapping.map((mapping) => {
              const fieldInfo = REQUIRED_FIELDS.find(f => f.field === mapping.dbField)
              return (
                <div key={mapping.dbField} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span className="font-medium text-gray-900">
                        {fieldInfo?.label}
                      </span>
                      {mapping.required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      حقل قاعدة البيانات: {mapping.dbField}
                    </p>
                  </div>
                  
                  <select
                    value={mapping.csvColumn}
                    onChange={(e) => updateColumnMapping(mapping.dbField, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- اختر العمود --</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
          
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <Button variant="outline" onClick={() => setStep('preview')}>
              رجوع
            </Button>
            <Button onClick={validateMapping}>
              التحقق من البيانات
            </Button>
          </div>
        </div>
      )}

      {/* Validation Step */}
      {step === 'validate' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">التحقق من البيانات</h3>
          </div>
          
          <div className="p-6">
            {validationErrors.length > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <h4 className="font-medium text-red-800">أخطاء في البيانات</h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">
                    البيانات جاهزة للاستيراد ({previewData.length} موظف)
                  </span>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">ملخص الاستيراد</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• عدد الموظفين: {previewData.length}</li>
                <li>• الحقول المطلوبة: {columnMapping.filter(m => m.required && m.csvColumn).length}/{columnMapping.filter(m => m.required).length}</li>
                <li>• الحقول الاختيارية: {columnMapping.filter(m => !m.required && m.csvColumn).length}</li>
              </ul>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <Button variant="outline" onClick={() => setStep('mapping')}>
              رجوع
            </Button>
            <Button 
              onClick={performImport}
              disabled={validationErrors.length > 0 || isProcessing}
            >
              {isProcessing ? 'جاري الاستيراد...' : 'بدء الاستيراد'}
            </Button>
          </div>
        </div>
      )}

      {/* Import Complete Step */}
      {step === 'import' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              تم الاستيراد بنجاح!
            </h3>
            <p className="text-gray-500 mb-6">
              تم استيراد {previewData.length} موظف إلى النظام
            </p>
            <Button onClick={resetImport}>
              استيراد ملف جديد
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
