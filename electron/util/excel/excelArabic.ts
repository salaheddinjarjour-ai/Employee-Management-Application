import * as XLSX from 'xlsx'

/**
 * Low-level Excel reader with Arabic text utilities
 */

export interface CellPosition {
    row: number
    col: number
}

export interface WorksheetData {
    ws: XLSX.WorkSheet
    range: XLSX.Range
}

/**
 * Normalize Arabic text for comparison
 * - Trim whitespace
 * - Collapse multiple spaces and kashida (ـ)
 * - Remove diacritics
 * - Unify Arabic/English numerals
 */
export function normalizeAr(text: string | null | undefined): string {
    if (!text) return ''

    return String(text)
        .trim()
        // Remove diacritics (Arabic diacritical marks)
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
        // Collapse multiple spaces and kashida
        .replace(/[\s\u0640]+/g, ' ')
        // Convert Arabic numerals to English
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .trim()
}

/**
 * Find first cell containing the normalized text
 */
export function findCell(ws: XLSX.WorkSheet, searchText: string): CellPosition | null {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
    const normalizedSearch = normalizeAr(searchText)

    for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
            const cell = ws[cellRef]
            if (cell && normalizeAr(String(cell.v)) === normalizedSearch) {
                return { row, col }
            }
        }
    }
    return null
}

/**
 * Safely read a row of values
 */
export function readRow(ws: XLSX.WorkSheet, rowIndex: number): (string | number | null)[] {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
    const values: (string | number | null)[] = []

    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: col })
        const cell = ws[cellRef]
        values.push(cell ? cell.v : null)
    }

    return values
}

/**
 * Safely read a column of values
 */
export function readCol(ws: XLSX.WorkSheet, colIndex: number, startRow?: number, endRow?: number): (string | number | null)[] {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
    const start = startRow ?? range.s.r
    const end = endRow ?? range.e.r
    const values: (string | number | null)[] = []

    for (let row = start; row <= end; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: colIndex })
        const cell = ws[cellRef]
        values.push(cell ? cell.v : null)
    }

    return values
}

/**
 * Get cell value safely
 */
export function getCellValue(ws: XLSX.WorkSheet, row: number, col: number): string | number | null {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
    const cell = ws[cellRef]
    return cell ? cell.v : null
}

/**
 * Coerce various formats to number
 * Handles Arabic numerals, comma separators, etc.
 */
export function guessNumber(val: any): number {
    if (typeof val === 'number') return val
    if (!val) return 0

    const str = normalizeAr(String(val))
        .replace(/[,،]/g, '') // Remove thousand separators
        .replace(/[^\d.-]/g, '') // Keep only digits, decimal point, minus

    const num = parseFloat(str)
    return isNaN(num) ? 0 : num
}

/**
 * Convert various date formats to ISO YYYY-MM-DD
 */
export function toISODate(val: any): string | null {
    if (!val) return null

    // Excel date serial number
    if (typeof val === 'number' && val > 1) {
        const date = XLSX.SSF.parse_date_code(val)
        if (date) {
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
        }
    }

    // String date
    if (typeof val === 'string') {
        const str = normalizeAr(val)

        // Try parsing various formats
        const formats = [
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,      // YYYY-MM-DD
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,    // MM/DD/YYYY or DD/MM/YYYY
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/,      // MM-DD-YYYY or DD-MM-YYYY
        ]

        for (const format of formats) {
            const match = str.match(format)
            if (match) {
                let year: number, month: number, day: number

                if (format === formats[0]) { // YYYY-MM-DD
                    [, year, month, day] = match.map(Number)
                } else { // Assume DD/MM/YYYY for Arabic context
                    [, day, month, year] = match.map(Number)
                }

                if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                }
            }
        }

        // Try native Date parsing as fallback
        const date = new Date(str)
        if (!isNaN(date.getTime())) {
            return date.toISOString().slice(0, 10)
        }
    }

    return null
}

/**
 * Load workbook from file path
 */
export function loadWorkbook(filePath: string): XLSX.WorkBook {
    return XLSX.readFile(filePath)
}

/**
 * Get worksheet by name with error handling
 */
export function getWorksheet(wb: XLSX.WorkBook, sheetName: string): XLSX.WorkSheet | null {
    return wb.Sheets[sheetName] || null
}

/**
 * Preserve employee number with leading zeros
 */
export function preserveEmployeeNo(raw: any): string {
    if (!raw) return ''

    const empNo = String(raw).trim()
    // If it's a pure number, pad with zeros
    if (/^[0-9]+$/.test(empNo)) {
        return empNo.padStart(2, '0')
    }
    return empNo
}

/**
 * Helper to coerce value to number with fallback
 */
export function numberOr(val: any, fallback: number = 0): number {
    const num = guessNumber(val)
    return isNaN(num) ? fallback : num
}

/**
 * Check if a row is effectively empty (all null/empty values)
 */
export function isRowEmpty(values: (string | number | null)[]): boolean {
    return values.every(val => !val || String(val).trim() === '')
}

/**
 * Build headers from a row, handling merged cells by inheriting from left
 */
export function buildHeaders(values: (string | number | null)[]): string[] {
    const headers: string[] = []
    let lastNonEmpty = ''

    for (const val of values) {
        const str = val ? String(val).trim() : ''
        if (str) {
            lastNonEmpty = str
            headers.push(str)
        } else {
            // Inherit from left for merged cells
            headers.push(lastNonEmpty)
        }
    }

    return headers
}
