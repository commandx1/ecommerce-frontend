import * as React from "react"

import { cn } from "@/lib/utils"

const Radio = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="radio"
      className={cn(
        "h-4 w-4 rounded-full border border-gray-300 accent-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
})

Radio.displayName = "Radio"

export { Radio }
