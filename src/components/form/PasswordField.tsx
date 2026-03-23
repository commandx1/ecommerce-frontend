import type { ComponentProps } from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { FormField } from "./FormField"

const baseInputClassName =
  "w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"

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

  return (
    <FormField label={label} htmlFor={id} required={required} error={error} className={containerClassName}>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          className={cn(baseInputClassName, error ? "border-red-500" : "border-gray-300", inputClassName)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
    </FormField>
  )
}
