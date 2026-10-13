import { ipcMain } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

// In-memory session storage
let currentUser: { id: number; username: string; is_admin: boolean } | null = null

/**
 * Check if this is the first run (no users exist)
 */
export function isFirstRun(): boolean {
    try {
        const db = getDatabase()
        const result = db.exec('SELECT COUNT(*) as count FROM users')
        const count = result[0]?.values[0]?.[0] || 0
        return count === 0
    } catch (error) {
        console.error('Error checking first run:', error)
        return true
    }
}

/**
 * Create the first admin user
 */
export async function createAdmin(username: string, password: string) {
    try {
        const db = getDatabase()

        // Verify this is first run
        if (!isFirstRun()) {
            throw new Error('Admin user already exists')
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

        // Create admin user
        const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, is_admin, is_active)
      VALUES (?, ?, 1, 1)
    `)

        stmt.run([username, password_hash])
        stmt.free()

        const result = db.exec('SELECT last_insert_rowid() as id')
        const userId = result[0]?.values[0]?.[0] as number

        persistDatabase()

        return {
            success: true,
            user: {
                id: userId,
                username,
                is_admin: true
            }
        }
    } catch (error: any) {
        console.error('Error creating admin:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Login user
 */
export async function login(username: string, password: string) {
    try {
        const db = getDatabase()

        // Find user
        const result = db.exec(`
      SELECT id, username, password_hash, is_admin, is_active
      FROM users
      WHERE username = ?
    `, [username])

        if (!result.length || !result[0].values.length) {
            return {
                success: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            }
        }

        const [id, dbUsername, password_hash, is_admin, is_active] = result[0].values[0]

        // Check if active
        if (!is_active) {
            return {
                success: false,
                error: 'هذا الحساب معطل'
            }
        }

        // Verify password
        const isValid = await bcrypt.compare(password, password_hash as string)

        if (!isValid) {
            return {
                success: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            }
        }

        // Update last login
        db.run('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?', [id])

        // Create session record
        db.run('INSERT INTO sessions (user_id) VALUES (?)', [id])

        persistDatabase()

        // Set current user
        currentUser = {
            id: id as number,
            username: dbUsername as string,
            is_admin: Boolean(is_admin)
        }

        return {
            success: true,
            user: currentUser
        }
    } catch (error: any) {
        console.error('Login error:', error)
        return {
            success: false,
            error: 'حدث خطأ أثناء تسجيل الدخول'
        }
    }
}

/**
 * Logout user
 */
export function logout() {
    try {
        if (currentUser) {
            const db = getDatabase()

            // Update last session logout time
            db.run(`
        UPDATE sessions 
        SET logout_at = datetime('now')
        WHERE user_id = ? AND logout_at IS NULL
        ORDER BY login_at DESC
        LIMIT 1
      `, [currentUser.id])

            persistDatabase()
        }

        currentUser = null

        return { success: true }
    } catch (error: any) {
        console.error('Logout error:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Get current logged-in user
 */
export function getCurrentUser() {
    return currentUser
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return currentUser !== null
}

/**
 * Check if current user is admin
 */
export function isAdmin(): boolean {
    return currentUser?.is_admin || false
}

/**
 * Register IPC handlers
 */
export function registerAuthHandlers() {
    // Check first run
    ipcMain.handle('auth:isFirstRun', () => {
        const firstRun = isFirstRun()
        console.log('[Auth] isFirstRun check:', firstRun)
        return { isFirstRun: firstRun }
    })

    // Create admin (first run only)
    ipcMain.handle('auth:createAdmin', async (event, { username, password }) => {
        return await createAdmin(username, password)
    })

    // Login
    ipcMain.handle('auth:login', async (event, { username, password }) => {
        return await login(username, password)
    })

    // Logout
    ipcMain.handle('auth:logout', () => {
        return logout()
    })

    // Get current user
    ipcMain.handle('auth:getCurrentUser', () => {
        return { user: getCurrentUser() }
    })

    console.log('[Auth] Authentication handlers registered')
}
