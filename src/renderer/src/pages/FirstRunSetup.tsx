import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'

export function FirstRunSetup() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const login = useAuthStore(state => state.login)

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!username || !password || !confirmPassword) {
            setError('الرجاء ملء جميع الحقول')
            return
        }

        const passwordError = validatePassword(password)
        if (passwordError) {
            setError(passwordError)
            return
        }

        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين')
            return
        }

        setIsLoading(true)

        try {
            const result = await window.api.auth.createAdmin(username, password)

            if (result.success) {
                toast.success('تم إنشاء حساب المدير بنجاح')

                // Auto-login the newly created admin
                const loginResult = await login(username, password)

                if (loginResult.success) {
                    // Redirect to dashboard
                    navigate('/dashboard')
                } else {
                    // If auto-login fails, redirect to login page
                    navigate('/login')
                }
            } else {
                setError(result.error || 'فشل إنشاء الحساب')
            }
        } catch (err) {
            setError('حدث خطأ أثناء إنشاء الحساب')
        } finally {
            setIsLoading(false)
        }
    }

    const passwordStrength = password.length >= 12 ? 'قوية' : password.length >= 8 ? 'متوسطة' : 'ضعيفة'
    const strengthColor = password.length >= 12 ? 'bg-green-500' : password.length >= 8 ? 'bg-yellow-500' : 'bg-red-500'

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        مرحباً بك!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        إعداد حساب المدير الأول
                    </p>
                </div>

                {/* Setup Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-right">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            هذا هو أول تشغيل للنظام. يرجى إنشاء حساب المدير الرئيسي.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right"
                            >
                                اسم المستخدم
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-right"
                                placeholder="اختر اسم المستخدم"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right"
                            >
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-right pr-12"
                                    placeholder="اختر كلمة مرور قوية"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password Strength */}
                            {password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            قوة كلمة المرور: {passwordStrength}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${strengthColor} transition-all duration-300`}
                                            style={{ width: `${Math.min((password.length / 12) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right"
                            >
                                تأكيد كلمة المرور
                            </label>
                            <input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-right"
                                placeholder="أعد إدخال كلمة المرور"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-right">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full py-3 text-base font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                    جاري الإنشاء...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5 ml-2" />
                                    إنشاء حساب المدير
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        نظام إدارة الموارد البشرية © 2026
                    </p>
                </div>
            </div>
        </div>
    )
}
