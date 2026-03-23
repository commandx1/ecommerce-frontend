import type { ChangeEventHandler } from "react"
import { PasswordField } from "@/components/form/PasswordField"
import { TextField } from "@/components/form/TextField"
import type { LoginFormData } from "@/features/login/types"

interface LoginFormFieldsProps {
  formData: LoginFormData
  onChange: ChangeEventHandler<HTMLInputElement>
  isSubmitting: boolean
}

export default function LoginFormFields({ formData, onChange, isSubmitting }: LoginFormFieldsProps) {
  return (
    <div className="space-y-6">
      <TextField
        id="email"
        label="Email Address"
        name="email"
        type="email"
        required
        value={formData.email}
        onChange={onChange}
        placeholder="professional@example.com"
        disabled={isSubmitting}
      />

      <PasswordField
        id="password"
        label="Password"
        name="password"
        required
        value={formData.password}
        onChange={onChange}
        placeholder="Enter your password"
        disabled={isSubmitting}
      />
    </div>
  )
}
