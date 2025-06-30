import * as React from "react"

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollArea.displayName = "ScrollArea"
