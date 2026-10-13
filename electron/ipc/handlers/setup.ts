import { ipcMain } from 'electron'
import { getDatabase } from '../../database/init'
import * as bcrypt from 'bcryptjs'

export const setupHandlers = {
    createFirstAdmin: async (event: any, { username, password }: any) => {
        try {
            const db = getDatabase()

            // Double check if users exist
            const users = db.exec("SELECT count(*) as count FROM users")
            if ((users[0].values[0][0] as number) > 0) {
                return { success: false, error: 'Users already exist' }
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            db.run("INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, 'ADMIN', 1)", [
                username,
                hashedPassword
            ])

            // Save to disk
            const { persistDatabase } = require('../../database/init')
            persistDatabase()

            return { success: true }
        } catch (error) {
            console.error('Setup failed:', error)
            return { success: false, error: (error as Error).message }
        }
    }
}
