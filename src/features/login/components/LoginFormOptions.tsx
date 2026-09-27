import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface LoginFormOptionsProps {
  keepSignedIn: boolean
  onKeepSignedInChange: (value: boolean) => void
  onForgotPassword: () => void
  isSubmitting: boolean
}

export default function LoginFormOptions({
  keepSignedIn,
  onKeepSignedInChange,
  onForgotPassword,
  isSubmitting,
}: LoginFormOptionsProps) {
  const keepSignedInId = useId()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Checkbox
          id={keepSignedInId}
          checked={keepSignedIn}
          onChange={(event) => onKeepSignedInChange(event.target.checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor={keepSignedInId} className="text-sm text-text-secondary">
          Keep me signed in
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
