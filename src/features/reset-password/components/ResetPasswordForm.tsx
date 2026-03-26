import type { ChangeEventHandler, FormEventHandler } from "react"
import { useId } from "react"
import { PasswordField } from "@/components/form/PasswordField"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"

interface ResetPasswordFormProps {
  password: string
  confirmPassword: string
  isSubmitting: boolean
  onChange: ChangeEventHandler<HTMLInputElement>
  onSubmit: FormEventHandler<HTMLFormElement>
}

export default function ResetPasswordForm({
  password,
  confirmPassword,
  isSubmitting,
  onChange,
  onSubmit,
}: ResetPasswordFormProps) {
  const id = useId()

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PasswordField
        id={`${id}-password`}
        label="New Password"
        name="password"
        required
        value={password}
        onChange={onChange}
        placeholder="••••••••"
        disabled={isSubmitting}
      />

      <PasswordField
        id={`${id}-confirm-password`}
        label="Confirm Password"
        name="confirmPassword"
        required
        value={confirmPassword}
        onChange={onChange}
        placeholder="••••••••"
        disabled={isSubmitting}
      />

      <AsyncSubmitButton
        idleText="Update Password"
        submittingText="Updating..."
        isSubmitting={isSubmitting}
        size="lg"
        className="rounded-xl"
      />
    </form>
  )
}
