import React from 'react'
import { TopBar } from './TopBar'
import { RightSidebar } from './RightSidebar'
import { Footer } from './Footer'

interface PageShellProps {
  children: React.ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Right Sidebar (RTL) - Fixed */}
      <div className="fixed top-0 right-0 h-screen w-72 z-40">
        <RightSidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="mr-72 flex flex-col h-screen overflow-y-auto">
        <TopBar />
        <main className="flex-1 p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
