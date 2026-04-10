import { cva, type VariantProps } from "class-variance-authority"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const actionButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      intent: {
        primary: "bg-brand text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:bg-brand-strong",
        secondary: "bg-accent-strong text-accent-foreground shadow-soft hover:-translate-y-0.5 hover:brightness-105",
        outline:
          "border border-border-strong bg-surface-elevated text-text-primary hover:border-brand/35 hover:bg-accent",
        ghost: "text-brand hover:bg-accent",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-12 px-7 text-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
      fullWidth: false,
    },
  },
)

type ActionButtonProps = Omit<React.ComponentProps<typeof Button>, "variant" | "size"> &
  VariantProps<typeof actionButtonVariants>

export default function ActionButton({ className, intent, size, fullWidth, ...props }: ActionButtonProps) {
  return (
    <Button
      variant="unstyled"
      className={cn(actionButtonVariants({ intent, size, fullWidth }), className)}
      {...props}
    />
  )
}
