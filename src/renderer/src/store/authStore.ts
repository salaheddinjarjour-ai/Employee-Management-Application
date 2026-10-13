import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: number
    username: string
    is_admin: boolean
}

interface Permission {
    id: number
    page_key: string
    action_type: string
    display_name: string
}

interface AuthState {
    user: User | null
    permissions: Permission[]
    isAuthenticated: boolean
    isLoading: boolean

    // Actions
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
    loadPermissions: () => Promise<void>
    can: (pageKey: string, action: string) => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: true,

            login: async (username: string, password: string) => {
                try {
                    const result = await window.api.auth.login(username, password)

                    if (result.success && result.user) {
                        set({
                            user: result.user,
                            isAuthenticated: true,
                            isLoading: false
                        })

                        // Load permissions after login
                        await get().loadPermissions()

                        return { success: true }
                    } else {
                        set({ isLoading: false })
                        return {
                            success: false,
                            error: result.error || 'فشل تسجيل الدخول'
                        }
                    }
                } catch (error: any) {
                    console.error('Login error:', error)
                    set({ isLoading: false })
                    return {
                        success: false,
                        error: 'حدث خطأ أثناء تسجيل الدخول'
                    }
                }
            },

            logout: async () => {
                try {
                    await window.api.auth.logout()
                    set({
                        user: null,
                        permissions: [],
                        isAuthenticated: false
                    })
                } catch (error) {
                    console.error('Logout error:', error)
                }
            },

            checkAuth: async () => {
                try {
                    set({ isLoading: true })
                    const result = await window.api.auth.getCurrentUser()

                    if (result.user) {
                        set({
                            user: result.user,
                            isAuthenticated: true
                        })
                        await get().loadPermissions()
                    } else {
                        set({
                            user: null,
                            isAuthenticated: false,
                            permissions: []
                        })
                    }
                } catch (error) {
                    console.error('Check auth error:', error)
                    set({
                        user: null,
                        isAuthenticated: false,
                        permissions: []
                    })
                } finally {
                    set({ isLoading: false })
                }
            },

            loadPermissions: async () => {
                try {
                    const perms = await window.api.permissions.getMyPermissions()
                    set({ permissions: perms || [] })
                } catch (error) {
                    console.error('Load permissions error:', error)
                    set({ permissions: [] })
                }
            },

            can: (pageKey: string, action: string) => {
                const { user, permissions } = get()

                // Not authenticated
                if (!user) return false

                // Admin has all permissions
                if (user.is_admin) return true

                // Check if user has the specific permission
                return permissions.some(
                    p => p.page_key === pageKey && p.action_type === action
                )
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
)
