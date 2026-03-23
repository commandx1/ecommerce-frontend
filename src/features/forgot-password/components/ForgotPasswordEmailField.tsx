import { Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/form/FormField"
import { cn } from "@/lib/utils"

interface ForgotPasswordEmailFieldProps {
  value: string
  onChange: (value: string) => void
  isSubmitting: boolean
}

export default function ForgotPasswordEmailField({ value, onChange, isSubmitting }: ForgotPasswordEmailFieldProps) {
  return (
    <FormField label="Email Address" htmlFor="forgot-password-email" required>
      <div className="relative">
        <Input
          id="forgot-password-email"
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter your registered email address"
          className={cn(
            "pl-12 pr-4 py-4 h-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent text-gray-900 placeholder-gray-500",
          )}
          required
          disabled={isSubmitting}
        />
        <Mail className="absolute left-4 top-3 text-gray-400 w-6 h-6" />
      </div>
    </FormField>
  )
}
