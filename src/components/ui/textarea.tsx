import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex w-full rounded-2xl border border-transparent bg-surface-elevated px-4 py-3 text-sm text-text-primary shadow-soft transition-[color,box-shadow,border-color,background-color] placeholder:text-text-muted focus-visible:border-brand/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = "Textarea"

export { Textarea }
