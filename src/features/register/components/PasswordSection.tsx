import { Check, Circle } from "lucide-react"
import type { ChangeEvent } from "react"
import zxcvbn from "zxcvbn"
import { PasswordField } from "@/components/form/PasswordField"
import type { RegisterFormErrors } from "@/features/register/types"

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
  const strengthScore = password ? zxcvbn(password).score : 0
  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][strengthScore] ?? "Very weak"

  const passwordRules = [
    { label: "At least 6 characters", isValid: password.length >= 6 },
    { label: "At least one uppercase letter", isValid: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter", isValid: /[a-z]/.test(password) },
    { label: "At least one number", isValid: /\d/.test(password) },
    { label: "At least one special character", isValid: /[^A-Za-z0-9]/.test(password) },
  ]

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

      <div className="rounded-xl border border-border-soft bg-surface-elevated p-4">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">Password strength</span>
            <span className="text-text-secondary">{strengthLabel}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-2 rounded-full ${
                  index < strengthScore
                    ? "bg-brand"
                    : index === strengthScore && password
                      ? "bg-brand/60"
                      : "bg-surface-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="mb-3 text-sm font-medium text-text-primary">Password rules</p>
        <ul className="space-y-2">
          {passwordRules.map((rule) => (
            <li
              key={rule.label}
              className={`flex items-center gap-2 text-sm ${rule.isValid ? "text-success" : "text-text-muted"}`}
            >
              {rule.isValid ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              <span>{rule.label}</span>
            </li>
          ))}
        </ul>
      </div>

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
