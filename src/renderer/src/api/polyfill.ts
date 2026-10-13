
import { fetchApi, uploadApi } from './client';

// In-memory store for entities without backend tables (persists during browser session)
const memoryStore: Record<string, any[]> = {
    'operational-plans': [],
    'performance-indicators': []
};
let nextId = 1;
function memCrud(entity: string, action: string, ...a: any[]) {
    const store = memoryStore[entity];
    if (!store) return null;
    switch (action) {
        case 'list': return [...store];
        case 'create': { const item = { id: nextId++, ...a[0], created_at: new Date().toISOString() }; store.push(item); return item; }
        case 'update': { const idx = store.findIndex(x => x.id === a[0]); if (idx >= 0) { store[idx] = { ...store[idx], ...a[1] }; return store[idx]; } return null; }
        case 'delete': { const i = store.findIndex(x => x.id === a[0]); if (i >= 0) store.splice(i, 1); return { success: true }; }
        case 'get': return store.find(x => x.id === a[0]) || null;
        default: return null;
    }
}

// Helper to construct query string
const toQuery = (params: any) => {
    if (!params) return '';
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.append(key, String(value));
    });
    const str = query.toString();
    return str ? '?' + str : '';
};

export const api: any = {
    // ========== Auth ==========
    auth: {
        isFirstRun: () => Promise.resolve({ isFirstRun: false }),
        createAdmin: () => Promise.resolve({ success: true }),
        login: () => Promise.resolve({ success: true, user: { id: 1, username: 'admin', is_admin: true } }),
        logout: () => Promise.resolve({ success: true }),
        getCurrentUser: () => Promise.resolve({ user: { id: 1, username: 'admin', is_admin: true } }),
    },

    // ========== App Info ==========
    getVersion: () => Promise.resolve('1.0.0-browser'),
    getPlatform: () => Promise.resolve('browser'),
    isFirstRun: () => Promise.resolve({ isFirstRun: false }),

    // ========== Generic Record Operations ==========
    createRecord: (entity: string, payload: any) => fetchApi(`/records/${entity}`, { method: 'POST', body: JSON.stringify(payload) }),
    listRecords: (entity: string, filters?: any) => fetchApi(`/records/${entity}${toQuery(filters)}`),
    deleteRecord: (entity: string, id: number) => fetchApi(`/records/${entity}/${id}`, { method: 'DELETE' }),
    updateRecord: (entity: string, id: number, payload: any) => fetchApi(`/records/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    getRecord: (entity: string, id: number) => fetchApi(`/records/${entity}/${id}`),

    // ========== Dashboard ==========
    getDashboardSummary: (period?: string) => fetchApi(`/dashboard/summary${toQuery({ period })}`),

    // ========== Employees ==========
    listEmployeesBasic: () => fetchApi('/employees/basic'),
    listEmployees: () => fetchApi('/records/employees'),
    getEmployees: () => fetchApi('/records/employees'),
    getEmployee: (id: number) => fetchApi(`/employees/${id}`),
    getEmployeeProfile: (id: number) => fetchApi(`/employees/${id}/profile`),
    createEmployee: (data: any) => fetchApi('/records/employees', { method: 'POST', body: JSON.stringify(data) }),
    searchEmployees: (query: string, limit?: number) => fetchApi(`/employees/search${toQuery({ query, limit })}`),
    employees: {
        getAll: () => fetchApi('/records/employees'),
        getSalaryDefaults: (id: number) => fetchApi(`/employees/${id}`),
        get: (id: number) => fetchApi(`/employees/${id}`),
        search: (q: string) => fetchApi(`/employees/search?query=${encodeURIComponent(q || '')}`),
    },

    // ========== Payroll ==========
    payroll: {
        get: (_employee_id: number, _month: string) => fetchApi(`/payroll/${_employee_id}/${_month}`),
        calcPreview: (_inputs: any) => Promise.resolve({ usd: {}, try: {}, rate: 34 }),
        calcPreviewUSD: (_inputs: any) => Promise.resolve({ usd: {}, try: {}, rate: 34 }),
        save: (_employee_id: number, _month: string, inputs: any) => fetchApi('/payroll', { method: 'POST', body: JSON.stringify(inputs) }),
        listByMonth: (month: string) => fetchApi(`/payroll${toQuery({ period: month })}`),
        getAvailableMonths: () => fetchApi('/payroll/available-months'),
        getEmployeeHistory: (employee_id: number) => fetchApi(`/payroll/history/${employee_id}`),
        deleteMonth: (month: string) => fetchApi(`/excel/month/${month}`, { method: 'DELETE' }),
        updateStatus: () => Promise.resolve(),
        delete: (_id: number) => fetchApi(`/payroll/${_id}`, { method: 'DELETE' }),
        getMonthSummary: (month: string) => fetchApi(`/payroll/summary/${month}`),
        listByEmployee: (id: number, period?: string, limit?: number) => fetchApi(`/payroll/history/${id}${toQuery({ period, limit })}`),
        getTotalsByEmployee: (id: number, period?: string) => fetchApi(`/payroll/totals/${id}${toQuery({ period })}`),
    },
    payrollSave: (payload: any) => fetchApi('/payroll', { method: 'POST', body: JSON.stringify(payload) }),
    payrollListByEmployee: (employeeId: number, period?: string, limit?: number) => fetchApi(`/payroll/history/${employeeId}${toQuery({ period, limit })}`),
    payrollTotalsByEmployee: (employeeId: number, period?: string) => fetchApi(`/payroll/totals/${employeeId}${toQuery({ period })}`),
    payrollListPeriods: () => fetchApi('/payroll/available-months'),
    payrollListByPeriod: (period: string) => fetchApi(`/payroll${toQuery({ period })}`),
    payrollGet: (employeeId: number, period: string) => fetchApi(`/payroll/${employeeId}/${period}`),
    payrollDelete: (id: number) => fetchApi(`/payroll/${id}`, { method: 'DELETE' }),
    payrollListByMonth: (period: string) => fetchApi(`/payroll${toQuery({ period })}`),

    // ========== Leaves ==========
    listLeaves: () => fetchApi('/records/leaves'),
    leavesStats: () => fetchApi('/records/leaves/stats'),
    getLeavesStats: () => fetchApi('/records/leaves/stats'),
    createLeave: (data: any) => fetchApi('/records/leaves', { method: 'POST', body: JSON.stringify(data) }),

    // ========== Absences ==========
    listAbsences: () => fetchApi('/records/absences'),
    createAbsence: (data: any) => fetchApi('/records/absences', { method: 'POST', body: JSON.stringify(data) }),

    // ========== Evaluations ==========
    listEvaluations: () => fetchApi('/records/evaluations'),
    createEvaluation: (data: any) => fetchApi('/records/evaluations', { method: 'POST', body: JSON.stringify(data) }),
    updateEvaluation: (id: number, data: any) => fetchApi(`/records/evaluations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEvaluation: (id: number) => fetchApi(`/records/evaluations/${id}`, { method: 'DELETE' }),
    evaluationsStats: () => fetchApi('/records/evaluations/stats'),

    // ========== Promotions ==========
    listPromotions: () => fetchApi('/records/promotions'),
    getPromotions: () => fetchApi('/records/promotions'),
    createPromotion: (data: any) => fetchApi('/records/promotions', { method: 'POST', body: JSON.stringify(data) }),
    updatePromotion: (id: number, data: any) => fetchApi(`/records/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePromotion: (id: number) => fetchApi(`/records/promotions/${id}`, { method: 'DELETE' }),
    promotionsStats: () => fetchApi('/records/promotions/stats'),

    // ========== Courses ==========
    createCourse: (data: any) => fetchApi('/records/courses', { method: 'POST', body: JSON.stringify(data) }),
    updateCourse: (id: number, data: any) => fetchApi(`/records/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCourse: (id: number) => fetchApi(`/records/courses/${id}`, { method: 'DELETE' }),
    removeCourseAttachment: (path: string) => fetchApi('/files/remove', { method: 'POST', body: JSON.stringify({ path }) }),

    // ========== Rewards ==========
    listRewards: (filters?: any) => fetchApi(`/records/rewards${toQuery(filters)}`),
    createReward: (data: any) => fetchApi('/records/rewards', { method: 'POST', body: JSON.stringify(data) }),
    updateReward: (id: number, data: any) => fetchApi(`/records/rewards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteReward: (id: number) => fetchApi(`/records/rewards/${id}`, { method: 'DELETE' }),
    rewardsStats: () => fetchApi('/records/rewards/stats'),

    // ========== Exchange Rates ==========
    exchangeRates: {
        list: () => fetchApi('/records/exchange_rates'),
        create: (data: any) => fetchApi('/records/exchange_rates', { method: 'POST', body: JSON.stringify(data) }),
    },

    // ========== Settings ==========
    getSettings: () => fetchApi('/settings'),
    saveSettings: (key: string, value: any) => fetchApi('/settings', { method: 'POST', body: JSON.stringify({ [key]: value }) }),
    login: (credentials: any) => Promise.resolve({ success: true, user: { id: 1, username: 'admin', is_admin: true } }),

    // ========== Users & Permissions ==========
    users: {
        list: () => fetchApi('/records/users'),
        create: (data: any) => fetchApi('/records/users', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) => fetchApi(`/records/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        resetPassword: () => Promise.resolve({ success: true }),
        ['delete']: (id: number) => fetchApi(`/records/users/${id}`, { method: 'DELETE' }),
    },
    permissions: {
        list: () => Promise.resolve([]),
        getUserPermissions: () => Promise.resolve([]),
        setUserPermissions: () => Promise.resolve({ success: true }),
        check: () => Promise.resolve(true),
        getMyPermissions: () => Promise.resolve([]),
    },

    // ========== DB Helpers ==========
    db: {
        employees: {
            findAll: () => fetchApi('/records/employees'),
            findById: (id: number) => fetchApi(`/records/employees/${id}`)
        },
        exchangeRates: {
            getActive: () => fetchApi('/records/exchange_rates?is_active=1').then((res: any) => ({ success: true, data: res[0] })),
            getHistory: () => fetchApi('/records/exchange_rates')
        }
    },

    // ========== Files ==========
    files: {
        list: (entityType: string, entityId: number) => fetchApi(`/files/${entityType}/${entityId}`),
        save: (_entityType: string, _entityId: number, _fileName: string, data: any) => {
            if (data instanceof File) {
                return uploadApi('/files/course', data);
            }
            return Promise.resolve({ success: false, error: "Not implemented for non-File data" });
        },
        open: () => Promise.resolve({ success: false }),
        choose: () => Promise.resolve({ success: false }),
        ['delete']: () => Promise.resolve({ success: true }),
    },

    // ========== Excel ==========
    chooseExcelFile: () => Promise.resolve({ success: false, error: "Use web file picker" }),
    excelPreview: (fileOrPath: any) => {
        if (fileOrPath instanceof File) {
            return uploadApi('/excel/preview', fileOrPath);
        }
        return Promise.resolve({ success: false, error: "Preview requires file object" });
    },
    excelImport: (fileOrPath: any, options: any) => {
        if (fileOrPath instanceof File) {
            return uploadApi('/excel/import', fileOrPath, options);
        }
        return Promise.resolve({ success: false, error: "Import requires file object" });
    },

    // ========== Backup ==========
    backup: {
        createManual: () => Promise.resolve({ success: true }),
    },

    // ========== Events & Callbacks ==========
    events: {
        on: (event: string) => {
            console.log(`[Polyfill] Event listener added for ${event}`);
            return () => { };
        },
        emit: (event: string, payload: any) => console.log(`[Polyfill] Event emitted: ${event}`, payload),
        off: () => { }
    },
    onDbConnectionFailed: () => () => { },

    // ========== Diagnostics ==========
    runContractTest: () => Promise.resolve({ success: true }),
    openPath: () => Promise.resolve({ success: false }),

    // ========== Generic Invoke (catch-all) ==========
    invoke: (channel: string, ...args: any[]) => {
        console.log(`[Polyfill] Invoke: ${channel}`, args);

        // Auth
        if (channel === 'auth:isFirstRun') return Promise.resolve({ isFirstRun: false });
        if (channel === 'auth:login') return Promise.resolve({ success: true, user: { id: 1, username: 'admin', is_admin: true } });
        if (channel === 'auth:logout') return Promise.resolve({ success: true });
        if (channel === 'auth:getCurrentUser') return Promise.resolve({ user: { id: 1, username: 'admin', is_admin: true } });
        if (channel === 'auth:createAdmin') return Promise.resolve({ success: true });

        // App info
        if (channel === 'app:version') return Promise.resolve('1.0.0-browser');
        if (channel === 'app:platform') return Promise.resolve('browser');

        // Dashboard
        if (channel === 'dashboard:summary') return api.getDashboardSummary(args[0]?.period);

        // Records CRUD — intercept entities with in-memory storage
        const stubEntities = ['operational-plans', 'performance-indicators'];
        if (channel === 'records:list' && stubEntities.includes(args[0])) return Promise.resolve(memCrud(args[0], 'list'));
        if (channel === 'records:create' && stubEntities.includes(args[0])) return Promise.resolve(memCrud(args[0], 'create', args[1]));
        if (channel === 'records:update' && stubEntities.includes(args[0])) return Promise.resolve(memCrud(args[0], 'update', args[1], args[2]));
        if (channel === 'records:delete' && stubEntities.includes(args[0])) return Promise.resolve(memCrud(args[0], 'delete', args[1]));
        if (channel === 'records:stats' && stubEntities.includes(args[0])) return Promise.resolve({ total: memoryStore[args[0]]?.length || 0 });

        // Records CRUD — generic
        if (channel === 'records:list') return fetchApi(`/records/${args[0]}${toQuery(args[1])}`);
        if (channel === 'records:get') return fetchApi(`/records/${args[0]}/${args[1]}`);
        if (channel === 'records:create') return fetchApi(`/records/${args[0]}`, { method: 'POST', body: JSON.stringify(args[1]) });
        if (channel === 'records:update') return fetchApi(`/records/${args[0]}/${args[1]}`, { method: 'PUT', body: JSON.stringify(args[2]) });
        if (channel === 'records:delete') return fetchApi(`/records/${args[0]}/${args[1]}`, { method: 'DELETE' });
        if (channel === 'records:stats') return fetchApi(`/records/${args[0]}/stats`);

        // Employees
        if (channel === 'employees:list') return fetchApi('/records/employees');
        if (channel === 'employees:get') return fetchApi(`/employees/${args[0]}`);
        if (channel === 'employees:create') return fetchApi('/records/employees', { method: 'POST', body: JSON.stringify(args[0]) });
        if (channel === 'employees:search') return fetchApi(`/employees/search?query=${encodeURIComponent(args[0] || '')}`);
        if (channel === 'employees:profile') return fetchApi(`/employees/${args[0]}/profile`);
        if (channel === 'employees:salary-defaults') return fetchApi(`/employees/${args[0]}`);

        // Leaves
        if (channel === 'leaves:list') return fetchApi('/records/leaves');
        if (channel === 'leaves:create') return fetchApi('/records/leaves', { method: 'POST', body: JSON.stringify(args[0]) });
        if (channel === 'leaves:update') return fetchApi(`/records/leaves/${args[0]?.id || args[0]}`, { method: 'PUT', body: JSON.stringify(args[0]) });
        if (channel === 'leaves:stats') return api.leavesStats();

        // Absences
        if (channel === 'absences:create') return fetchApi('/records/absences', { method: 'POST', body: JSON.stringify(args[0]) });
        if (channel === 'absences:delete') return fetchApi(`/records/absences/${args[0]}`, { method: 'DELETE' });

        // Courses
        if (channel === 'courses:list') return fetchApi('/records/courses');
        if (channel === 'courses:create') return fetchApi('/records/courses', { method: 'POST', body: JSON.stringify(args[0]) });
        if (channel === 'courses:update') return fetchApi(`/records/courses/${args[0]}`, { method: 'PUT', body: JSON.stringify(args[1]) });
        if (channel === 'courses:delete') return fetchApi(`/records/courses/${args[0]}`, { method: 'DELETE' });

        // Evaluations
        if (channel === 'evaluations:list') return api.listEvaluations();
        if (channel === 'evaluations:create') return api.createEvaluation(args[0]);
        if (channel === 'evaluations:update') return api.updateEvaluation(args[0], args[1]);
        if (channel === 'evaluations:delete') return api.deleteEvaluation(args[0]);
        if (channel === 'evaluations:stats') return api.evaluationsStats();

        // Promotions
        if (channel === 'promotions:list') return api.listPromotions();
        if (channel === 'promotions:create') return api.createPromotion(args[0]);
        if (channel === 'promotions:update') return api.updatePromotion(args[0], args[1]);
        if (channel === 'promotions:delete') return api.deletePromotion(args[0]);
        if (channel === 'promotions:stats') return api.promotionsStats();

        // Payroll
        if (channel === 'payroll:get') return fetchApi(`/payroll/${args[0]}/${args[1]}`);
        if (channel === 'payroll:save') return api.payrollSave(args[0]);
        if (channel === 'payroll:delete') return fetchApi(`/payroll/${args[0]}`, { method: 'DELETE' });
        if (channel === 'payroll:listByMonth') return fetchApi(`/payroll${toQuery({ period: args[0] })}`);
        if (channel === 'payroll:listPeriods') return api.payrollListPeriods();
        if (channel === 'payroll:listByEmployee') return api.payrollListByEmployee(args[0], args[1], args[2]);
        if (channel === 'payroll:totalsByEmployee') return api.payrollTotalsByEmployee(args[0], args[1]);
        if (channel === 'payroll:calcPreview') return Promise.resolve({ usd: {}, try: {}, rate: 34 });

        // Settings
        if (channel === 'settings:get') return fetchApi('/settings');
        if (channel === 'settings:save') return fetchApi('/settings', { method: 'POST', body: JSON.stringify({ [args[0]]: args[1] }) });

        // Connection / Diagnostics
        if (channel === 'connection:get-config') return Promise.resolve({ host: 'localhost', database: 'sqlite', mode: 'browser' });
        if (channel === 'connection:test') return Promise.resolve({ success: true, message: 'Connected (browser mode)' });
        if (channel === 'connection:save-config') return Promise.resolve({ success: true });
        if (channel === 'diagnostics:run-all') return Promise.resolve({ checks: [{ name: 'اتصال قاعدة البيانات', status: 'ok' }] });
        if (channel === 'diagnostics:contract-test') return Promise.resolve({ success: true });
        if (channel === 'diagnostics:schema') return Promise.resolve({ ok: true });

        // Exchange Rates
        if (channel === 'exchange-rates:list') return fetchApi('/records/exchange_rates');
        if (channel === 'exchange-rates:create') return fetchApi('/records/exchange_rates', { method: 'POST', body: JSON.stringify(args[0]) });
        if (channel === 'exchange-rates:get-active') return fetchApi('/records/exchange_rates?is_active=1');
        if (channel === 'exchange-rates:history') return fetchApi('/records/exchange_rates');

        // Absences
        if (channel === 'absences:list') return fetchApi('/records/absences');
        if (channel === 'absences:create') return fetchApi('/records/absences', { method: 'POST', body: JSON.stringify(args[0]) });
        if (channel === 'absences:update') return fetchApi(`/records/absences/${args[0]}`, { method: 'PUT', body: JSON.stringify(args[1]) });
        if (channel === 'absences:delete') return fetchApi(`/records/absences/${args[0]}`, { method: 'DELETE' });
        if (channel === 'absences:stats') return fetchApi('/records/absences/stats');

        // Reports
        if (channel === 'reports:recent') return Promise.resolve([]);
        if (channel === 'reports:generate') return Promise.resolve({ success: true, data: [] });

        // Operational Plans & KPIs (in-memory storage)
        if (channel === 'operational-plans:getAll') return Promise.resolve(memCrud('operational-plans', 'list'));
        if (channel === 'operational-plans:create') return Promise.resolve(memCrud('operational-plans', 'create', args[0]));
        if (channel === 'operational-plans:update') return Promise.resolve(memCrud('operational-plans', 'update', args[0], args[1]));
        if (channel === 'operational-plans:delete') return Promise.resolve(memCrud('operational-plans', 'delete', args[0]));
        if (channel === 'performance-indicators:getAll') return Promise.resolve(memCrud('performance-indicators', 'list'));
        if (channel === 'performance-indicators:create') return Promise.resolve(memCrud('performance-indicators', 'create', args[0]));
        if (channel === 'performance-indicators:update') return Promise.resolve(memCrud('performance-indicators', 'update', args[0], args[1]));
        if (channel === 'performance-indicators:delete') return Promise.resolve(memCrud('performance-indicators', 'delete', args[0]));

        // Backup
        if (channel === 'backup:createManual') return Promise.resolve({ success: true, message: 'Not available in browser mode' });

        // App
        if (channel === 'app:open-path') return Promise.resolve({ success: false });

        console.warn(`[Polyfill] Unhandled channel: ${channel}`, args);
        return Promise.resolve(null);
    },
};

// Initialize
// Only apply polyfill if we are NOT in Electron (i.e. if electronAPI is missing)
// In Electron, preload.ts sets these up before this code runs.
if (!(window as any).electronAPI) {
    console.log('[Polyfill] Initializing web polyfill');
    (window as any).electronAPI = api;
    (window as any).api = api;
    (window as any).events = api.events;
} else {
    console.log('[Polyfill] Electron environment detected, skipping polyfill');
}
