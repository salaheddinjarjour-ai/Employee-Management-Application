import { IpcMainInvokeEvent } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { getDatabase } from '../../database/init'
import { loadWorkbook, normalizeAr } from '../../util/excel/excelArabic'
import { parseSalaryWorkbook, ParsedEmployee } from '../../util/excel/parseSalarySheet'
import { computeTotals } from '../../util/payrollCalc'

export interface ImportOptions {
    month: string
    overwriteExisting?: boolean
}

export interface ImportedEmployee {
    employee_no: string
    full_name: string
    status: 'added' | 'updated' | 'error' | 'skipped'
    error?: string
    employeeId?: number
    row_number: number
}

export const excelHandlers = {
    preview: async (event: IpcMainInvokeEvent, fileInput: any) => {
        try {
            // In Electron, fileInput should be the absolute path string
            const filePath = typeof fileInput === 'string' ? fileInput : fileInput.path
            if (!filePath || !fs.existsSync(filePath)) {
                throw new Error('File path invalid or not found')
            }

            console.log('[Excel Handler] Previewing:', filePath)
            const wb = loadWorkbook(filePath)
            const parseResult = parseSalaryWorkbook(wb, 'Sheet1')

            // Convert to format expected by frontend
            const preview = parseResult.employees.slice(0, 10).map(emp => {
                // Simplified mapping for preview
                const inputs = {
                    base_salary: emp.base_salary,
                    admin_allowance: emp.admin_allowance,
                    education_allowance: emp.education_allowance,
                    experience_allowance: emp.experience_allowance,
                    housing_allowance: emp.housing_allowance,
                    transport_allowance: emp.transport_allowance,
                    col_allowance: emp.col_allowance,
                    children_allowance: emp.children_allowance,
                    special_allowance: emp.special_allowance,
                    fuel_allowance: emp.fuel_allowance,
                }

                // Use our computeTotals utility for consistency
                const totals = computeTotals(
                    {
                        base_min: emp.base_salary,
                        years_of_exp: emp.experience_years,
                        base_min_currency: 'USD',
                        experience_allowance_amount: emp.experience_allowance,
                        experience_allowance_currency: 'USD'
                    },
                    [
                        { category: 'allowance', label: 'Admin', amount: emp.admin_allowance, currency: 'USD' },
                        { category: 'allowance', label: 'Education', amount: emp.education_allowance, currency: 'USD' },
                        { category: 'allowance', label: 'Housing', amount: emp.housing_allowance, currency: 'USD' },
                        { category: 'allowance', label: 'Transport', amount: emp.transport_allowance, currency: 'USD' },
                        { category: 'allowance', label: 'COLA', amount: emp.col_allowance, currency: 'USD' },
                        { category: 'allowance', label: 'Children', amount: emp.children_allowance, currency: 'USD' },
                        { category: 'allowance', label: 'Special', amount: emp.special_allowance, currency: 'USD' },
                        { category: 'allowance', label: 'Fuel', amount: emp.fuel_allowance, currency: 'USD' },
                    ],
                    0 // Experience rate from DB? 0 for now
                )

                return {
                    employee_no: emp.employee_no,
                    full_name: emp.full_name,
                    inputs: emp, // Pass full parsed emp as inputs
                    computedUSD: {
                        base_salary: emp.base_salary,
                        total_allowances: emp.total_allowances,
                        gross_salary: emp.gross_salary,
                        net_salary: emp.net_salary,
                        deductions: emp.deductions_from_sheet
                    },
                    row_number: emp.row_number
                }
            })

            return {
                success: true,
                data: {
                    preview,
                    summary: parseResult.summary,
                    errors: parseResult.errors
                }
            }
        } catch (error: any) {
            console.error('[Excel Handler] Preview failed:', error)
            return { success: false, error: error.message }
        }
    },

    import: async (event: IpcMainInvokeEvent, fileInput: any, options: ImportOptions) => {
        const db = getDatabase()
        const filePath = typeof fileInput === 'string' ? fileInput : fileInput.path

        const result = {
            success: false,
            summary: { totalRows: 0, added: 0, updated: 0, errors: 0, skipped: 0 },
            employees: [] as ImportedEmployee[],
            errors: [] as string[],
            salaryScaleFound: false
        }

        try {
            if (!filePath || !fs.existsSync(filePath)) throw new Error('File not found')

            const wb = loadWorkbook(filePath)
            const parseResult = parseSalaryWorkbook(wb, 'Sheet1')

            result.summary.totalRows = parseResult.employees.length
            result.salaryScaleFound = parseResult.summary.scaleFound

            for (const parsedEmp of parseResult.employees) {
                const importedEmp: ImportedEmployee = {
                    employee_no: parsedEmp.employee_no,
                    full_name: parsedEmp.full_name,
                    status: 'error',
                    row_number: parsedEmp.row_number
                }

                try {
                    // Check if employee exists
                    const exists = db.exec('SELECT id FROM employees WHERE employee_no = ?', [parsedEmp.employee_no])
                    const wasUpdate = exists.length > 0 && exists[0].values.length > 0

                    if (wasUpdate) {
                        const empId = exists[0].values[0][0]
                        db.run(`UPDATE employees SET 
              full_name = ?, 
              basic_salary = ?, 
              housing_allowance = ?, 
              transport_allowance = ?, 
              other_allowances = ?,
              grade = ?,
              job_title = ?
              WHERE id = ?`,
                            [
                                parsedEmp.full_name,
                                parsedEmp.base_salary,
                                parsedEmp.housing_allowance,
                                parsedEmp.transport_allowance,
                                parsedEmp.total_allowances - parsedEmp.housing_allowance - parsedEmp.transport_allowance,
                                parsedEmp.level,
                                parsedEmp.job_title,
                                empId
                            ]
                        )
                        importedEmp.employeeId = Number(empId)
                        importedEmp.status = 'updated'
                        result.summary.updated++
                    } else {
                        db.run(`INSERT INTO employees (
              employee_no, full_name, basic_salary, housing_allowance, 
              transport_allowance, other_allowances, grade, job_title, status, hire_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
                            [
                                parsedEmp.employee_no,
                                parsedEmp.full_name,
                                parsedEmp.base_salary,
                                parsedEmp.housing_allowance,
                                parsedEmp.transport_allowance,
                                parsedEmp.total_allowances - parsedEmp.housing_allowance - parsedEmp.transport_allowance,
                                parsedEmp.level,
                                parsedEmp.job_title,
                                parsedEmp.hire_date || new Date().toISOString().slice(0, 10)
                            ])
                        const newId = db.exec('SELECT last_insert_rowid()')[0].values[0][0]
                        importedEmp.employeeId = Number(newId)
                        importedEmp.status = 'added'
                        result.summary.added++
                    }
                } catch (err: any) {
                    importedEmp.status = 'error'
                    importedEmp.error = err.message
                    result.summary.errors++
                }
                result.employees.push(importedEmp)
            }

            result.success = true
            return { success: true, data: result }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    },

    exportPreviewCSV: async (event: IpcMainInvokeEvent, filePath: string) => {
        // Stub for now - simply returns success and a fake path
        return { success: true, path: path.join(process.env.USERPROFILE || '', 'Desktop', 'employees_preview.csv') }
    }
}
