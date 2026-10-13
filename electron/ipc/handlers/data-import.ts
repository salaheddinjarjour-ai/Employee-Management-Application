import { IpcMainInvokeEvent, dialog } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

/**
 * Data Import Handler
 * Supports importing data from Excel/CSV files for various entities
 */
export const dataImportHandlers = {
    /**
     * Select file for import
     */
    selectFile: async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Spreadsheet Files', extensions: ['xlsx', 'xls', 'csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })

        if (result.canceled || result.filePaths.length === 0) {
            return null
        }

        return result.filePaths[0]
    },

    /**
     * Preview import data from file
     */
    previewImport: async (event: IpcMainInvokeEvent, filePath: string, entityType: string) => {
        try {
            const workbook = XLSX.readFile(filePath)
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const data = XLSX.utils.sheet_to_json(worksheet)

            return {
                success: true,
                preview: data.slice(0, 10), // First 10 rows
                totalRows: data.length,
                columns: data.length > 0 ? Object.keys(data[0]) : []
            }
        } catch (error) {
            console.error('Error previewing import:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to preview file'
            }
        }
    },

    /**
     * Import data into database
     */
    importData: async (
        event: IpcMainInvokeEvent,
        filePath: string,
        entityType: string,
        columnMapping: Record<string, string>
    ) => {
        const db = getDatabase()

        try {
            const workbook = XLSX.readFile(filePath)
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const rawData = XLSX.utils.sheet_to_json(worksheet)

            let successCount = 0
            let errorCount = 0
            const errors: string[] = []

            // Map entity types to table names
            const tableMap: Record<string, string> = {
                employees: 'employees',
                leaves: 'leaves',
                absences: 'absences',
                rewards: 'rewards',
                promotions: 'promotions',
                evaluations: 'evaluations',
                courses: 'courses'
            }

            const tableName = tableMap[entityType]
            if (!tableName) {
                throw new Error(`Unknown entity type: ${entityType}`)
            }

            // Process each row
            for (let i = 0; i < rawData.length; i++) {
                try {
                    const row: any = rawData[i]
                    const mappedData: any = {}

                    // Apply column mapping
                    Object.keys(columnMapping).forEach(excelCol => {
                        const dbCol = columnMapping[excelCol]
                        if (row[excelCol] !== undefined && row[excelCol] !== null) {
                            mappedData[dbCol] = row[excelCol]
                        }
                    })

                    // Skip empty rows
                    if (Object.keys(mappedData).length === 0) {
                        continue
                    }

                    // Insert into database
                    const fields = Object.keys(mappedData)
                    const placeholders = fields.map(() => '?').join(', ')
                    const fieldNames = fields.join(', ')
                    const values = fields.map(f => mappedData[f])

                    db.run(`
            INSERT INTO ${tableName} (${fieldNames})
            VALUES (${placeholders})
          `, values)

                    successCount++
                } catch (rowError) {
                    errorCount++
                    errors.push(`Row ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`)
                }
            }

            persistDatabase()

            return {
                success: true,
                imported: successCount,
                failed: errorCount,
                errors: errors.slice(0, 10) // Return first 10 errors
            }
        } catch (error) {
            console.error('Error importing data:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to import data'
            }
        }
    },

    /**
     * Get import template for entity type
     */
    getImportTemplate: async (event: IpcMainInvokeEvent, entityType: string) => {
        // Define templates for each entity type
        const templates: Record<string, string[]> = {
            employees: [
                'employee_no', 'full_name', 'national_id', 'phone', 'email',
                'birth_date', 'gender', 'department', 'unit', 'job_title',
                'join_date', 'contract_type', 'employment_status'
            ],
            leaves: [
                'employee_id', 'employee_name', 'leave_type', 'from_date',
                'to_date', 'days_count', 'reason', 'status'
            ],
            absences: [
                'employee_id', 'employee_name', 'from_date', 'to_date',
                'days_count', 'type', 'reason', 'status'
            ],
            rewards: [
                'employee_id', 'employee_name', 'title', 'description',
                'kind', 'category', 'amount_usd', 'reward_date', 'status'
            ],
            promotions: [
                'employee_id', 'employee_name', 'from_title', 'to_title',
                'from_grade', 'to_grade', 'effective_date', 'increase_amount_usd', 'status'
            ]
        }

        return templates[entityType] || []
    }
}

/**
 * Payroll Template Import Handler
 * Allows importing payroll templates from Excel files
 */
