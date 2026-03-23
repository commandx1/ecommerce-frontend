import type { ChangeEventHandler, FormEventHandler } from "react"
import { PasswordField } from "@/components/form/PasswordField"

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
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PasswordField
        id="password"
        label="New Password"
        name="password"
        required
        value={password}
        onChange={onChange}
        placeholder="••••••••"
        disabled={isSubmitting}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm Password"
        name="confirmPassword"
        required
        value={confirmPassword}
        onChange={onChange}
        placeholder="••••••••"
        disabled={isSubmitting}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 font-semibold text-lg transition-all disabled:opacity-50"
      >
        {isSubmitting ? "Updating..." : "Update Password"}
      </button>
    </form>
  )
}
