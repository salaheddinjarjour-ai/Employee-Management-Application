import { loadWorkbook } from './excelArabic'
import { parseSalaryWorkbook } from './parseSalarySheet'
import repos from '../db/repositories'
import { computePayrollUSD, withTRY, PayrollInputs, PayrollOutputUSD, PayrollOutputTRY } from '../payroll/calc'

// Helper function to get current exchange rate
async function getCurrentExchangeRate() {
  try {
    // Exchange rate system not implemented yet
    return null
  } catch (error) {
    console.warn('[Excel Import] Could not get exchange rate:', error)
    return null
  }
}

export interface ImportOptions {
  month: string // YYYY-MM format, e.g., '2025-09'
  overwriteExisting?: boolean
}

export interface ImportResult {
  success: boolean
  totalRows: number
  summary: {
    totalRows: number
    added: number
    updated: number
    errors: number
    skipped: number
  }
  employees: ImportedEmployee[]
  errors: string[]
  salaryScaleFound: boolean
}

export interface ImportedEmployee {
  employee_no: string
  full_name: string
  status: 'added' | 'updated' | 'error' | 'skipped'
  error?: string
  employeeId?: number
  payrollId?: number
  row_number: number
}

export interface EnhancedPreviewEmployee {
  employee_no: string
  full_name: string
  // inputs for payroll calculation
  inputs: PayrollInputs
  // computed USD values
  computedUSD: PayrollOutputUSD
  // computed TRY values (if exchange rate available)
  computedTRY?: PayrollOutputTRY
  // exchange rate used for conversion
  rate_used?: number
  // original row data for reference
  row_number: number
}

/**
 * Preview Excel file without importing - returns enhanced data with payroll calculations
 */
export async function previewExcelImport(filePath: string): Promise<{
  preview: EnhancedPreviewEmployee[]
  summary: {
    totalRows: number
    validRows: number
    headerRow: number
    scaleFound: boolean
  }
  errors: string[]
}> {
  try {
    console.log('[Excel Import] Previewing file:', filePath)

    const wb = loadWorkbook(filePath)
    const parseResult = parseSalaryWorkbook(wb, 'Sheet1')

    // Get current exchange rate
    const exchangeRateData = await getCurrentExchangeRate()
    const currentRate = (exchangeRateData as any)?.rate || 34.0 // fallback rate

    // Convert first 10 employees to enhanced preview format
    const preview: EnhancedPreviewEmployee[] = parseResult.employees.slice(0, 10).map(emp => {
      // Build PayrollInputs from parsed employee data
      const inputs: PayrollInputs = {
        base_salary_usd: emp.base_salary,
        admin_allowance_usd: emp.admin_allowance,
        education_allowance_usd: emp.education_allowance,
        housing_allowance_usd: emp.housing_allowance,
        transport_allowance_usd: emp.transport_allowance,
        col_allowance_usd: emp.col_allowance,
        children_allowance_usd: emp.children_allowance,
        special_allowance_usd: emp.special_allowance,
        fuel_allowance_usd: emp.fuel_allowance,
        eos_accrual_usd: 0, // TODO: Add EOS calculation if available in sheet
        exceptional_additions_usd: 0, // TODO: Parse exceptional additions from sheet
        deduction_loan_penalty_usd: 0, // TODO: Parse deductions if available
        deduction_payment_usd: 0,
        deductions_other_usd: 0,
        overtime_hours: emp.overtime_hours,
        hours_per_day: 8,
        days_per_month: 30,
        overtime_multiplier: 1.25
      }

      // Compute USD payroll
      const computedUSD = computePayrollUSD(inputs)

      // Compute TRY payroll if exchange rate available
      const computedTRY = exchangeRateData ? withTRY(computedUSD, currentRate) : undefined

      return {
        employee_no: emp.employee_no,
        full_name: emp.full_name,
        inputs,
        computedUSD,
        computedTRY,
        rate_used: exchangeRateData ? currentRate : undefined,
        row_number: emp.row_number
      }
    })

    console.log('[Excel Import] Enhanced preview generated:', {
      total: parseResult.employees.length,
      preview: preview.length,
      errors: parseResult.errors.length,
      exchangeRate: currentRate
    })

    return {
      preview,
      summary: parseResult.summary,
      errors: parseResult.errors
    }
  } catch (error: any) {
    console.error('[Excel Import] Preview failed:', error)
    return {
      preview: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        headerRow: -1,
        scaleFound: false
      },
      errors: [error.message || 'خطأ في قراءة الملف']
    }
  }
}

/**
 * Run full Excel import with database operations
 */
