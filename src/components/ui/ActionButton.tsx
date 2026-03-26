import { cva, type VariantProps } from "class-variance-authority"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const actionButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      intent: {
        primary: "bg-steel-blue text-white hover:bg-opacity-90",
        secondary: "bg-pale-lime text-steel-blue hover:bg-opacity-90",
        outline: "border border-steel-blue text-steel-blue hover:bg-steel-blue hover:text-white",
        ghost: "text-steel-blue hover:bg-light-mint-gray",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-6 text-base",
        lg: "h-12 px-6 text-lg",
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
  return <Button className={cn(actionButtonVariants({ intent, size, fullWidth }), className)} {...props} />
}
