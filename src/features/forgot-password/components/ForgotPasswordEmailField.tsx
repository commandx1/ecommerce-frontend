import { Mail } from "lucide-react"
import { useId } from "react"
import { FormField } from "@/components/form/FormField"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ForgotPasswordEmailFieldProps {
  value: string
  onChange: (value: string) => void
  isSubmitting: boolean
}

export default function ForgotPasswordEmailField({ value, onChange, isSubmitting }: ForgotPasswordEmailFieldProps) {
  const inputId = useId()

  return (
    <FormField label="Email Address" htmlFor={inputId} required>
      <div className="relative">
        <Input
          id={inputId}
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter your registered email address"
          className={cn("h-12 rounded-xl pl-12 pr-4 py-4")}
          required
          disabled={isSubmitting}
        />
        <Mail className="absolute left-4 top-3 w-6 h-6 text-text-muted" />
      </div>
    </FormField>
  )
}
