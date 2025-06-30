import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium rounded-md transition focus:outline-none";

    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    }

    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1 text-sm",
      lg: "px-5 py-3 text-base",
    }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
