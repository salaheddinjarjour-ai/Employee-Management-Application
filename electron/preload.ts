import { contextBridge, ipcRenderer } from 'electron'

// Define the API implementation strictly adhering to the contract
const electronAPI = {
    // Authentication
    auth: {
        isFirstRun: () => ipcRenderer.invoke('auth:isFirstRun'),
        createAdmin: (username: string, password: string) => ipcRenderer.invoke('auth:createAdmin', { username, password }),
        login: (username: string, password: string) => ipcRenderer.invoke('auth:login', { username, password }),
        logout: () => ipcRenderer.invoke('auth:logout'),
        getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    },

    // User Management (Admin only)
    users: {
        list: () => ipcRenderer.invoke('users:list'),
        create: (data: any) => ipcRenderer.invoke('users:create', data),
        update: (id: number, data: any) => ipcRenderer.invoke('users:update', { id, ...data }),
        resetPassword: (id: number, newPassword: string) => ipcRenderer.invoke('users:resetPassword', { id, newPassword }),
        delete: (id: number) => ipcRenderer.invoke('users:delete', { id }),
    },

    // Permissions
    permissions: {
        list: () => ipcRenderer.invoke('permissions:list'),
        getUserPermissions: (userId: number) => ipcRenderer.invoke('permissions:getUserPermissions', { userId }),
        setUserPermissions: (userId: number, permissionIds: number[]) => ipcRenderer.invoke('permissions:setUserPermissions', { userId, permissionIds }),
        check: (pageKey: string, action: string) => ipcRenderer.invoke('permissions:check', { pageKey, action }),
        getMyPermissions: () => ipcRenderer.invoke('permissions:getMyPermissions'),
    },

    // Legacy auth (for compatibility)
    login: (credentials: any) => ipcRenderer.invoke('auth:login', credentials),
    getSettings: (key?: string) => ipcRenderer.invoke('settings:get', key),
    saveSettings: (key: string, value: any) => ipcRenderer.invoke('settings:save', key, value),
    getVersion: () => ipcRenderer.invoke('app:version'),
    getPlatform: () => ipcRenderer.invoke('app:platform'),

    // Dashboard
    getDashboardSummary: (period?: string) => ipcRenderer.invoke('dashboard:summary', { period }),

    // Employees
    listEmployees: () => ipcRenderer.invoke('employees:list'),
    getEmployees: () => ipcRenderer.invoke('employees:list'), // Alias
    listEmployeesBasic: () => ipcRenderer.invoke('employees:list', { basic: true }),
    getEmployee: (id: number) => ipcRenderer.invoke('employees:get', id),
    getEmployeeProfile: (id: number) => ipcRenderer.invoke('employees:profile', id),
    createEmployee: (data: any) => ipcRenderer.invoke('employees:create', data),
    searchEmployees: (query: string) => ipcRenderer.invoke('employees:search', query),
    exportEmployees: (filters?: any) => ipcRenderer.invoke('employees:export', filters),
    employees: {
        getAll: () => ipcRenderer.invoke('employees:list'),
        getSalaryDefaults: (id: number) => ipcRenderer.invoke('employees:salary-defaults', id),
        get: (id: number) => ipcRenderer.invoke('employees:get', id),
        search: (query: string) => ipcRenderer.invoke('employees:search', query)
    },

    // Payroll
    payrollGet: (employeeId: number, period: string) => ipcRenderer.invoke('payroll:get', employeeId, period),
    payrollSave: (data: any) => ipcRenderer.invoke('payroll:save', data),
    payrollDelete: (id: number) => ipcRenderer.invoke('payroll:delete', id),
    payrollListByMonth: (period: string) => ipcRenderer.invoke('payroll:listByMonth', period),
    payrollListByPeriod: (period: string) => ipcRenderer.invoke('payroll:listByMonth', period),
    payrollListPeriods: () => ipcRenderer.invoke('payroll:listPeriods'),
    payrollListByEmployee: (id: number, period?: string, limit?: number) => ipcRenderer.invoke('payroll:listByEmployee', id, period, limit),
    payrollTotalsByEmployee: (id: number, period?: string) => ipcRenderer.invoke('payroll:totalsByEmployee', id, period),
    payroll: {
        get: (id: number, period: string) => ipcRenderer.invoke('payroll:get', id, period),
        save: (id: number, period: string, data: any) => ipcRenderer.invoke('payroll:save', { ...data, employee_id: id, period }),
        delete: (id: number) => ipcRenderer.invoke('payroll:delete', id),
        calcPreview: (inputs: any) => ipcRenderer.invoke('payroll:calcPreview', inputs),
        listByEmployee: (id: number, period?: string, limit?: number) => ipcRenderer.invoke('payroll:listByEmployee', id, period, limit),
        getTotalsByEmployee: (id: number, period?: string) => ipcRenderer.invoke('payroll:totalsByEmployee', id, period),
        calcPreviewUSD: (inputs: any) => ipcRenderer.invoke('payroll:calcPreview', { ...inputs, currency: 'USD' }),
    },

    // Files / Attachments
    files: {
        list: (entityType: string, entityId: number) => ipcRenderer.invoke('files:list', entityType, entityId),
        save: (data: any) => ipcRenderer.invoke('files:save', data),
        delete: (id: number) => ipcRenderer.invoke('files:delete', id),
        open: (id: number) => ipcRenderer.invoke('files:open', id),
        choose: () => ipcRenderer.invoke('files:choose'), // Open dialog
    },

    // Records (Generic)
    getRecord: (entity: string, id: number) => ipcRenderer.invoke('records:get', entity, id),
    listRecords: (entity: string, filters?: any) => ipcRenderer.invoke('records:list', entity, filters),
    createRecord: (entity: string, data: any) => ipcRenderer.invoke('records:create', entity, data),
    updateRecord: (entity: string, id: number, data: any) => ipcRenderer.invoke('records:update', entity, id, data),
    deleteRecord: (entity: string, id: number) => ipcRenderer.invoke('records:delete', entity, id),

    // Leaves
    createLeave: (data: any) => ipcRenderer.invoke('leaves:create', data),
    getLeavesStats: () => ipcRenderer.invoke('leaves:stats'),
    leavesStats: () => ipcRenderer.invoke('leaves:stats'),
    listLeaves: () => ipcRenderer.invoke('records:list', 'leaves'),

    // Absences
    createAbsence: (data: any) => ipcRenderer.invoke('absences:create', data),
    listAbsences: () => ipcRenderer.invoke('records:list', 'absences'),
    listAbsenceTypes: () => ipcRenderer.invoke('absences:list-types'),
    createAbsenceType: (data: any) => ipcRenderer.invoke('absences:create-type', data),
    deleteAbsenceType: (id: number) => ipcRenderer.invoke('absences:delete-type', id),

    // Courses
    createCourse: (data: any) => ipcRenderer.invoke('courses:create', data),
    updateCourse: (id: number, data: any) => ipcRenderer.invoke('courses:update', id, data),
    deleteCourse: (id: number) => ipcRenderer.invoke('courses:delete', id),
    listCourses: () => ipcRenderer.invoke('courses:list'),

    // Evaluations
    createEvaluation: (data: any) => ipcRenderer.invoke('evaluations:create', data),
    listEvaluations: () => ipcRenderer.invoke('evaluations:list'),
    updateEvaluation: (id: number, data: any) => ipcRenderer.invoke('evaluations:update', id, data),
    deleteEvaluation: (id: number) => ipcRenderer.invoke('evaluations:delete', id),
    evaluationsStats: () => ipcRenderer.invoke('evaluations:stats'),

    // Promotions
    createPromotion: (data: any) => ipcRenderer.invoke('promotions:create', data),
    listPromotions: (typeFilter?: string) => ipcRenderer.invoke('promotions:list', typeFilter),
    updatePromotion: (id: number, data: any) => ipcRenderer.invoke('promotions:update', id, data),
    deletePromotion: (id: number) => ipcRenderer.invoke('promotions:delete', id),
    promotionsStats: () => ipcRenderer.invoke('promotions:stats'),

    // Rewards
    createReward: (data: any) => ipcRenderer.invoke('records:create', 'rewards', data),
    listRewards: (filters?: any) => ipcRenderer.invoke('records:list', 'rewards', filters),
    updateReward: (id: number, data: any) => ipcRenderer.invoke('records:update', 'rewards', id, data),
    deleteReward: (id: number) => ipcRenderer.invoke('records:delete', 'rewards', id),
    rewardsStats: () => ipcRenderer.invoke('records:stats', 'rewards'),
    listRewardTypes: () => ipcRenderer.invoke('rewards:list-types'),
    createRewardType: (data: any) => ipcRenderer.invoke('rewards:create-type', data),
    deleteRewardType: (id: number) => ipcRenderer.invoke('rewards:delete-type', id),
    listRewardStatuses: () => ipcRenderer.invoke('rewards:list-statuses'),
    createRewardStatus: (data: any) => ipcRenderer.invoke('rewards:create-status', data),
    deleteRewardStatus: (id: number) => ipcRenderer.invoke('rewards:delete-status', id),
    rewardSyncToPayroll: (id: number) => ipcRenderer.invoke('rewards:sync-to-payroll', id),

    // Excel
    excelPreview: (file: any) => ipcRenderer.invoke('excel:preview', file.path || file),
    excelImport: (file: any, options: any) => ipcRenderer.invoke('excel:import', file.path || file, options),
    exportExcelPreviewCSV: (filePath: string) => ipcRenderer.invoke('excel:export-preview-csv', filePath),

    // Exchange Rates
    exchangeRates: {
        list: () => ipcRenderer.invoke('records:list', 'exchange_rates'),
        create: (data: any) => ipcRenderer.invoke('records:create', 'exchange_rates', data),
    },

    // Backup
    backup: {
        createManual: () => ipcRenderer.invoke('backup:createManual'),
    },

    // Diagnostics
    runContractTest: () => ipcRenderer.invoke('diagnostics:contract-test'),
    openPath: (path: string) => ipcRenderer.invoke('app:open-path', path),
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
}

// Support both 'electronAPI' and 'api' for maximum compatibility
try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
    contextBridge.exposeInMainWorld('api', electronAPI)
    console.log('Preload initialized with nested API objects')
} catch (error) {
    console.error('Preload exposure failed:', error)
}
