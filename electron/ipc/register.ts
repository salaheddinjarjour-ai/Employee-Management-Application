import { ipcMain } from 'electron'
import { employeesHandlers } from './handlers/employees'
import { payrollHandlers } from './handlers/payroll'
import { recordsHandlers } from './handlers/records'
import { dashboardHandlers } from './handlers/dashboard'
import { setupHandlers } from './handlers/setup'
import { initializeDatabase, checkFirstRun } from '../database/init'
import { settingsHandlers } from './handlers/settings'
import { backupHandlers } from './handlers/backup'
import { diagnosticsHandlers } from './handlers/diagnostics'
import { coursesHandlers } from './handlers/courses'
import { leavesHandlers } from './handlers/leaves'
import { absencesHandlers } from './handlers/absences'
import { evaluationsHandlers } from './handlers/evaluations'
import { promotionsHandlers } from './handlers/promotions'
import { attachmentHandlers } from './handlers/attachments'
import { excelHandlers } from './handlers/excel'
import { registerOperationalPlansHandlers } from './handlers/operational-plans'
import { exchangeRatesHandlers } from './handlers/exchange-rates'
import { reportsHandlers } from './handlers/reports'
import { dataImportHandlers, payrollTemplateHandlers } from './handlers/data-import'
import { delaysHandlers } from './handlers/delays'
import { rewardsHandlers } from './handlers/rewards'
import { registerAuthHandlers } from './handlers/auth'
import { registerUserHandlers } from './handlers/users'
import { registerPermissionHandlers } from './handlers/permissions'

