import * as XLSX from 'xlsx'
import {
    normalizeAr,
    findCell,
    readRow,
    toISODate,
    preserveEmployeeNo,
    numberOr,
    buildHeaders
} from './excelArabic'

/**
 * Arabic column mapping to normalized keys
 */
const A2K = {
    "الاســــــــــــــــــم": "full_name",
    "الاسم الكامل": "full_name",
    "الاسم": "full_name",
    "رقم الموظف": "employee_no",
    "الرقم": "employee_no",
    "تاريخ بدء العمل": "hire_date",
    "تاريخ التوظيف": "hire_date",
    "المستوى": "level",
    "السلم": "level",
    "المسمى الوظيفي": "job_title",
    "الوظيفة": "job_title",
    "المنصب": "job_title",

    // Allowances
    "بدل علاوة إدارية": "admin_allowance",
    "علاوة إدارية": "admin_allowance",
    "بدل المؤهل العلمي": "education_allowance",
    "مؤهل علمي": "education_allowance",
    "بــدل الخبرة": "experience_allowance",
    "بدل الخبرة": "experience_allowance",
    "عدد سنوات الخبرة": "experience_years",
    "سنوات الخبرة": "experience_years",
    "بدل سكن": "housing_allowance",
    "بدل مواصلات": "transport_allowance",
    "بدل تكاليف المعيشة": "col_allowance",
    "تكاليف المعيشة": "col_allowance",
    "بدل أطفال": "children_allowance",
    "بدل خاص": "special_allowance",
    "بدل وقود": "fuel_allowance",

    // Payroll breakdown
    "تفصيل الراتب": "__section",
    "صافي الراتب": "net_from_sheet",
    "الراتب الصافي": "net_from_sheet",
    "الخصومات": "deductions_from_sheet",
    "ساعات إضافي": "overtime_hours",
    "الإضافي": "overtime_hours",
    "سعر الساعة": "hourly_rate_from_sheet",

    // Salary scale headers
    "الحد الأدنى": "base_salary",
    "الراتب الأساسي": "base_salary",
    "الأساسي": "base_salary",
    "السلم/المستوى": "level",
} as const

export interface ParsedEmployee {
    // Core employee data
    employee_no: string
    full_name: string
    hire_date: string | null
    job_title: string | null
    level: string | null

    // Allowances (from individual columns or calculated)
    admin_allowance: number
    education_allowance: number
    experience_allowance: number
    experience_years: number
    housing_allowance: number
    transport_allowance: number
    col_allowance: number
    children_allowance: number
    special_allowance: number
    fuel_allowance: number

    // Payroll breakdown (from sheet, but we'll recalculate)
    net_from_sheet: number
    deductions_from_sheet: number
    overtime_hours: number
    hourly_rate_from_sheet: number

    // Calculated payroll
    base_salary: number
    total_allowances: number
    gross_salary: number
    daily_rate: number
    hourly_rate: number
    overtime_value: number
    net_salary: number

    // Metadata
    row_number: number
    errors: string[]
}

export interface SalaryScale {
    [level: string]: {
        base_salary: number
        admin_allowance?: number
        education_allowance?: number
        experience_allowance?: number
        [key: string]: number | undefined
    }
}

export interface ParseResult {
    employees: ParsedEmployee[]
    salaryScale: SalaryScale
    errors: string[]
    summary: {
        totalRows: number
        validRows: number
        headerRow: number
        scaleFound: boolean
    }
}

/**
 * Map Arabic header to normalized key with fuzzy matching
 */
function mapHeader(arabicHeader: string): string | null {
    const normalized = normalizeAr(arabicHeader)

    // Exact match first
    for (const [arabic, key] of Object.entries(A2K)) {
        if (normalizeAr(arabic) === normalized) {
            return key
        }
    }

    // Fuzzy match by contains
    for (const [arabic, key] of Object.entries(A2K)) {
        const normalizedArabic = normalizeAr(arabic)
        if (normalized.includes(normalizedArabic) || normalizedArabic.includes(normalized)) {
            return key
        }
    }

    return null
}

/**
 * Find header row by looking for the anchor text "الاســــــــــــــــــم"
 */
