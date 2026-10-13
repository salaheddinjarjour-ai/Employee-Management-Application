import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Users,
  BookOpen,
  BarChart3,
  TrendingUp,
  Gift,
  Calendar,
  UserX,
  DollarSign,
  Clock,
  FileText,
  Home,
  Settings,
  Calculator,
  Shield
} from 'lucide-react'
import { cn } from '../ui/utils'
import { useAuthStore } from '../../store/authStore'

const menuItems = [
  { id: '/', label: 'لوحة التحكم', icon: Home },
  { id: '/employees', label: 'الموظفون', icon: Users },
  { id: '/payroll', label: 'كشف الرواتب', icon: DollarSign },
  { id: '/leave', label: 'الإجازات', icon: Calendar },
  { id: '/absence', label: 'الغياب والتأخير', icon: UserX },
  { id: '/evaluations', label: 'التقييمات', icon: BarChart3 },
  { id: '/promotions', label: 'الترقيات', icon: TrendingUp },
  { id: '/rewards', label: 'المكافآت', icon: Gift },
  { id: '/courses', label: 'الدورات', icon: BookOpen },
  { id: '/service-years', label: 'سنوات الخدمة', icon: Clock },
  { id: '/exchange-rates', label: 'أسعار الصرف', icon: Calculator },
  { id: '/reports', label: 'التقارير', icon: FileText },
  { id: '/settings', label: 'الإعدادات', icon: Settings },
]

export function RightSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleExcelImport = () => {
    navigate('/employees')
    // TODO: Open Excel import modal
  }

  return (
    <div className="w-72 bg-card border-l border-border/50 h-screen flex flex-col shadow-[rgba(0,0,0,0.03)_5px_0px_20px] z-10">
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">إدارة الموظفين</h1>
            <p className="text-[11px] text-muted-foreground font-medium">نظام الموارد البشرية</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 space-y-1 pr-7 pl-6 -mr-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent hover:scrollbar-thumb-blue-300 scroll-smooth" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgb(191 219 254) transparent'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.id

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:scale-110"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">{item.label}</span>

              {isActive && (
                <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-800 rounded-l-full opacity-0 lg:opacity-100" />
              )}
            </button>
          )
        })}

        {/* Admin-only Users menu item */}
        {user?.is_admin && (
          <>
            <div className="my-2 border-t border-border/50" />
            <button
              onClick={() => navigate('/users')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                location.pathname === '/users'
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20 hover:bg-purple-700"
                  : "text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200",
                location.pathname === '/users'
                  ? "bg-white/20 text-white"
                  : "bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:scale-110"
              )}>
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">إدارة المستخدمين</span>

              {location.pathname === '/users' && (
                <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-purple-800 rounded-l-full opacity-0 lg:opacity-100" />
              )}
            </button>
          </>
        )}
      </nav>

      <div className="flex-shrink-0 px-6 mt-6 pt-4 space-y-2">
        <div className="px-3 py-2 text-[10px] text-muted-foreground/40 text-center font-medium">
          HR System v1.0 &copy; 2025
        </div>
      </div>
    </div>
  )
}
