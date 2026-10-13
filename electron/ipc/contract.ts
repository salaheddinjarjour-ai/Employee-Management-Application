export const IPC_CHANNELS = {
    // Employees
    EMPLOYEES: {
        LIST: 'employees:list',
        GET: 'employees:get',
        CREATE: 'employees:create',
        UPDATE: 'employees:update',
        DELETE: 'employees:delete',
        PROFILE: 'employees:profile',
        SEARCH: 'employees:search', // Added based on preload
    },

    // Payroll
    PAYROLL: {
        GET: 'payroll:get',
        SAVE: 'payroll:save',
        LIST_BY_MONTH: 'payroll:listByMonth',
        LIST_PERIODS: 'payroll:listPeriods',
        LIST_BY_EMPLOYEE: 'payroll:listByEmployee',
    },

    // Records (Generic & Specific)
    RECORDS: {
        LIST: 'records:list', // Generic list
        GET: 'records:get',
        CREATE: 'records:create', // Generic create (fallback)
        UPDATE: 'records:update',
        DELETE: 'records:delete',
    },

    // Leaves
    LEAVES: {
        CREATE: 'leaves:create',
        STATS: 'leaves:stats',
    },

    // Absences
    ABSENCES: {
        CREATE: 'absences:create',
    },

    // Courses
    COURSES: {
        CREATE: 'courses:create',
        UPDATE: 'courses:update',
        DELETE: 'courses:delete',
        LIST: 'courses:list', // Implemented
    },

    // Evaluations
    EVALUATIONS: {
        CREATE: 'evaluations:create',
        LIST: 'evaluations:list',
        UPDATE: 'evaluations:update',
        DELETE: 'evaluations:delete',
    },

    // Promotions
    PROMOTIONS: {
        CREATE: 'promotions:create',
        LIST: 'promotions:list',
        UPDATE: 'promotions:update',
        DELETE: 'promotions:delete',
    },

    // Dashboard
    DASHBOARD: {
        SUMMARY: 'dashboard:summary',
    },

    // Settings
    SETTINGS: {
        GET: 'settings:get',
        SAVE: 'settings:save',
    },

    // System
    APP: {
        VERSION: 'app:version',
        PLATFORM: 'app:platform',
    }
} as const;
