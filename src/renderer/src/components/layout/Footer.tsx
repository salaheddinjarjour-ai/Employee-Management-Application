import React, { useEffect, useState } from 'react'

export function Footer() {
  const [version, setVersion] = useState<string>('...')
  const [platform, setPlatform] = useState<string>('...')

  useEffect(() => {
    // Test IPC communication
    if (window.electronAPI) {
      window.electronAPI.getVersion().then(setVersion)
      window.electronAPI.getPlatform().then(setPlatform)
    } else {
      // Fallback for web version
      setVersion('Web')
      setPlatform('Browser')
    }
  }, [])

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-3 text-sm text-gray-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <span>نظام إدارة الموظفين</span>
          <span>•</span>
          <span>الإصدار {version}</span>
          <span>•</span>
          <span>{platform}</span>
        </div>
        <div className="text-xs">
          © 2025 جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  )
}
