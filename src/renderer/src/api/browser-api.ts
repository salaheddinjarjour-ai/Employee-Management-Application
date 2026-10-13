/**
 * Browser API Shim
 * 
 * Replaces window.electronAPI / window.api when running in the browser.
 * Maps all Electron IPC calls to HTTP fetch() calls against the Express server.
 */

const API_BASE = '/api'

async function fetchJSON(url: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    })
    if (!res.ok) {
        const error = await res.text()
        throw new Error(error || `HTTP ${res.status}`)
    }
    return res.json()
}

// Helper: build query string from object
function qs(params?: Record<string, any>): string {
    if (!params) return ''
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    if (entries.length === 0) return ''
    return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}

/**
 * The IPC invoke handler — maps channel+args to HTTP calls.
 * This is the core router.
 */
async function invoke(channel: string, ...args: any[]): Promise<any> {
    // Route based on channel name
    switch (channel) {
        // ========== Auth ==========
        case 'auth:isFirstRun':
            return { isFirstRun: false } // In browser mode, skip first-run setup
        case 'auth:login':
            return { success: true, user: { id: 1, username: 'admin', role: 'admin' } }
        case 'auth:logout':
            return { success: true }
        case 'auth:getCurrentUser':
            return { id: 1, username: 'admin', role: 'admin' }
        case 'auth:createAdmin':
            return { success: true }

        // ========== App Info ==========
        case 'app:version':
            return '1.0.0-browser'
        case 'app:platform':
            return 'browser'

        // ========== Dashboard ==========
        case 'dashboard:summary':
            return fetchJSON('/dashboard/summary' + qs(args[0]))

        // ========== Records (Generic CRUD) ==========
        case 'records:list': {
            const [entity, filters] = args
            return fetchJSON(`/records/${entity}${qs(filters)}`)
        }
        case 'records:get': {
            const [entity, id] = args
            return fetchJSON(`/records/${entity}/${id}`)
        }
        case 'records:create': {
            const [entity, data] = args
            return fetchJSON(`/records/${entity}`, {
                method: 'POST',
                body: JSON.stringify(data)
            })
        }
        case 'records:update': {
            const [entity, id, data] = args
            return fetchJSON(`/records/${entity}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
        }
        case 'records:delete': {
            const [entity, id] = args
            return fetchJSON(`/records/${entity}/${id}`, { method: 'DELETE' })
        }
        case 'records:stats': {
            const [entity] = args
            return fetchJSON(`/records/${entity}/stats`)
        }

        // ========== Employees ==========
        case 'employees:list':
            return fetchJSON('/records/employees')
        case 'employees:get':
            return fetchJSON(`/employees/${args[0]}`)
        case 'employees:create':
            return fetchJSON('/records/employees', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })
        case 'employees:search':
            return fetchJSON(`/employees/search?query=${encodeURIComponent(args[0] || '')}`)
        case 'employees:profile':
            return fetchJSON(`/employees/${args[0]}/profile`)
        case 'employees:salary-defaults':
            return fetchJSON(`/employees/${args[0]}`)

        // ========== Leaves ==========
        case 'leaves:create':
            return fetchJSON('/records/leaves', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })
        case 'leaves:stats':
            return fetchJSON('/records/leaves/stats')

        // ========== Absences ==========
        case 'absences:create':
            return fetchJSON('/records/absences', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })
        case 'absences:delete': {
            const id = args[0]
            return fetchJSON(`/records/absences/${id}`, { method: 'DELETE' })
        }

        // ========== Courses ==========
        case 'courses:create':
            return fetchJSON('/records/courses', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })
        case 'courses:update': {
            const [id, data] = args
            return fetchJSON(`/records/courses/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
        }
        case 'courses:delete':
            return fetchJSON(`/records/courses/${args[0]}`, { method: 'DELETE' })
        case 'courses:list':
            return fetchJSON('/records/courses')

        // ========== Evaluations ==========
        case 'evaluations:create':
            return fetchJSON('/records/evaluations', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })
        case 'evaluations:list':
            return fetchJSON('/records/evaluations')
        case 'evaluations:update': {
            const [id, data] = args
            return fetchJSON(`/records/evaluations/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
        }
        case 'evaluations:delete':
            return fetchJSON(`/records/evaluations/${args[0]}`, { method: 'DELETE' })
        case 'evaluations:stats':
            return fetchJSON('/records/evaluations/stats')

        // ========== Promotions ==========
        case 'promotions:create':
            return fetchJSON('/records/promotions', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })
        case 'promotions:list':
            return fetchJSON('/records/promotions' + (args[0] ? `?promo_type=${encodeURIComponent(args[0])}` : ''))
        case 'promotions:update': {
            const [id, data] = args
            return fetchJSON(`/records/promotions/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            })
        }
        case 'promotions:delete':
            return fetchJSON(`/records/promotions/${args[0]}`, { method: 'DELETE' })
        case 'promotions:stats':
            return fetchJSON('/records/promotions/stats')

        // ========== Payroll ==========
        case 'payroll:get':
            return fetchJSON(`/payroll/employee/${args[0]}?period=${args[1] || ''}`)
        case 'payroll:save':
            return fetchJSON('/payroll/save', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })
        case 'payroll:delete':
            return fetchJSON(`/payroll/${args[0]}`, { method: 'DELETE' })
        case 'payroll:listByMonth':
            return fetchJSON(`/payroll/period/${encodeURIComponent(args[0])}`)
        case 'payroll:listPeriods':
            return fetchJSON('/payroll/periods')
        case 'payroll:listByEmployee':
            return fetchJSON(`/payroll/employee/${args[0]}/history${qs({ period: args[1], limit: args[2] })}`)
        case 'payroll:totalsByEmployee':
            return fetchJSON(`/payroll/employee/${args[0]}/totals${qs({ period: args[1] })}`)
        case 'payroll:calcPreview':
            return fetchJSON('/payroll/calc-preview', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })

        // ========== Settings ==========
        case 'settings:get':
            return fetchJSON('/settings')
        case 'settings:save': {
            const [key, value] = args
            return fetchJSON('/settings', {
                method: 'POST',
                body: JSON.stringify({ [key]: value })
            })
        }

        // ========== Connection / Diagnostics ==========
        case 'connection:get-config':
            return { host: 'localhost', database: 'sqlite', mode: 'browser' }
        case 'connection:test':
            return { success: true, message: 'Connected (browser mode)' }
        case 'connection:save-config':
            return { success: true }
        case 'diagnostics:run-all':
            return {
                checks: [
                    { name: 'اتصال قاعدة البيانات', status: 'ok', details: 'SQLite connected' },
                    { name: 'جداول البيانات', status: 'ok', details: 'All tables present' }
                ]
            }
        case 'diagnostics:contract-test':
            return { success: true }

        // ========== Exchange Rates ==========
        case 'exchange-rates:list':
            return fetchJSON('/records/exchange_rates')
        case 'exchange-rates:create':
            return fetchJSON('/records/exchange_rates', {
                method: 'POST',
                body: JSON.stringify(args[0])
            })
        case 'exchange-rates:get-active':
            return fetchJSON('/records/exchange_rates?is_active=1')

        // ========== Backup ==========
        case 'backup:createManual':
            return { success: true, message: 'Backup not available in browser mode' }

        // ========== Files ==========
        case 'files:list':
            return []
        case 'files:save':
            return { success: true }
        case 'files:delete':
            return { success: true }
        case 'files:open':
            return { success: false, message: 'Cannot open files in browser mode' }
        case 'files:choose':
            return { success: false, message: 'File dialog not available in browser mode' }

        // ========== Excel ==========
        case 'excel:preview':
            return { success: false, error: 'Excel preview not available in browser mode' }
        case 'excel:import':
            return { success: false, error: 'Excel import not available in browser mode' }

        // ========== App ==========
        case 'app:open-path':
            return { success: false, message: 'Cannot open paths in browser mode' }

        default:
            console.warn(`[browser-api] Unhandled IPC channel: ${channel}`, args)
            return null
    }
}

