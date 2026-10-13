import React, { forwardRef } from 'react'
import { cn } from '../ui/utils'

interface SelectOption {
  label: string
  value: string | number
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  error?: string
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...rest }, ref) => {
    // Convert accidental controlled inputs to uncontrolled unless onChange is provided
    const { value, onChange } = rest
    const controlled = typeof value !== 'undefined'
    const safeProps = controlled && !onChange
      ? { ...rest, defaultValue: value as any, value: undefined }
      : rest

    return (
      <div className="space-y-1">
        <select
          ref={ref}
          {...safeProps}
          className={cn(
            "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-right text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500",
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          dir="rtl"
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 text-right">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
