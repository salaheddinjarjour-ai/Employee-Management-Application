import React, { forwardRef } from 'react'
import { cn } from '../ui/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...rest }, ref) => {
    // Convert accidental controlled inputs to uncontrolled unless onChange is provided
    const { value, onChange } = rest
    const controlled = typeof value !== 'undefined'
    const safeProps = controlled && !onChange
      ? { ...rest, defaultValue: value as any, value: undefined }
      : rest

    return (
      <div className="space-y-1">
        <input
          ref={ref}
          {...safeProps}
          className={cn(
            "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-right text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500",
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          dir="rtl"
          // Ensure editable
          readOnly={false}
          disabled={safeProps.disabled ?? false}
        />
        {error && <p className="text-xs text-red-600 text-right">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
