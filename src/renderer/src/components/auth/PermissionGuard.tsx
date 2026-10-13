import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

interface PermissionGuardProps {
    pageKey: string
    action: 'view' | 'create' | 'edit' | 'delete'
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function PermissionGuard({ pageKey, action, children, fallback = null }: PermissionGuardProps) {
    const can = useAuthStore(state => state.can)

    if (!can(pageKey, action)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

/**
 * Hook to check permissions
 */
export function usePermissions() {
    const { can, user, loadPermissions } = useAuthStore()

    useEffect(() => {
        if (user) {
            loadPermissions()
        }
    }, [user, loadPermissions])

    return { can, isAdmin: user?.is_admin || false }
}
