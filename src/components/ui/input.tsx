import { forwardRef } from "react"
import { cn } from "@/lib/utils"

const Input = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-white selection:text-primary-foreground dark:bg-input/30 h-11 w-full min-w-0 rounded-2xl border border-transparent bg-surface-elevated px-4 py-2 text-sm text-text-primary shadow-soft transition-[color,box-shadow,border-color,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-brand/40 focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }
