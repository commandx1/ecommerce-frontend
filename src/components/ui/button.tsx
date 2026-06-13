import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/60 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-panel",
        hero: "bg-brand-strong text-primary-foreground shadow-panel hover:-translate-y-0.5 hover:brightness-110",
        unstyled: "",
        destructive:
          "bg-destructive text-white hover:-translate-y-0.5 hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-border-strong bg-surface-elevated text-text-primary shadow-soft hover:border-brand/35 hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-accent-strong text-accent-foreground shadow-soft hover:-translate-y-0.5 hover:brightness-105",
        ghost: "text-text-secondary hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        quiet:
          "border border-transparent bg-transparent text-text-secondary hover:border-border-soft hover:bg-surface-muted hover:text-text-primary",
        link: "text-brand underline-offset-4 hover:text-brand-strong hover:underline",
      },
      size: {
        default: "h-9 px-5 py-2 has-[>svg]:px-4",
        sm: "h-7 gap-1.5 px-4 text-[0.8125rem] has-[>svg]:px-3",
        lg: "h-11 px-7 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild && !loading ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled ?? loading}
      {...props}
    >
      {asChild ? children : (
        <>
          {loading ? <Loader2 className="animate-spin" /> : null}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
