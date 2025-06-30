import * as React from "react"

export function Separator({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`w-full h-px bg-gray-200 my-4 ${className}`} {...props} />
}
