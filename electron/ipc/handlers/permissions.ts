import { ipcMain } from 'electron'
import { getDatabase, persistDatabase } from '../../database/init'
import { getCurrentUser, isAdmin } from './auth'

/**
 * List all available permissions grouped by page
 */
export function listPermissions() {
    try {
        const db = getDatabase()
        const result = db.exec(`
      SELECT id, page_key, action_type, display_name, description
      FROM permissions
      ORDER BY page_key, action_type
    `)

        if (!result.length || !result[0].values.length) {
            return []
        }

        return result[0].values.map(row => ({
            id: row[0],
            page_key: row[1],
            action_type: row[2],
            display_name: row[3],
            description: row[4]
        }))
    } catch (error: any) {
        console.error('Error listing permissions:', error)
        throw error
    }
}

/**
 * Get permissions for a specific user (admin only)
 */
export function getUserPermissions(userId: number) {
    try {
        if (!isAdmin()) {
            throw new Error('Unauthorized: Admin access required')
        }

        const db = getDatabase()
        const result = db.exec(`
      SELECT p.id, p.page_key, p.action_type, p.display_name
      FROM permissions p
      INNER JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = ?
      ORDER BY p.page_key, p.action_type
    `, [userId])

        if (!result.length || !result[0].values.length) {
            return []
        }

        return result[0].values.map(row => ({
            id: row[0],
            page_key: row[1],
            action_type: row[2],
            display_name: row[3]
        }))
    } catch (error: any) {
        console.error('Error getting user permissions:', error)
        throw error
    }
}

/**
 * Set permissions for a user (admin only)
 * Replaces all existing permissions with the provided list
 */
export function setUserPermissions(userId: number, permissionIds: number[]) {
    try {
        if (!isAdmin()) {
            throw new Error('Unauthorized: Admin access required')
        }

        const db = getDatabase()

        // Delete existing permissions
        db.run('DELETE FROM user_permissions WHERE user_id = ?', [userId])

        // Insert new permissions
        if (permissionIds.length > 0) {
            const stmt = db.prepare(`
        INSERT INTO user_permissions (user_id, permission_id)
        VALUES (?, ?)
      `)

            for (const permissionId of permissionIds) {
                stmt.run([userId, permissionId])
            }

            stmt.free()
        }

        persistDatabase()

        return { success: true }
    } catch (error: any) {
        console.error('Error setting user permissions:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Check if current user has a specific permission
 */
export function checkPermission(pageKey: string, action: string): boolean {
    try {
        const user = getCurrentUser()

        // Not authenticated
        if (!user) {
            return false
        }

        // Admin has all permissions
        if (user.is_admin) {
            return true
        }

        const db = getDatabase()
        const result = db.exec(`
      SELECT COUNT(*) as count
      FROM user_permissions up
      INNER JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ? AND p.page_key = ? AND p.action_type = ?
    `, [user.id, pageKey, action])

        const count = result[0]?.values[0]?.[0] || 0
        return count > 0
    } catch (error: any) {
        console.error('Error checking permission:', error)
        return false
    }
}

/**
 * Get all permissions for current user (for UI)
 */
export function getMyPermissions() {
    try {
        const user = getCurrentUser()

        if (!user) {
            return []
        }

        // Admin has all permissions
        if (user.is_admin) {
            return listPermissions()
        }

        // For regular users, query their permissions directly
        const db = getDatabase()
        const result = db.exec(`
      SELECT p.id, p.page_key, p.action_type, p.display_name
      FROM permissions p
      INNER JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = ?
      ORDER BY p.page_key, p.action_type
    `, [user.id])

        if (!result.length || !result[0].values.length) {
            return []
        }

        return result[0].values.map(row => ({
            id: row[0],
            page_key: row[1],
            action_type: row[2],
            display_name: row[3]
        }))
    } catch (error: any) {
        console.error('Error getting my permissions:', error)
        return []
    }
}

/**
 * Register permission IPC handlers
 */
export function registerPermissionHandlers() {
    // List all permissions
    ipcMain.handle('permissions:list', () => {
        return listPermissions()
    })

    // Get user permissions (admin only)
    ipcMain.handle('permissions:getUserPermissions', (event, { userId }) => {
        return getUserPermissions(userId)
    })

    // Set user permissions (admin only)
    ipcMain.handle('permissions:setUserPermissions', (event, { userId, permissionIds }) => {
        return setUserPermissions(userId, permissionIds)
    })

    // Check permission for current user
    ipcMain.handle('permissions:check', (event, { pageKey, action }) => {
        return { allowed: checkPermission(pageKey, action) }
    })

    // Get current user's permissions
    ipcMain.handle('permissions:getMyPermissions', () => {
        return getMyPermissions()
    })

    console.log('[Permissions] Permission handlers registered')
}
