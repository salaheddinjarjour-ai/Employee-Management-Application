import React, { forwardRef } from 'react'
import { cn } from '../ui/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...rest }, ref) => {
    // Convert accidental controlled inputs to uncontrolled unless onChange is provided
    const { value, onChange } = rest
    const controlled = typeof value !== 'undefined'
    const safeProps = controlled && !onChange
      ? { ...rest, defaultValue: value as any, value: undefined }
      : rest

    return (
      <div className="space-y-1">
        <textarea
          ref={ref}
          {...safeProps}
          className={cn(
            "w-full px-3 py-2 text-right text-[14px] bg-white border border-gray-300 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors resize-vertical min-h-[80px]",
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

Textarea.displayName = 'Textarea'

export default Textarea
