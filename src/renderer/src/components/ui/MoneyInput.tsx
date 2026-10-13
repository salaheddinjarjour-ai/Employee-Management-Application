import React, { useState, useEffect } from 'react'

export type Currency = 'TRY' | 'USD'

interface MoneyInputProps {
  label?: string
  value: number | string
  currency: Currency
  onChange: (next: { value: number; currency: Currency }) => void
  min?: number
  step?: number
  className?: string
  disabled?: boolean
  'data-testid'?: string
}

export default function MoneyInput({
  label,
  value,
  currency,
  onChange,
  min = 0,
  step = 0.01,
  className = '',
  disabled = false,
  'data-testid': testId,
}: MoneyInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())

  useEffect(() => {
    // Sync local state when prop value changes externally
    // But only if it differs significantly to avoid cursor jump issues on round trip
    if (parseFloat(inputValue) !== parseFloat(value.toString()) && inputValue !== value.toString()) {
      setInputValue(value.toString())
    }
  }, [value])

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setInputValue(rawValue)

    if (rawValue === '' || rawValue === '.') {
      onChange({ value: 0, currency })
      return
    }

    const newValue = parseFloat(rawValue)
    if (!isNaN(newValue)) {
      onChange({ value: newValue, currency })
    }
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value as Currency
    onChange({ value: Number(value) || 0, currency: newCurrency })
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} dir="rtl">
      {label && (
        <label className="block text-sm font-medium text-gray-700 min-w-fit">
          {label}
        </label>
      )}

      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          min={min}
          step={step}
          value={inputValue}
          onChange={handleValueChange}
          disabled={disabled}
          data-testid={testId ? `${testId}-amount` : undefined}
          aria-label={label}
          className="w-24 min-w-0 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
        />

        <select
          value={currency}
          onChange={handleCurrencyChange}
          disabled={disabled}
          data-testid={testId ? `${testId}-currency` : undefined}
          className="px-1 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-[60px] text-sm"
        >
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
        </select>
      </div>
    </div>
  )
}
