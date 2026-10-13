import { getDatabase } from '../../database/init'

export const delaysHandlers = {
    async getAll() {
        const db = getDatabase()
        try {
            const result = db.exec(`
        SELECT 
          d.*,
          e.full_name as employee_name
        FROM delays d
        LEFT JOIN employees e ON d.employee_id = e.id
        ORDER BY d.date DESC
      `)

            if (result.length === 0 || !result[0].values) {
                return []
            }

            const columns = result[0].columns
            return result[0].values.map((row: any[]) => {
                const obj: any = {}
                columns.forEach((col, index) => {
                    obj[col] = row[index]
                })
                return obj
            })
        } catch (error) {
            console.error('Failed to get delays:', error)
            throw error
        }
    },

    async create(_event: any, data: any) {
        const db = getDatabase()
        try {
            db.run(`
        INSERT INTO delays (
          employee_id,
          date,
          delay_hours,
          delay_minutes,
          reason,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
                data.employee_id,
                data.date,
                data.delay_hours || 0,
                data.delay_minutes || 0,
                data.reason || '',
                data.notes || ''
            ])

            return { success: true }
        } catch (error) {
            console.error('Failed to create delay:', error)
            throw error
        }
    },

    async delete(_event: any, id: number) {
        const db = getDatabase()
        try {
            db.run('DELETE FROM delays WHERE id = ?', [id])
            return { success: true }
        } catch (error) {
            console.error('Failed to delete delay:', error)
            throw error
        }
    }
}