export function registerIPCHandlers() {
    // Authentication & Authorization
    registerAuthHandlers()
    registerUserHandlers()
    registerPermissionHandlers()

    // Employees
    ipcMain.handle('employees:list', employeesHandlers.list)
    ipcMain.handle('employees:get', employeesHandlers.get)
    ipcMain.handle('employees:create', employeesHandlers.create)
    ipcMain.handle('employees:update', employeesHandlers.update)
    ipcMain.handle('employees:delete', employeesHandlers.delete)
    ipcMain.handle('employees:profile', employeesHandlers.profile)
    ipcMain.handle('employees:salary-defaults', employeesHandlers.getSalaryDefaults)
    ipcMain.handle('employees:search', employeesHandlers.search)

    // Payroll
    ipcMain.handle('payroll:get', payrollHandlers.get)
    ipcMain.handle('payroll:save', payrollHandlers.save)
    ipcMain.handle('payroll:delete', payrollHandlers.delete as any)
    ipcMain.handle('payroll:listByMonth', payrollHandlers.listByMonth)
    ipcMain.handle('payroll:totalsByEmployee', payrollHandlers.getTotalsByEmployee)
    ipcMain.handle('payroll:listPeriods', payrollHandlers.listPeriods)
    ipcMain.handle('payroll:listByEmployee', payrollHandlers.listByEmployee)
    ipcMain.handle('payroll:calcPreview', payrollHandlers.calcPreview)

    // Excel
    ipcMain.handle('excel:preview', excelHandlers.preview)
    ipcMain.handle('excel:import', excelHandlers.import)
    ipcMain.handle('excel:export-preview-csv', excelHandlers.exportPreviewCSV)

    // Records (Generic)
    ipcMain.handle('records:list', recordsHandlers.list)
    ipcMain.handle('records:get', recordsHandlers.get)
    ipcMain.handle('records:create', recordsHandlers.create)
    ipcMain.handle('records:update', recordsHandlers.update)
    ipcMain.handle('records:delete', recordsHandlers.delete)
    ipcMain.handle('records:stats', recordsHandlers.stats)

    // Leaves
    ipcMain.handle('leaves:list', leavesHandlers.list)
    ipcMain.handle('leaves:create', leavesHandlers.create)
    ipcMain.handle('leaves:update', leavesHandlers.update)
    ipcMain.handle('leaves:delete', (event, id) => leavesHandlers.delete(event, id as number))
    ipcMain.handle('leaves:stats', leavesHandlers.getStats)
    ipcMain.handle('leaves:list-types', leavesHandlers.listTypes)
    ipcMain.handle('leaves:create-type', leavesHandlers.createType)
    ipcMain.handle('leaves:delete-type', (event, id) => leavesHandlers.deleteType(event, id as number))
    ipcMain.handle('leaves:list-statuses', leavesHandlers.listStatuses)
    ipcMain.handle('leaves:create-status', leavesHandlers.createStatus)
    ipcMain.handle('leaves:delete-status', (event, id) => leavesHandlers.deleteStatus(event, id as number))

    // Absences
    ipcMain.handle('absences:list', absencesHandlers.list)
    ipcMain.handle('absences:create', absencesHandlers.create)
    ipcMain.handle('absences:update', (event, id, data) => absencesHandlers.update(event, id as number, data))
    ipcMain.handle('absences:delete', (event, id) => absencesHandlers.delete(event, id as number))
    ipcMain.handle('absences:list-types', absencesHandlers.listTypes)
    ipcMain.handle('absences:create-type', absencesHandlers.createType)
    ipcMain.handle('absences:delete-type', (event, id) => absencesHandlers.deleteType(event, id as number))

    // Evaluations
    ipcMain.handle('evaluations:create', evaluationsHandlers.create)
    ipcMain.handle('evaluations:list', evaluationsHandlers.list)
    ipcMain.handle('evaluations:update', evaluationsHandlers.update)
    ipcMain.handle('evaluations:delete', evaluationsHandlers.delete)
    ipcMain.handle('evaluations:stats', evaluationsHandlers.getStats)

    // Promotions
    ipcMain.handle('promotions:create', promotionsHandlers.create)
    ipcMain.handle('promotions:list', promotionsHandlers.list)
    ipcMain.handle('promotions:update', (event, id, data) => promotionsHandlers.update(event, id as number, data))
    ipcMain.handle('promotions:delete', (event, id) => promotionsHandlers.delete(event, id as number))
    ipcMain.handle('promotions:stats', promotionsHandlers.stats)
    ipcMain.handle('promotions:sync-to-payroll', promotionsHandlers.syncToPayroll)

    // Courses
    ipcMain.handle('courses:create', (event, data) => coursesHandlers.create(data))
    ipcMain.handle('courses:update', coursesHandlers.update)
    ipcMain.handle('courses:delete', coursesHandlers.delete)
    ipcMain.handle('courses:list', coursesHandlers.list)


    // Files / Attachments
    ipcMain.handle('files:list', attachmentHandlers.list)
    ipcMain.handle('files:save', attachmentHandlers.save)
    ipcMain.handle('files:delete', attachmentHandlers.delete)
    ipcMain.handle('files:open', attachmentHandlers.open)
    ipcMain.handle('attachments:list', attachmentHandlers.list)
    ipcMain.handle('attachments:upload', attachmentHandlers.save)
    ipcMain.handle('attachments:delete', attachmentHandlers.delete)
    ipcMain.handle('attachments:open', attachmentHandlers.open)
    ipcMain.handle('files:choose', async () => {
        const { dialog } = require('electron')
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'jpg', 'png'] }
            ]
        })
        if (result.canceled || result.filePaths.length === 0) return null
        const filePath = result.filePaths[0]
        const stats = require('fs').statSync(filePath)
        return {
            path: filePath,
            name: require('path').basename(filePath),
            size: stats.size,
            type: require('path').extname(filePath).slice(1)
        }
    })

    // Delays
    ipcMain.handle('delays:getAll', delaysHandlers.getAll)
    ipcMain.handle('delays:create', delaysHandlers.create)
    ipcMain.handle('delays:delete', delaysHandlers.delete)

    // Rewards types & statuses
    ipcMain.handle('rewards:list-types', rewardsHandlers.listTypes)
    ipcMain.handle('rewards:create-type', rewardsHandlers.createType)
    ipcMain.handle('rewards:delete-type', (event, id) => rewardsHandlers.deleteType(event, id as number))
    ipcMain.handle('rewards:list-statuses', rewardsHandlers.listStatuses)
    ipcMain.handle('rewards:create-status', rewardsHandlers.createStatus)
    ipcMain.handle('rewards:delete-status', (event, id) => rewardsHandlers.deleteStatus(event, id as number))
    ipcMain.handle('rewards:sync-to-payroll', (event, id) => rewardsHandlers.syncToPayroll(event, id as number))

    // Dashboard
    ipcMain.handle('dashboard:summary', dashboardHandlers.getSummary)

    // Settings
    ipcMain.handle('settings:get', settingsHandlers.get)
    ipcMain.handle('settings:save', settingsHandlers.save)

    // Backup & Restore
    ipcMain.handle('backup:create', backupHandlers.create)
    ipcMain.handle('backup:createManual', backupHandlers.createManual)
    ipcMain.handle('backup:restore', backupHandlers.restore)

    // System / App
    ipcMain.handle('app:version', (event) => require('electron').app.getVersion())
    ipcMain.handle('app:platform', () => process.platform)
    ipcMain.handle('app:open-path', (event, path) => require('electron').shell.openPath(path))
    // ...
    ipcMain.handle('app:is-first-run', () => checkFirstRun())
    ipcMain.handle('setup:create-admin', setupHandlers.createFirstAdmin)
    ipcMain.handle('diagnostics:run-all', diagnosticsHandlers.runAll)
    ipcMain.handle('diagnostics:contract-test', diagnosticsHandlers.runContractTest)

    // Employee export
    ipcMain.handle('employees:export', employeesHandlers.export)

    // Operational Plans & Performance Indicators
    registerOperationalPlansHandlers()

    // Exchange Rates
    ipcMain.handle('exchange-rates:history', exchangeRatesHandlers.getHistory)
    ipcMain.handle('exchange-rates:create', exchangeRatesHandlers.create)
    ipcMain.handle('exchange-rates:update', exchangeRatesHandlers.update)
    ipcMain.handle('exchange-rates:activate', exchangeRatesHandlers.activate)
    ipcMain.handle('exchange-rates:active', exchangeRatesHandlers.getActive)
    ipcMain.handle('exchange-rates:conversion-preview', exchangeRatesHandlers.getConversionPreview)

    // Reports
    ipcMain.handle('reports:save-metadata', reportsHandlers.saveReportMetadata)
    ipcMain.handle('reports:list', reportsHandlers.listReports)
    ipcMain.handle('reports:recent', reportsHandlers.getRecentReports)
    ipcMain.handle('reports:get', reportsHandlers.getReport)
    ipcMain.handle('reports:delete', reportsHandlers.deleteReport)
    ipcMain.handle('reports:directory', reportsHandlers.getReportsDirectory)
    ipcMain.handle('reports:stats', reportsHandlers.getReportsStats)

    // Data Import
    ipcMain.handle('import:select-file', dataImportHandlers.selectFile)
    ipcMain.handle('import:preview', dataImportHandlers.previewImport)
    ipcMain.handle('import:data', dataImportHandlers.importData)
    ipcMain.handle('import:template', dataImportHandlers.getImportTemplate)

    // Payroll Template Import/Export
    ipcMain.handle('payroll:import-template', payrollTemplateHandlers.importTemplate)
    ipcMain.handle('payroll:export-template', payrollTemplateHandlers.exportTemplate)


    console.log('IPC handlers registered successfully')
}
