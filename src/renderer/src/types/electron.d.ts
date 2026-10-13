import { Attachment, Employee, ExchangeRate, EntityType } from '@/db/types'

export interface ElectronAPI {
  // App information
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>

  // Authentication
  auth: {
    isFirstRun: () => Promise<{ isFirstRun: boolean }>
    createAdmin: (username: string, password: string) => Promise<any>
    login: (username: string, password: string) => Promise<any>
    logout: () => Promise<any>
    getCurrentUser: () => Promise<any>
  }

  // Database operations
  createRecord: (entity: string, payload: any) => Promise<{ id: number }>
  listRecords: (entity: string, filters?: any) => Promise<any[]>
  deleteRecord: (entity: string, id: number) => Promise<number>
  updateRecord: (entity: string, id: number, payload: any) => Promise<number>
  getRecord: (entity: string, id: number) => Promise<any>

  // Excel operations
  excelPreview: (fileOrPath: File | string) => Promise<{ success: boolean; data?: any; error?: string }>
  excelImport: (fileOrPath: File | string, options?: any) => Promise<{ success: boolean; data?: any; error?: string }>
  exportExcelPreviewCSV: (filePath: string) => Promise<{ success: boolean; path?: string; error?: string }>
  chooseExcelFile: () => Promise<{ success: boolean; filePath?: string; error?: string }>

  // Payroll operations
  payrollListPeriods: () => Promise<string[]>
  payrollListByPeriod: (period: string) => Promise<any[]>
  payrollListByEmployee: (employeeId: number, period?: string, limit?: number) => Promise<any[]>
  payrollTotalsByEmployee: (employeeId: number, period?: string) => Promise<any[]>
  payrollSave: (payload: any) => Promise<any>
  payrollDelete: (params: { employee_id: number, period: string } | number) => Promise<any>

  // Employees & Global
  listEmployees: () => Promise<any[]>
  listEmployeesBasic: () => Promise<any[]>
  getEmployee: (id: number) => Promise<any>
  getEmployeeProfile: (id: number) => Promise<any>
  searchEmployees: (query: string) => Promise<any[]>
  exportEmployees: (options?: any) => Promise<{ success: boolean; filePath?: string; count?: number; canceled?: boolean; error?: string }>
  employees: {
    getAll: () => Promise<any[]>
    getSalaryDefaults: (id: number) => Promise<any>
    get: (id: number) => Promise<any>
    search: (query: string) => Promise<any[]>
  }

  // Dashboard
  getDashboardSummary: (period?: string) => Promise<any>

  // Leaves
  listLeaves: () => Promise<any[]>
  createLeave: (data: any) => Promise<any>
  leavesStats: () => Promise<any>

  // Absences
  listAbsences: () => Promise<any[]>
  createAbsence: (data: any) => Promise<any>

  // Evaluations
  createEvaluation: (data: any) => Promise<any>
  listEvaluations: () => Promise<any[]>
  updateEvaluation: (id: number, data: any) => Promise<any>
  deleteEvaluation: (id: number) => Promise<any>
  evaluationsStats: () => Promise<any>

  // Settings
  getSettings: () => Promise<Record<string, any>>
  saveSettings: (data: Record<string, any>) => Promise<any>

  // Backup
  backup: {
    createManual: () => Promise<{ success: boolean; path?: string; error?: string }>
  }

  // Files
  files: {
    list: (entityType: string, entityId: number) => Promise<any[]>
    save: (data: any) => Promise<any>
    delete: (id: number) => Promise<any>
    open: (id: number) => Promise<any>
    choose: () => Promise<any>
  }

  // Promotions
  listPromotions: () => Promise<any[]>
  getPromotions: () => Promise<any[]>  // Alias for listPromotions
  createPromotion: (data: any) => Promise<any>
  updatePromotion: (id: number, data: any) => Promise<any>
  deletePromotion: (id: number) => Promise<any>
  promotionsStats: () => Promise<any>

  // Courses
  createCourse: (data: any) => Promise<any>
  updateCourse: (id: number, data: any) => Promise<any>
  deleteCourse: (id: number) => Promise<any>
  removeCourseAttachment: (path: string) => Promise<any>

  // Rewards
  listRewards: (filters?: any) => Promise<any[]>
  createReward: (data: any) => Promise<any>
  updateReward: (id: number, data: any) => Promise<any>
  deleteReward: (id: number) => Promise<any>
  rewardsStats: () => Promise<{ totals: any, dist: any[] }>

  db: {
    employees: {
      findAll: () => Promise<{ success: boolean; data?: Employee[]; error?: string }>
      findById: (id: number) => Promise<{ success: boolean; data?: Employee; error?: string }>
    }
    exchangeRates: {
      getActive: () => Promise<{ success: boolean; data?: ExchangeRate; error?: string }>
      getHistory: (limit?: number) => Promise<{ success: boolean; data?: ExchangeRate[]; error?: string }>
    }
    migrate: () => Promise<{ success: boolean; message?: string; error?: string }>
    seed: () => Promise<{ success: boolean; message?: string; error?: string }>
    excel: {
      import: (employees: any[]) => Promise<{ success: boolean; message?: string; error?: string; results?: any[]; stats?: { total: number; success: number; errors: number } }>
    }
  }

  // File operations
  files: {
    save: (entityType: EntityType, entityId: number, fileName: string, data: any, uploadedBy: number) => Promise<{ success: boolean; attachment?: Attachment; path?: string; error?: string }>
    delete: (attachmentId: number) => Promise<{ success: boolean; error?: string }>
    list: (entityType: EntityType, entityId: number) => Promise<{ success: boolean; data?: Attachment[]; error?: string }>
    open: (attachmentId: number) => Promise<{ success: boolean; error?: string }>
  }

  // Diagnostics
  runContractTest: () => Promise<any>
  openPath: (path: string) => Promise<any>
  isFirstRun: () => Promise<boolean>
  onDbConnectionFailed?: (callback: (error: any) => void) => (() => void) | undefined
  // Generic invoke for legacy/IPC compatibility
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    api: ElectronAPI
    toast?: {
      success: (msg: string) => void
      error: (msg: string) => void
    }
    events?: {
      on: (channel: string, func: (...args: any[]) => void) => () => void
      emit: (channel: string, data?: any) => void
    }
  }
}
