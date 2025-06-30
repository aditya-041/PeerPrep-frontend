import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

export const Badge = ({ className = "", variant = "default", ...props }: BadgeProps) => {
  let baseStyles = "inline-block px-2 py-1 text-xs font-semibold rounded";

  let variantStyle = {
    default: "bg-blue-600 text-white",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-700",
  }[variant];

  return <div className={`${baseStyles} ${variantStyle} ${className}`} {...props} />
}
