import * as React from "react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
        <input
          type="checkbox"
          ref={ref}
          className={`w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 ${className}`}
          {...props}
        />
        <span>{label}</span>
      </label>
    )
  }
)

Checkbox.displayName = "Checkbox"
