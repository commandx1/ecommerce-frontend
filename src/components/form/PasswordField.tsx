import { Eye, EyeOff } from "lucide-react"
import type { ComponentProps } from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { textLikeControlClassName } from "./controlStyles"
import { FormField } from "./FormField"

const baseInputClassName = cn("w-full pr-12", textLikeControlClassName)

interface PasswordFieldProps extends Omit<ComponentProps<"input">, "className" | "type"> {
  label: string
  error?: string
  containerClassName?: string
  inputClassName?: string
}

export const PasswordField = ({
  label,
  error,
  containerClassName,
  inputClassName,
  id,
  required,
  ...props
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const ariaInvalid = Boolean(error) || props["aria-invalid"]

  return (
    <FormField label={label} htmlFor={id} required={required} error={error} className={containerClassName}>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          aria-invalid={ariaInvalid}
          className={cn(baseInputClassName, error ? "border-danger" : "", inputClassName)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </FormField>
  )
}
