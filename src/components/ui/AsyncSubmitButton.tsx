import { Loader2 } from "lucide-react"
import type { ReactNode } from "react"
import ActionButton from "@/components/ui/ActionButton"

interface AsyncSubmitButtonProps {
  idleText: string
  submittingText?: string
  isSubmitting: boolean
  disabled?: boolean
  intent?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
  className?: string
  icon?: ReactNode
  type?: "submit" | "button"
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export default function AsyncSubmitButton({
  idleText,
  submittingText,
  isSubmitting,
  disabled,
  intent = "primary",
  size = "md",
  fullWidth = true,
  className,
  icon,
  type = "submit",
  onClick,
}: AsyncSubmitButtonProps) {
  const label = isSubmitting ? submittingText || idleText : idleText

  return (
    <ActionButton
      type={type}
      onClick={onClick}
      intent={intent}
      size={size}
      fullWidth={fullWidth}
      className={className}
      disabled={isSubmitting || disabled}
    >
      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      <span>{label}</span>
      {!isSubmitting && icon ? icon : null}
    </ActionButton>
  )
}