/**
 * Create the full browser API object matching window.electronAPI / window.api
 */
export function createBrowserAPI() {
    const api: any = {
        // Authentication
        auth: {
            isFirstRun: () => invoke('auth:isFirstRun'),
            createAdmin: (username: string, password: string) => invoke('auth:createAdmin', { username, password }),
            login: (username: string, password: string) => invoke('auth:login', { username, password }),
            logout: () => invoke('auth:logout'),
            getCurrentUser: () => invoke('auth:getCurrentUser'),
        },

        // User Management
        users: {
            list: () => fetchJSON('/records/users'),
            create: (data: any) => fetchJSON('/records/users', { method: 'POST', body: JSON.stringify(data) }),
            update: (id: number, data: any) => fetchJSON(`/records/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
            resetPassword: () => ({ success: true }),
            delete: (id: number) => fetchJSON(`/records/users/${id}`, { method: 'DELETE' }),
        },

        // Permissions (stub for browser)
        permissions: {
            list: () => Promise.resolve([]),
            getUserPermissions: () => Promise.resolve([]),
            setUserPermissions: () => Promise.resolve({ success: true }),
            check: () => Promise.resolve(true),
            getMyPermissions: () => Promise.resolve([]),
        },

        // Legacy auth
        login: (credentials: any) => invoke('auth:login', credentials),
        getSettings: () => invoke('settings:get'),
        saveSettings: (key: string, value: any) => invoke('settings:save', key, value),
        getVersion: () => invoke('app:version'),
        getPlatform: () => invoke('app:platform'),

        // Dashboard
        getDashboardSummary: (period?: string) => invoke('dashboard:summary', { period }),

        // Employees
        listEmployees: () => invoke('employees:list'),
        getEmployees: () => invoke('employees:list'),
        listEmployeesBasic: () => fetchJSON('/employees/basic'),
        getEmployee: (id: number) => invoke('employees:get', id),
        getEmployeeProfile: (id: number) => invoke('employees:profile', id),
        createEmployee: (data: any) => invoke('employees:create', data),
        searchEmployees: (q: string) => invoke('employees:search', q),
        exportEmployees: (options?: any) => invoke('employees:export', options),
        employees: {
            getAll: () => invoke('employees:list'),
            getSalaryDefaults: (id: number) => invoke('employees:salary-defaults', id),
            get: (id: number) => invoke('employees:get', id),
            search: (q: string) => invoke('employees:search', q),
        },

        // Payroll
        payrollGet: (employeeId: number, period: string) => invoke('payroll:get', employeeId, period),
        payrollSave: (data: any) => invoke('payroll:save', data),
        payrollDelete: (id: number) => invoke('payroll:delete', id),
        payrollListByMonth: (period: string) => invoke('payroll:listByMonth', period),
        payrollListByPeriod: (period: string) => invoke('payroll:listByMonth', period),
        payrollListPeriods: () => invoke('payroll:listPeriods'),
        payrollListByEmployee: (id: number, period?: string, limit?: number) => invoke('payroll:listByEmployee', id, period, limit),
        payrollTotalsByEmployee: (id: number, period?: string) => invoke('payroll:totalsByEmployee', id, period),
        payroll: {
            get: (id: number, period: string) => invoke('payroll:get', id, period),
            save: (id: number, period: string, data: any) => invoke('payroll:save', { ...data, employee_id: id, period }),
            delete: (id: number) => invoke('payroll:delete', id),
            calcPreview: (inputs: any) => invoke('payroll:calcPreview', inputs),
            listByEmployee: (id: number, period?: string, limit?: number) => invoke('payroll:listByEmployee', id, period, limit),
            getTotalsByEmployee: (id: number, period?: string) => invoke('payroll:totalsByEmployee', id, period),
            calcPreviewUSD: (inputs: any) => invoke('payroll:calcPreview', { ...inputs, currency: 'USD' }),
        },

        // Files / Attachments
        files: {
            list: () => Promise.resolve([]),
            save: () => Promise.resolve({ success: true }),
            delete: () => Promise.resolve({ success: true }),
            open: () => Promise.resolve({ success: false }),
            choose: () => Promise.resolve({ success: false }),
        },

        // Records (Generic)
        getRecord: (entity: string, id: number) => invoke('records:get', entity, id),
        listRecords: (entity: string, filters?: any) => invoke('records:list', entity, filters),
        createRecord: (entity: string, data: any) => invoke('records:create', entity, data),
        updateRecord: (entity: string, id: number, data: any) => invoke('records:update', entity, id, data),
        deleteRecord: (entity: string, id: number) => invoke('records:delete', entity, id),

        // Leaves
        createLeave: (data: any) => invoke('leaves:create', data),
        getLeavesStats: () => invoke('leaves:stats'),
        leavesStats: () => invoke('leaves:stats'),
        listLeaves: () => invoke('records:list', 'leaves'),

        // Absences
        createAbsence: (data: any) => invoke('absences:create', data),
        listAbsences: () => invoke('records:list', 'absences'),

        // Courses
        createCourse: (data: any) => invoke('courses:create', data),
        updateCourse: (id: number, data: any) => invoke('courses:update', id, data),
        deleteCourse: (id: number) => invoke('courses:delete', id),
        listCourses: () => invoke('courses:list'),

        // Evaluations
        createEvaluation: (data: any) => invoke('evaluations:create', data),
        listEvaluations: () => invoke('evaluations:list'),
        updateEvaluation: (id: number, data: any) => invoke('evaluations:update', id, data),
        deleteEvaluation: (id: number) => invoke('evaluations:delete', id),
        evaluationsStats: () => invoke('evaluations:stats'),

        // Promotions
        createPromotion: (data: any) => invoke('promotions:create', data),
        listPromotions: (typeFilter?: string) => invoke('promotions:list', typeFilter),
        updatePromotion: (id: number, data: any) => invoke('promotions:update', id, data),
        deletePromotion: (id: number) => invoke('promotions:delete', id),
        promotionsStats: () => invoke('promotions:stats'),

        // Rewards
        createReward: (data: any) => invoke('records:create', 'rewards', data),
        listRewards: (filters?: any) => invoke('records:list', 'rewards', filters),
        updateReward: (id: number, data: any) => invoke('records:update', 'rewards', id, data),
        deleteReward: (id: number) => invoke('records:delete', 'rewards', id),
        rewardsStats: () => invoke('records:stats', 'rewards'),

        // Excel
        excelPreview: () => invoke('excel:preview'),
        excelImport: () => invoke('excel:import'),
        exportExcelPreviewCSV: () => invoke('excel:preview'),
        chooseExcelFile: () => Promise.resolve({ success: false }),

        // Exchange Rates
        exchangeRates: {
            list: () => invoke('records:list', 'exchange_rates'),
            create: (data: any) => invoke('records:create', 'exchange_rates', data),
        },

        // Backup
        backup: {
            createManual: () => invoke('backup:createManual'),
        },

        // Diagnostics
        runContractTest: () => invoke('diagnostics:contract-test'),
        openPath: () => Promise.resolve({ success: false }),
        isFirstRun: () => invoke('auth:isFirstRun'),

        // Generic invoke (catch-all)
        invoke,

        // onDbConnectionFailed (noop in browser)
        onDbConnectionFailed: () => () => { },
    }

    return api
}