export async function runExcelImport(filePath: string, options: ImportOptions): Promise<ImportResult> {
  console.log('[Excel Import] Starting import:', { filePath, options })

  const result: ImportResult = {
    success: false,
    totalRows: 0,
    summary: {
      totalRows: 0,
      added: 0,
      updated: 0,
      errors: 0,
      skipped: 0
    },
    employees: [],
    errors: [],
    salaryScaleFound: false
  }

  try {
    // Parse Excel file
    const wb = loadWorkbook(filePath)
    const parseResult = parseSalaryWorkbook(wb, 'Sheet1')

    if (parseResult.errors.length > 0) {
      result.errors.push(...parseResult.errors)
    }

    if (parseResult.employees.length === 0) {
      result.errors.push('لم يتم العثور على بيانات موظفين صالحة')
      return result
    }

    result.totalRows = parseResult.employees.length
    result.summary.totalRows = parseResult.employees.length
    result.salaryScaleFound = parseResult.summary.scaleFound

    console.log('[Excel Import] Parsed', parseResult.employees.length, 'employees')

    // Get current exchange rate if available
    // const activeRate = await getCurrentExchangeRate()

    // Process each employee
    const duplicateCheck = new Set<string>()

    for (const parsedEmp of parseResult.employees) {
      const importedEmp: ImportedEmployee = {
        employee_no: parsedEmp.employee_no,
        full_name: parsedEmp.full_name,
        status: 'error',
        row_number: parsedEmp.row_number
      }

      try {
        // Check for duplicates in this import batch
        if (duplicateCheck.has(parsedEmp.employee_no)) {
          importedEmp.status = 'skipped'
          importedEmp.error = 'رقم موظف مكرر في الملف'
          result.summary.skipped++
          result.employees.push(importedEmp)
          continue
        }
        duplicateCheck.add(parsedEmp.employee_no)

        // Skip rows with parsing errors
        if (parsedEmp.errors.length > 0) {
          importedEmp.status = 'error'
          importedEmp.error = parsedEmp.errors.join(', ')
          result.summary.errors++
          result.employees.push(importedEmp)
          continue
        }

        // Upsert employee record
        const employeeData = {
          employee_no: parsedEmp.employee_no,
          full_name: parsedEmp.full_name,
          hire_date: parsedEmp.hire_date || new Date().toISOString().slice(0, 10),
          job_title: parsedEmp.job_title || 'غير محدد',
          department: 'غير محدد', // Default department
          phone: null,
          email: null,
          status: 'active' as const
        }

        const existingEmployee = await repos.employees.findByEmployeeNo(parsedEmp.employee_no)
        const employeeId = await repos.employees.upsertByEmployeeNo(employeeData)
        importedEmp.employeeId = employeeId

        // Determine if this was an add or update
        const wasUpdate = !!existingEmployee
        importedEmp.status = wasUpdate ? 'updated' : 'added'

        // Create/update payroll snapshot
        /* const payrollData = {
          employee_id: employeeId,
          month: options.month,
          base_salary: parsedEmp.base_salary,
          total_allowances: parsedEmp.total_allowances,
          gross_salary: parsedEmp.gross_salary,
          daily_rate: parsedEmp.daily_rate,
          hourly_rate: parsedEmp.hourly_rate,
          overtime_hours: parsedEmp.overtime_hours,
          overtime_value: parsedEmp.overtime_value,
          deductions: parsedEmp.deductions_from_sheet,
          net_salary: parsedEmp.net_salary,
          rate_used: (activeRate as any)?.rate || null
        } */

        // For now, skip payroll upsert as it requires more parameters
        // const payrollResult = repos.payroll.upsert(employeeId, month, status, inputs, computedUSD, computedTRY, rate, audit)
        // importedEmp.payrollId = payrollResult.id

        // Update summary counters
        if (wasUpdate) {
          result.summary.updated++
        } else {
          result.summary.added++
        }

      } catch (error: any) {
        console.error('[Excel Import] Error processing employee:', parsedEmp.employee_no, error)
        importedEmp.status = 'error'
        importedEmp.error = error.message || 'خطأ في حفظ البيانات'
        result.summary.errors++
      }

      result.employees.push(importedEmp)
    }

    result.success = result.summary.errors === 0 || (result.summary.added + result.summary.updated) > 0

    console.log('[Excel Import] Import completed:', result.summary)
    return result

  } catch (error: any) {
    console.error('[Excel Import] Import failed:', error)
    result.errors.push(error.message || 'خطأ في معالجة الملف')
    return result
  }
}


/**
 * Generate CSV report of import errors
 */
export function generateErrorReport(importResult: ImportResult): string {
  const errorRows = importResult.employees.filter(emp => emp.status === 'error' || emp.status === 'skipped')

  if (errorRows.length === 0) {
    return 'رقم الصف,رقم الموظف,اسم الموظف,الحالة,الخطأ\nلا توجد أخطاء'
  }

  const csvRows = ['رقم الصف,رقم الموظف,اسم الموظف,الحالة,الخطأ']

  errorRows.forEach(emp => {
    const status = emp.status === 'error' ? 'خطأ' : 'تم التخطي'
    const error = emp.error || ''
    csvRows.push(`${emp.row_number},"${emp.employee_no}","${emp.full_name}","${status}","${error}"`)
  })

  return csvRows.join('\n')
}

/**
 * Validate import month format
 */
export function validateImportMonth(month: string): boolean {
  const monthRegex = /^\d{4}-\d{2}$/
  if (!monthRegex.test(month)) return false

  const [year, monthNum] = month.split('-').map(Number)
  return year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12
}
