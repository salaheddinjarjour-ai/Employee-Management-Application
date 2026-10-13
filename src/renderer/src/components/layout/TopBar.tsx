import React from 'react'
import { Settings, LogOut, User } from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { CurrencyToggle } from '../CurrencyToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'

import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function TopBar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border/40 px-6 h-16 sticky top-0 z-20 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-foreground tracking-tight">نظام إدارة الموظفين</h2>
      </div>

      <div className="flex items-center gap-2">
        <CurrencyToggle />

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full w-9 h-9"
          onClick={() => navigate('/settings')}
        >
          <Settings className="w-5 h-5" />
        </Button>

        <div className="w-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/10 transition-all p-0 overflow-hidden">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2 bg-white text-gray-900 border border-gray-200 shadow-lg" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">أحمد محمد</p>
                <p className="text-xs leading-none text-muted-foreground">
                  مدير الموارد البشرية
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
              <User className="ml-2 h-4 w-4" />
              <span>الملف الشخصي</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
              <Settings className="ml-2 h-4 w-4" />
              <span>الإعدادات</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => {
                if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                  // Add logout logic here
                  console.log('Logging out...')
                  // You can add: window.location.href = '/login' or similar
                }
              }}
            >
              <LogOut className="ml-2 h-4 w-4" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
