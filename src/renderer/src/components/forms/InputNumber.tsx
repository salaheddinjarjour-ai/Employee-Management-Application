import React from 'react'

interface InputNumberProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  min?: string
  max?: string
  step?: string
  readOnly?: boolean
  className?: string
}

export function InputNumber({
  label,
  value,
  onChange,
  error,
  placeholder,
  min,
  max,
  step,
  readOnly = false,
  className = ''
}: InputNumberProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          readOnly ? 'bg-gray-50 cursor-not-allowed' : ''
        } ${className}`}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
