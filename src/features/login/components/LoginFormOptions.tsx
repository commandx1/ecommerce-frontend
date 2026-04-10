import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface LoginFormOptionsProps {
  rememberMe: boolean
  onRememberMeChange: (value: boolean) => void
  onForgotPassword: () => void
  isSubmitting: boolean
}

export default function LoginFormOptions({
  rememberMe,
  onRememberMeChange,
  onForgotPassword,
  isSubmitting,
}: LoginFormOptionsProps) {
  const rememberMeId = useId()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Checkbox
          id={rememberMeId}
          checked={rememberMe}
          onChange={(event) => onRememberMeChange(event.target.checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor={rememberMeId} className="text-sm text-text-secondary">
          Remember me
        </Label>
      </div>
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={onForgotPassword}
        className="h-auto p-0 text-sm font-medium"
        disabled={isSubmitting}
      >
        Forgot password?
      </Button>
    </div>
  )
}
