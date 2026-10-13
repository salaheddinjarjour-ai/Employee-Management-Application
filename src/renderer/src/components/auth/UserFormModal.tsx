import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UserFormModalProps {
    isOpen: boolean
    onClose: () => void
    user?: {
        id: number
        username: string
        is_admin: boolean
        is_active: boolean
    } | null
    onSuccess: () => void
}

export function UserFormModal({ isOpen, onClose, user, onSuccess }: UserFormModalProps) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    const [isActive, setIsActive] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const isEditMode = !!user

    useEffect(() => {
        if (user) {
            setUsername(user.username)
            setIsAdmin(user.is_admin)
            setIsActive(user.is_active)
            setPassword('') // Don't show existing password
        } else {
            setUsername('')
            setPassword('')
            setIsAdmin(false)
            setIsActive(true)
        }
        setError('')
    }, [user, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!username) {
            setError('الرجاء إدخال اسم المستخدم')
            return
        }

        if (!isEditMode && !password) {
            setError('الرجاء إدخال كلمة المرور')
            return
        }

        if (!isEditMode && password.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
            return
        }

        setIsLoading(true)

        try {
            if (isEditMode) {
                // Update existing user
                const result = await window.api.users.update(user!.id, {
                    username,
                    is_admin: isAdmin,
                    is_active: isActive
                })

                if (result.success) {
                    toast.success('تم تحديث المستخدم بنجاح')
                    onSuccess()
                    onClose()
                } else {
                    setError(result.error || 'فشل تحديث المستخدم')
                }
            } else {
                // Create new user
                const result = await window.api.users.create({
                    username,
                    password,
                    is_admin: isAdmin,
                    is_active: isActive
                })

                if (result.success) {
                    toast.success('تم إنشاء المستخدم بنجاح')
                    onSuccess()
                    onClose()
                } else {
                    setError(result.error || 'فشل إنشاء المستخدم')
                }
            }
        } catch (err) {
            setError('حدث خطأ أثناء حفظ المستخدم')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-md w-full shadow-xl border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">
                        {isEditMode ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2 text-right">
                            اسم المستخدم
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                            placeholder="أدخل اسم المستخدم"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password (only for new users) */}
                    {!isEditMode && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2 text-right">
                                كلمة المرور
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                                placeholder="أدخل كلمة المرور (8 أحرف على الأقل)"
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    {/* Checkboxes */}
                    <div className="space-y-3">
                        <label className="flex items-center justify-end gap-2 cursor-pointer">
                            <span className="text-sm text-foreground">مدير</span>
                            <input
                                type="checkbox"
                                checked={isAdmin}
                                onChange={(e) => setIsAdmin(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                disabled={isLoading}
                            />
                        </label>

                        <label className="flex items-center justify-end gap-2 cursor-pointer">
                            <span className="text-sm text-foreground">نشط</span>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                disabled={isLoading}
                            />
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-right">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                isEditMode ? 'تحديث' : 'إضافة'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
