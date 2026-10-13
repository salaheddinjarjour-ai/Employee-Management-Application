import React from 'react'
import { Button } from './ui/Button'
import { cn } from './ui/utils'
import { useAppStore } from '@/store/appStore'

interface CurrencyToggleProps {
  className?: string
}

export function CurrencyToggle({ className }: CurrencyToggleProps) {
  const { currencyView, setCurrencyView, activeRate } = useAppStore()

  return (
    <div className={cn("flex items-center bg-gray-100 rounded-lg p-1 relative", className)}>
      <Button
        variant={currencyView === 'USD' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrencyView('USD')}
        className="h-7 px-3 text-xs"
      >
        USD
      </Button>
      <Button
        variant={currencyView === 'TRY' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrencyView('TRY')}
        className="h-7 px-3 text-xs"
        title={activeRate ? `Based on rate: ${activeRate.rate} (${activeRate.effective_from})` : 'No active rate'}
      >
        TRY
      </Button>
      {currencyView === 'TRY' && activeRate && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500 whitespace-nowrap">
          Rate: {activeRate.rate}
        </div>
      )}
    </div>
  )
}
