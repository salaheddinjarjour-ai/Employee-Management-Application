import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { PageShell } from './components/layout/PageShell'
import { Dashboard } from './components/pages/Dashboard'
import { EmployeesPage } from './components/pages/EmployeesPage'
import { CoursesPage } from './components/pages/CoursesPage'
import { EvaluationsPage } from './components/pages/EvaluationsPage'
import { PromotionsPage } from './components/pages/PromotionsPage'
import { RewardsPage } from './components/pages/RewardsPage'
import { LeavePage } from './components/pages/LeavePage'
import { AbsencePage } from './components/pages/AbsencePage'
import PayrollPage from './components/pages/PayrollPage'
import { ServiceYearsPage } from './components/pages/ServiceYearsPage'
import { ExchangeRatesPage } from './components/pages/ExchangeRatesPage'
import { ReportsPage } from './components/pages/ReportsPage'
import { SettingsPage } from './components/pages/SettingsPage'
import { EmployeeProfile } from './components/pages/EmployeeProfile'
import { TestPayrollPage } from './components/pages/TestPayrollPage'
import { LoginPage } from './pages/LoginPage'
import { FirstRunSetup } from './pages/FirstRunSetup'
import { UsersPage } from './pages/UsersPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuthStore } from './store/authStore'
import { Loader2 } from 'lucide-react'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null)
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Check if first run
    const checkFirstRun = async () => {
      try {
        const result = await window.api.auth.isFirstRun()
        console.log('[Frontend] First run check result:', result)
        setIsFirstRun(result.isFirstRun)

        // If first run and not already on setup page, redirect
        if (result.isFirstRun) {
          console.log('[Frontend] Redirecting to setup page')
          if (location.pathname !== '/setup') {
            navigate('/setup', { replace: true })
          }
        } else {
          // Not first run, check auth
          checkAuth()
        }
      } catch (error) {
        console.error('Failed to check first run:', error)
        setIsFirstRun(false)
      }
    }

    checkFirstRun()
  }, [])

  useEffect(() => {
    // Listen for startup errors
    const removeListener = window.api.onDbConnectionFailed?.((error) => {
      console.error('Startup DB Error:', error)
      if (location.pathname !== '/settings') {
        navigate('/settings?tab=connection')
      }
    })

    // Proactive check on mount
    const checkConnection = async () => {
      try {
        const result = await window.api.invoke('diagnostics:run-all')
        if (result && result.checks) {
          const connCheck = result.checks.find((c: any) => c.name === 'اتصال قاعدة البيانات')
          if (connCheck && connCheck.status === 'error') {
            console.warn('DB Connection failed, redirecting to settings')
            if (location.pathname !== '/settings') {
              navigate('/settings?tab=connection')
            }
          }
        }
      } catch (err) {
        console.error('Failed to run diagnostics:', err)
      }
    }

    checkConnection()

    return () => {
      // removeListener is void because onDbConnectionFailed returns void in current implementation
      // If we change preload to return unlisten function, we can call it.
      // For now, no cleanup needed for the custom listener pattern unless implemented in preload
    }
  }, [])

  // Show loading while checking first run
  if (isFirstRun === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased" dir="rtl">
      <Routes>
        {/* Public Routes - Show setup if first run, otherwise login */}
        <Route path="/login" element={
          isFirstRun === true ? <FirstRunSetup /> : <LoginPage />
        } />
        <Route path="/setup" element={<FirstRunSetup />} />

        {/* Protected Routes */}
        <Route path="/employee/:id" element={
          <ProtectedRoute pageKey="employees">
            <EmployeeProfile />
          </ProtectedRoute>
        } />

        <Route path="/*" element={
          <ProtectedRoute>
            <PageShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/employees" element={
                  <ProtectedRoute pageKey="employees">
                    <EmployeesPage />
                  </ProtectedRoute>
                } />

                <Route path="/courses" element={
                  <ProtectedRoute pageKey="courses">
                    <CoursesPage />
                  </ProtectedRoute>
                } />

                <Route path="/evaluations" element={
                  <ProtectedRoute pageKey="evaluations">
                    <EvaluationsPage />
                  </ProtectedRoute>
                } />

                <Route path="/promotions" element={
                  <ProtectedRoute pageKey="promotions">
                    <PromotionsPage />
                  </ProtectedRoute>
                } />

                <Route path="/rewards" element={
                  <ProtectedRoute pageKey="rewards">
                    <RewardsPage />
                  </ProtectedRoute>
                } />

                <Route path="/leave" element={
                  <ProtectedRoute pageKey="leaves">
                    <LeavePage />
                  </ProtectedRoute>
                } />

                <Route path="/absence" element={
                  <ProtectedRoute pageKey="absences">
                    <AbsencePage />
                  </ProtectedRoute>
                } />

                <Route path="/payroll" element={
                  <ProtectedRoute pageKey="payroll">
                    <PayrollPage />
                  </ProtectedRoute>
                } />

                <Route path="/service-years" element={<ServiceYearsPage />} />
                <Route path="/exchange-rates" element={<ExchangeRatesPage />} />

                <Route path="/reports" element={
                  <ProtectedRoute pageKey="reports">
                    <ReportsPage />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute pageKey="settings">
                    <SettingsPage />
                  </ProtectedRoute>
                } />

                <Route path="/users" element={
                  <ProtectedRoute requireAdmin>
                    <UsersPage />
                  </ProtectedRoute>
                } />

                <Route path="/test-payroll" element={<TestPayrollPage />} />
              </Routes>
            </PageShell>
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster position="top-center" richColors />
    </div>
  )
}

export default App