export const payrollTemplateHandlers = {
    /**
     * Import payroll template from Excel file
     */
    importTemplate: async (event: IpcMainInvokeEvent, filePath: string) => {
        const db = getDatabase()

        try {
            const workbook = XLSX.readFile(filePath)
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const data = XLSX.utils.sheet_to_json(worksheet)

            let successCount = 0
            let errorCount = 0
            const errors: string[] = []

            for (let i = 0; i < data.length; i++) {
                try {
                    const row: any = data[i]

                    // Validate required fields
                    if (!row.employee_id || !row.period) {
                        throw new Error('Missing required fields: employee_id or period')
                    }

                    // Check if payroll already exists
                    const existing = db.exec(
                        'SELECT id FROM payroll_headers WHERE employee_id = ? AND period = ?',
                        [row.employee_id, row.period]
                    )

                    let headerId: number

                    if (existing.length > 0 && existing[0].values.length > 0) {
                        // Update existing
                        headerId = existing[0].values[0][0] as number

                        db.run(`
              UPDATE payroll_headers
              SET 
                id_number = ?,
                start_date = ?,
                admin_level = ?,
                job_title = ?,
                edu_actual = ?,
                edu_required = ?,
                base_min = ?,
                base_min_currency = ?,
                years_of_exp = ?,
                max_experience_years = ?,
                experience_allowance_amount = ?,
                experience_allowance_currency = ?,
                notes = ?,
                updated_at = datetime('now')
              WHERE id = ?
            `, [
                            row.id_number || null,
                            row.start_date || null,
                            row.admin_level || null,
                            row.job_title || null,
                            row.edu_actual || null,
                            row.edu_required || null,
                            row.base_min || 0,
                            row.base_min_currency || 'TRY',
                            row.years_of_exp || 0,
                            row.max_experience_years || null,
                            row.experience_allowance_amount || 0,
                            row.experience_allowance_currency || 'TRY',
                            row.notes || null,
                            headerId
                        ])
                    } else {
                        // Create new
                        db.run(`
              INSERT INTO payroll_headers (
                employee_id, period, id_number, start_date, admin_level,
                job_title, edu_actual, edu_required, base_min, base_min_currency,
                years_of_exp, max_experience_years, experience_allowance_amount,
                experience_allowance_currency, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                            row.employee_id,
                            row.period,
                            row.id_number || null,
                            row.start_date || null,
                            row.admin_level || null,
                            row.job_title || null,
                            row.edu_actual || null,
                            row.edu_required || null,
                            row.base_min || 0,
                            row.base_min_currency || 'TRY',
                            row.years_of_exp || 0,
                            row.max_experience_years || null,
                            row.experience_allowance_amount || 0,
                            row.experience_allowance_currency || 'TRY',
                            row.notes || null
                        ])

                        const idResult = db.exec('SELECT last_insert_rowid() as id')
                        headerId = idResult[0].values[0][0] as number
                    }

                    // Import payroll lines if present
                    if (row.lines) {
                        try {
                            const lines = JSON.parse(row.lines)

                            // Delete existing lines
                            db.run('DELETE FROM payroll_lines WHERE header_id = ?', [headerId])

                            // Insert new lines
                            lines.forEach((line: any) => {
                                db.run(`
                  INSERT INTO payroll_lines (
                    header_id, category, label, currency, amount, sort_order
                  ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                                    headerId,
                                    line.category,
                                    line.label,
                                    line.currency || 'TRY',
                                    line.amount,
                                    line.sort_order || 0
                                ])
                            })
                        } catch (lineError) {
                            console.warn('Failed to import lines for row', i, lineError)
                        }
                    }

                    successCount++
                } catch (rowError) {
                    errorCount++
                    errors.push(`Row ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`)
                }
            }

            persistDatabase()

            return {
                success: true,
                imported: successCount,
                failed: errorCount,
                errors: errors.slice(0, 10)
            }
        } catch (error) {
            console.error('Error importing payroll template:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to import template'
            }
        }
    },

    /**
     * Export payroll template to Excel
     */
    exportTemplate: async (event: IpcMainInvokeEvent, period?: string) => {
        const db = getDatabase()

        try {
            let query = `
        SELECT 
          ph.*,
          e.full_name as employee_name,
          e.employee_no
        FROM payroll_headers ph
        LEFT JOIN employees e ON ph.employee_id = e.id
      `

            const params: any[] = []
            if (period) {
                query += ' WHERE ph.period = ?'
                params.push(period)
            }

            query += ' ORDER BY ph.period DESC, e.employee_no ASC'

            const result = db.exec(query, params)

            if (result.length === 0 || result[0].values.length === 0) {
                return {
                    success: false,
                    error: 'No payroll data found'
                }
            }

            const cols = result[0].columns
            const data = result[0].values.map(row => {
                const obj: any = {}
                cols.forEach((c, i) => obj[c] = row[i])
                return obj
            })

            // Create workbook
            const worksheet = XLSX.utils.json_to_sheet(data)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Template')

            // Generate file path
            const { app } = require('electron')
            const downloadsPath = app.getPath('downloads')
            const fileName = `payroll_template_${period || 'all'}_${Date.now()}.xlsx`
            const filePath = path.join(downloadsPath, fileName)

            XLSX.writeFile(workbook, filePath)

            return {
                success: true,
                filePath,
                fileName
            }
        } catch (error) {
            console.error('Error exporting payroll template:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to export template'
            }
        }
    }
}
