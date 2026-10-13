import React from 'react'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  helper?: string
  children: React.ReactNode
}

export function Field({ label, required, error, helper, children }: FieldProps) {
  // Clone children and pass error prop if it's a form component
  const childrenWithError = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as any, { error })
    }
    return child
  })

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 text-right">
        {label}
        {required && (
          <span className="text-red-500 mr-1" aria-label="مطلوب">
            *
          </span>
        )}
      </label>
      
      {childrenWithError}
      
      {helper && !error && (
        <p className="text-xs text-gray-500 text-right">
          {helper}
        </p>
      )}
    </div>
  )
}

export default Field
