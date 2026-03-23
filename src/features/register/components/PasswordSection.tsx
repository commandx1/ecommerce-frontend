import type { ChangeEvent } from "react"
import type { RegisterFormErrors } from "@/features/register/types"
import { PasswordField } from "@/components/form/PasswordField"

interface PasswordSectionProps {
  password: string
  confirmPassword: string
  errors: RegisterFormErrors
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onConfirmPasswordChange: (value: string) => void
}

export default function PasswordSection({
  password,
  confirmPassword,
  errors,
  onPasswordChange,
  onConfirmPasswordChange,
}: PasswordSectionProps) {
  return (
    <>
      <PasswordField
        id="password"
        label="Password"
        name="password"
        required
        value={password}
        onChange={onPasswordChange}
        placeholder="Enter a strong password"
        error={errors.password}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm Password"
        required
        value={confirmPassword}
        onChange={(event) => onConfirmPasswordChange(event.target.value)}
        placeholder="Confirm your password"
        error={errors.confirmPassword}
      />
    </>
  )
}
