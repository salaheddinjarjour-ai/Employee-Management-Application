import React from 'react'

interface InputNumberProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: string | number
}

export default function InputNumber({ 
  value, 
  onChange, 
  min, 
  max, 
  step = "any", 
  disabled, 
  className = '',
  ...rest 
}: InputNumberProps) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      max={max}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...rest}
    />
  )
}
