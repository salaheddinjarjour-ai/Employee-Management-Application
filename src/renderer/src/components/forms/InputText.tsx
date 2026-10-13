import React from 'react'

interface InputTextProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url'
  required?: boolean
  className?: string
}

export function InputText({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  required = false,
  className = ''
}: InputTextProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
