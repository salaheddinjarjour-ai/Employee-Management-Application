import React from 'react'

interface InputTextProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

export default function InputText({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  className = '',
  ...rest 
}: InputTextProps) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...rest}
    />
  )
}
