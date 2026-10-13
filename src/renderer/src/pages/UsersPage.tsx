import { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { Users, Plus, Edit, Trash2, Key, Shield, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import Confirm from '../components/ui/Confirm'
import { UserFormModal } from '../components/auth/UserFormModal'
import { PermissionEditor } from '../components/auth/PermissionEditor'
import { formatDate } from '../utils/dateFormat'

interface User {
    id: number
    username: string
    is_active: boolean
    is_admin: boolean
    created_at: string
    last_login: string | null
}

interface Permission {
    id: number
    page_key: string
    action_type: string
    display_name: string
}

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(true)
    const [showUserModal, setShowUserModal] = useState(false)
    const [showPermissionModal, setShowPermissionModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        loadUsers()
        loadPermissions()
    }, [])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const data = await window.api.users.list()
            setUsers(data || [])
        } catch (error) {
            console.error('Failed to load users:', error)
            toast.error('فشل تحميل المستخدمين')
        } finally {
            setLoading(false)
        }
    }

    const loadPermissions = async () => {
        try {
            const data = await window.api.permissions.list()
            setPermissions(data || [])
        } catch (error) {
            console.error('Failed to load permissions:', error)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const result = await window.api.users.delete(id)
            if (result.success) {
                toast.success('تم حذف المستخدم بنجاح')
                loadUsers()
            } else {
                toast.error(result.error || 'فشل حذف المستخدم')
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء حذف المستخدم')
        }
        setDeleteConfirm(null)
    }

    const handleToggleActive = async (user: User) => {
        try {
            const result = await window.api.users.update(user.id, {
                is_active: !user.is_active
            })
            if (result.success) {
                toast.success(user.is_active ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم')
                loadUsers()
            } else {
                toast.error(result.error || 'فشل تحديث المستخدم')
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء تحديث المستخدم')
        }
    }

    const handleResetPassword = async () => {
        if (!resetPasswordUser || !newPassword) return

        if (newPassword.length < 8) {
            toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
            return
        }

        try {
            const result = await window.api.users.resetPassword(resetPasswordUser.id, newPassword)
            if (result.success) {
                toast.success('تم إعادة تعيين كلمة المرور بنجاح')
                setResetPasswordUser(null)
                setNewPassword('')
            } else {
                toast.error(result.error || 'فشل إعادة تعيين كلمة المرور')
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء إعادة تعيين كلمة المرور')
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
                <Button onClick={() => { setSelectedUser(null); setShowUserModal(true) }}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مستخدم
                </Button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    اسم المستخدم
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    الصلاحية
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    الحالة
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    آخر تسجيل دخول
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    الإجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {user.username}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {user.is_admin ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                                <Shield className="w-3 h-3 ml-1" />
                                                مدير
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                مستخدم
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleActive(user)}
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${user.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                        >
                                            {user.is_active ? 'نشط' : 'معطل'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.last_login)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setSelectedUser(user); setShowPermissionModal(true) }}
                                                title="إدارة الصلاحيات"
                                            >
                                                <Key className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setResetPasswordUser(user) }}
                                                title="إعادة تعيين كلمة المرور"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setSelectedUser(user); setShowUserModal(true) }}
                                                title="تعديل"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteConfirm(user.id)}
                                                className="text-red-600 hover:text-red-700"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation */}
            <Confirm
                open={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                title="تأكيد حذف المستخدم"
                message="هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه."
                confirmText="حذف"
            />

            {/* User Form Modal */}
            <UserFormModal
                isOpen={showUserModal}
                onClose={() => { setShowUserModal(false); setSelectedUser(null) }}
                user={selectedUser}
                onSuccess={loadUsers}
            />

            {/* Permission Editor */}
            <PermissionEditor
                isOpen={showPermissionModal}
                onClose={() => { setShowPermissionModal(false); setSelectedUser(null) }}
                user={selectedUser}
                onSuccess={loadUsers}
            />

            {/* Reset Password Modal */}
            {resetPasswordUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 text-right">
                            إعادة تعيين كلمة المرور: {resetPasswordUser.username}
                        </h3>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 mb-4 text-right"
                            placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
                        />
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => { setResetPasswordUser(null); setNewPassword('') }}
                                className="flex-1"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleResetPassword}
                                className="flex-1"
                            >
                                تأكيد
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