function findHeaderRow(ws: XLSX.WorkSheet): { row: number; headers: string[]; mapping: Record<number, string> } | null {
    const anchorCell = findCell(ws, "الاســــــــــــــــــم")
    if (!anchorCell) {
        return null
    }

    const headerValues = readRow(ws, anchorCell.row)
    const headers = buildHeaders(headerValues)

    // Build column mapping
    const mapping: Record<number, string> = {}
    headers.forEach((header, colIndex) => {
        const key = mapHeader(header)
        if (key) {
            mapping[colIndex] = key
        }
    })

    return {
        row: anchorCell.row,
        headers,
        mapping
    }
}

/**
 * Parse data rows starting from header row + 1
 */
function parseDataRows(
    ws: XLSX.WorkSheet,
    headerRow: number,
    mapping: Record<number, string>,
    salaryScale: SalaryScale
): ParsedEmployee[] {
    const employees: ParsedEmployee[] = []
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
    let consecutiveEmptyRows = 0

    for (let rowIndex = headerRow + 1; rowIndex <= range.e.r; rowIndex++) {
        const values = readRow(ws, rowIndex)

        // Check if row is empty in the full_name column
        const nameColIndex = Object.keys(mapping).find(col => mapping[parseInt(col)] === 'full_name')
        const nameValue = nameColIndex ? values[parseInt(nameColIndex)] : null

        if (!nameValue || String(nameValue).trim() === '') {
            consecutiveEmptyRows++
            if (consecutiveEmptyRows >= 2) break
            continue
        }

        consecutiveEmptyRows = 0

        // Parse this row
        const employee = parseEmployeeRow(values, mapping, salaryScale, rowIndex + 1)
        if (employee) {
            employees.push(employee)
        }
    }

    return employees
}

/**
 * Parse a single employee row
 */
function parseEmployeeRow(
    values: (string | number | null)[],
    mapping: Record<number, string>,
    salaryScale: SalaryScale,
    rowNumber: number
): ParsedEmployee | null {
    const errors: string[] = []
    const data: Record<string, any> = {}

    // Extract mapped values
    Object.entries(mapping).forEach(([colIndex, key]) => {
        const value = values[parseInt(colIndex)]

        if (key === 'employee_no') {
            data[key] = preserveEmployeeNo(value)
        } else if (key === 'hire_date') {
            data[key] = toISODate(value)
        } else if (key.includes('allowance') || key.includes('hours') || key.includes('rate') || key.includes('deductions') || key === 'experience_years') {
            data[key] = numberOr(value, 0)
        } else {
            data[key] = value ? String(value).trim() : null
        }
    })

    // Validate required fields
    if (!data.full_name) {
        errors.push('اسم الموظف مطلوب')
        return null
    }

    if (!data.employee_no) {
        errors.push('رقم الموظف مطلوب')
        return null
    }

    // Get salary scale defaults for this level
    const level = data.level || '1'
    const scaleDefaults = (salaryScale[level] || { base_salary: 0 }) as any

    // Calculate payroll simplified (since computeTotals is already available in util if needed)
    const base = numberOr(scaleDefaults.base_salary, 0)
    const admin = numberOr(data.admin_allowance ?? scaleDefaults.admin_allowance, 0)
    const edu = numberOr(data.education_allowance ?? scaleDefaults.education_allowance, 0)
    const exp = numberOr(data.experience_allowance ?? (numberOr(data.experience_years, 0) * 100), 0)

    const housing = numberOr(data.housing_allowance, 0)
    const transport = numberOr(data.transport_allowance, 0)
    const col = numberOr(data.col_allowance, 0)
    const children = numberOr(data.children_allowance, 0)
    const special = numberOr(data.special_allowance, 0)
    const fuel = numberOr(data.fuel_allowance, 0)

    const total_allowances = admin + edu + exp + housing + transport + col + children + special + fuel
    const gross_salary = base + total_allowances

    // Calculate rates
    const DAILY_DIV = 30
    const HOURS_PER_DAY = 8
    const OT_MULT = 1.25

    const daily_rate = base / DAILY_DIV
    const hourly_rate = daily_rate / HOURS_PER_DAY

    const overtime_hours = numberOr(data.overtime_hours, 0)
    const overtime_value = overtime_hours * hourly_rate * OT_MULT

    const deductions = numberOr(data.deductions_from_sheet, 0)
    const net_salary = gross_salary + overtime_value - deductions

    return {
        // Core data
        employee_no: data.employee_no,
        full_name: data.full_name,
        hire_date: data.hire_date,
        job_title: data.job_title,
        level,

        // Allowances
        admin_allowance: admin,
        education_allowance: edu,
        experience_allowance: exp,
        experience_years: numberOr(data.experience_years, 0),
        housing_allowance: housing,
        transport_allowance: transport,
        col_allowance: col,
        children_allowance: children,
        special_allowance: special,
        fuel_allowance: fuel,

        // From sheet (but we recalculate)
        net_from_sheet: numberOr(data.net_from_sheet, 0),
        deductions_from_sheet: deductions,
        overtime_hours,
        hourly_rate_from_sheet: numberOr(data.hourly_rate_from_sheet, 0),

        // Calculated
        base_salary: base,
        total_allowances,
        gross_salary,
        daily_rate,
        hourly_rate,
        overtime_value,
        net_salary,

        // Metadata
        row_number: rowNumber,
        errors
    }
}

