import { ipcMain } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'

export const operationalPlansHandlers = {
    getAll: async () => {
        try {
            const db = getDatabase()
            const result = db.exec('SELECT * FROM operational_plans ORDER BY created_at DESC')
            return formatResults(result)
        } catch (error) {
            console.error('Error fetching operational plans:', error)
            return []
        }
    },

    getById: async (event: any, id: number) => {
        try {
            const db = getDatabase()
            const result = db.exec('SELECT * FROM operational_plans WHERE id = ?', [id])
            const data = formatResults(result)
            return data.length > 0 ? data[0] : null
        } catch (error) {
            console.error('Error fetching operational plan:', error)
            return null
        }
    },

    create: async (event: any, data: any) => {
        try {
            const db = getDatabase()
            db.run(`
        INSERT INTO operational_plans (title, description, year, quarter, department, objectives, kpis, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                data.title,
                data.description,
                data.year,
                data.quarter,
                data.department,
                data.objectives,
                data.kpis,
                data.status || 'draft',
                data.created_by
            ])
            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error creating operational plan:', error)
            return { success: false, error: error.message }
        }
    },

    update: async (event: any, id: number, data: any) => {
        try {
            const db = getDatabase()
            db.run(`
        UPDATE operational_plans 
        SET title = ?, description = ?, year = ?, quarter = ?, department = ?, 
            objectives = ?, kpis = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [
                data.title,
                data.description,
                data.year,
                data.quarter,
                data.department,
                data.objectives,
                data.kpis,
                data.status,
                id
            ])
            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error updating operational plan:', error)
            return { success: false, error: error.message }
        }
    },

    delete: async (event: any, id: number) => {
        try {
            const db = getDatabase()
            db.run('DELETE FROM operational_plans WHERE id = ?', [id])
            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error deleting operational plan:', error)
            return { success: false, error: error.message }
        }
    }
}

export const performanceIndicatorsHandlers = {
    getAll: async (event: any, planId?: number) => {
        try {
            const db = getDatabase()
            let query = 'SELECT * FROM performance_indicators'
            const params: any[] = []

            if (planId) {
                query += ' WHERE operational_plan_id = ?'
                params.push(planId)
            }

            query += ' ORDER BY created_at DESC'
            const result = db.exec(query, params)
            return formatResults(result)
        } catch (error) {
            console.error('Error fetching performance indicators:', error)
            return []
        }
    },

    create: async (event: any, data: any) => {
        try {
            const db = getDatabase()
            db.run(`
        INSERT INTO performance_indicators 
        (operational_plan_id, employee_id, indicator_name, target_value, actual_value, unit, weight, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                data.operational_plan_id,
                data.employee_id,
                data.indicator_name,
                data.target_value,
                data.actual_value,
                data.unit,
                data.weight,
                data.status,
                data.notes
            ])
            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error creating performance indicator:', error)
            return { success: false, error: error.message }
        }
    },

    update: async (event: any, id: number, data: any) => {
        try {
            const db = getDatabase()
            db.run(`
        UPDATE performance_indicators 
        SET indicator_name = ?, target_value = ?, actual_value = ?, unit = ?, 
            weight = ?, status = ?, notes = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [
                data.indicator_name,
                data.target_value,
                data.actual_value,
                data.unit,
                data.weight,
                data.status,
                data.notes,
                id
            ])
            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error updating performance indicator:', error)
            return { success: false, error: error.message }
        }
    },

    delete: async (event: any, id: number) => {
        try {
            const db = getDatabase()
            db.run('DELETE FROM performance_indicators WHERE id = ?', [id])
            persistDatabase()
            return { success: true }
        } catch (error) {
            console.error('Error deleting performance indicator:', error)
            return { success: false, error: error.message }
        }
    }
}

export function registerOperationalPlansHandlers() {
    ipcMain.handle('operational-plans:getAll', operationalPlansHandlers.getAll)
    ipcMain.handle('operational-plans:getById', operationalPlansHandlers.getById)
    ipcMain.handle('operational-plans:create', operationalPlansHandlers.create)
    ipcMain.handle('operational-plans:update', operationalPlansHandlers.update)
    ipcMain.handle('operational-plans:delete', operationalPlansHandlers.delete)

    ipcMain.handle('performance-indicators:getAll', performanceIndicatorsHandlers.getAll)
    ipcMain.handle('performance-indicators:create', performanceIndicatorsHandlers.create)
    ipcMain.handle('performance-indicators:update', performanceIndicatorsHandlers.update)
    ipcMain.handle('performance-indicators:delete', performanceIndicatorsHandlers.delete)
}

function formatResults(result: any) {
    if (!result || result.length === 0) return []
    const columns = result[0].columns
    const values = result[0].values
    return values.map((row: any) => {
        const obj: any = {}
        columns.forEach((col: string, idx: number) => {
            obj[col] = row[idx]
        })
        return obj
    })
}
