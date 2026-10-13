import { ipcMain } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import bcrypt from 'bcryptjs'
import { getCurrentUser, isAdmin } from './auth'

const SALT_ROUNDS = 10

/**
 * List all users (admin only)
 */
export function listUsers() {
    try {
        if (!isAdmin()) {
            throw new Error('Unauthorized: Admin access required')
        }

        const db = getDatabase()
        const result = db.exec(`
      SELECT id, username, is_active, is_admin, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `)

        if (!result.length || !result[0].values.length) {
            return []
        }

        return result[0].values.map(row => ({
            id: row[0],
            username: row[1],
            is_active: Boolean(row[2]),
            is_admin: Boolean(row[3]),
            created_at: row[4],
            last_login: row[5]
        }))
    } catch (error: any) {
        console.error('Error listing users:', error)
        throw error
    }
}

/**
 * Create new user (admin only)
 */
export async function createUser(data: {
    username: string
    password: string
    is_admin?: boolean
    is_active?: boolean
}) {
    try {
        if (!isAdmin()) {
            throw new Error('Unauthorized: Admin access required')
        }

        const { username, password, is_admin = false, is_active = true } = data

        // Validate
        if (!username || !password) {
            throw new Error('Username and password are required')
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters')
        }

        const db = getDatabase()

        // Check if username exists
        const existing = db.exec('SELECT id FROM users WHERE username = ?', [username])
        if (existing.length && existing[0].values.length) {
            throw new Error('Username already exists')
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

        // Create user
        const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, is_admin, is_active)
      VALUES (?, ?, ?, ?)
    `)

        stmt.run([username, password_hash, is_admin ? 1 : 0, is_active ? 1 : 0])
        stmt.free()

        const result = db.exec('SELECT last_insert_rowid() as id')
        const userId = result[0]?.values[0]?.[0] as number

        persistDatabase()

        return {
            success: true,
            user: {
                id: userId,
                username,
                is_admin,
                is_active
            }
        }
    } catch (error: any) {
        console.error('Error creating user:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Update user (admin only)
 */
export function updateUser(id: number, data: {
    username?: string
    is_active?: boolean
    is_admin?: boolean
}) {
    try {
        if (!isAdmin()) {
            throw new Error('Unauthorized: Admin access required')
        }

        const db = getDatabase()
        const updates: string[] = []
        const values: any[] = []

        if (data.username !== undefined) {
            // Check if new username is taken
            const existing = db.exec(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [data.username, id]
            )
            if (existing.length && existing[0].values.length) {
                throw new Error('Username already exists')
            }
            updates.push('username = ?')
            values.push(data.username)
        }

        if (data.is_active !== undefined) {
            updates.push('is_active = ?')
            values.push(data.is_active ? 1 : 0)
        }

        if (data.is_admin !== undefined) {
            updates.push('is_admin = ?')
            values.push(data.is_admin ? 1 : 0)
        }

        if (updates.length === 0) {
            return { success: true }
        }

        updates.push('updated_at = datetime(\'now\')')
        values.push(id)

        db.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        )

        persistDatabase()

        return { success: true }
    } catch (error: any) {
        console.error('Error updating user:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Reset user password (admin only)
 */
export async function resetPassword(id: number, newPassword: string) {
    try {
        if (!isAdmin()) {
            throw new Error('Unauthorized: Admin access required')
        }

        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters')
        }

        const db = getDatabase()
        const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS)

        db.run(
            'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?',
            [password_hash, id]
        )

        persistDatabase()

        return { success: true }
    } catch (error: any) {
        console.error('Error resetting password:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Delete user (admin only)
 */
export function deleteUser(id: number) {
    try {
        if (!isAdmin()) {
            throw new Error('Unauthorized: Admin access required')
        }

        const currentUserData = getCurrentUser()
        if (currentUserData?.id === id) {
            throw new Error('Cannot delete your own account')
        }

        const db = getDatabase()

        // Check if user exists
        const user = db.exec('SELECT id FROM users WHERE id = ?', [id])
        if (!user.length || !user[0].values.length) {
            throw new Error('User not found')
        }

        // Delete user (CASCADE will delete user_permissions)
        db.run('DELETE FROM users WHERE id = ?', [id])

        persistDatabase()

        return { success: true }
    } catch (error: any) {
        console.error('Error deleting user:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Register user management IPC handlers
 */
export function registerUserHandlers() {
    ipcMain.handle('users:list', () => {
        return listUsers()
    })

    ipcMain.handle('users:create', async (event, data) => {
        return await createUser(data)
    })

    ipcMain.handle('users:update', (event, { id, ...data }) => {
        return updateUser(id, data)
    })

    ipcMain.handle('users:resetPassword', async (event, { id, newPassword }) => {
        return await resetPassword(id, newPassword)
    })

    ipcMain.handle('users:delete', (event, { id }) => {
        return deleteUser(id)
    })

    console.log('[Users] User management handlers registered')
}