/**
 * Find and parse salary scale grid
 */
function findSalaryScale(ws: XLSX.WorkSheet): SalaryScale {
    const scale: SalaryScale = {}

    // Look for scale header
    const levelCell = findCell(ws, "المستوى") || findCell(ws, "السلم/المستوى") || findCell(ws, "السلم")
    if (!levelCell) {
        return scale
    }

    const baseCell = findCell(ws, "الحد الأدنى") || findCell(ws, "الراتب الأساسي") || findCell(ws, "الأساسي")
    if (!baseCell || Math.abs(levelCell.row - baseCell.row) > 2) {
        return scale
    }

    // Use the row that contains both level and base headers
    const headerRow = levelCell.row
    const headerValues = readRow(ws, headerRow)
    const headers = buildHeaders(headerValues)

    // Build mapping for scale columns
    const scaleMapping: Record<number, string> = {}
    headers.forEach((header, colIndex) => {
        const key = mapHeader(header)
        if (key) {
            scaleMapping[colIndex] = key
        }
    })

    // Parse scale data rows
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
    for (let rowIndex = headerRow + 1; rowIndex <= range.e.r; rowIndex++) {
        const values = readRow(ws, rowIndex)
        const levelValue = values[levelCell.col]

        if (!levelValue || String(levelValue).trim() === '') {
            break // End of scale data
        }

        const level = String(levelValue).trim()
        const scaleRow: Record<string, number> = {}

        Object.entries(scaleMapping).forEach(([colIndex, key]) => {
            const value = values[parseInt(colIndex)]
            if (key !== 'level' && key !== '__section') {
                scaleRow[key] = numberOr(value, 0)
            }
        })

        if (scaleRow.base_salary || Object.keys(scaleRow).length > 0) {
            scale[level] = scaleRow as any
        }
    }

    return scale
}

/**
 * Main function to parse salary sheet
 */
export function parseSalarySheet(ws: XLSX.WorkSheet): ParseResult {
    const errors: string[] = []

    // Find header row
    const headerInfo = findHeaderRow(ws)
    if (!headerInfo) {
        errors.push('تعذر تحديد صف العناوين (الاســــــــــــــــــم)')
        return {
            employees: [],
            salaryScale: {},
            errors,
            summary: {
                totalRows: 0,
                validRows: 0,
                headerRow: -1,
                scaleFound: false
            }
        }
    }

    // Find salary scale
    const salaryScale = findSalaryScale(ws)
    const scaleFound = Object.keys(salaryScale).length > 0

    // Parse employee data
    const employees = parseDataRows(ws, headerInfo.row, headerInfo.mapping, salaryScale)

    return {
        employees,
        salaryScale,
        errors,
        summary: {
            totalRows: employees.length,
            validRows: employees.filter(emp => emp.errors.length === 0).length,
            headerRow: headerInfo.row + 1, // 1-based for display
            scaleFound
        }
    }
}

/**
 * Parse salary sheet from workbook by sheet name
 */
export function parseSalaryWorkbook(wb: XLSX.WorkBook, sheetName: string = 'Sheet1'): ParseResult {
    const ws = wb.Sheets[sheetName]
    if (!ws) {
        return {
            employees: [],
            salaryScale: {},
            errors: [`الورقة "${sheetName}" غير موجودة في الملف`],
            summary: {
                totalRows: 0,
                validRows: 0,
                headerRow: -1,
                scaleFound: false
            }
        }
    }

    return parseSalarySheet(ws)
}
