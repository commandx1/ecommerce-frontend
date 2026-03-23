import type { ComponentProps } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { FormField } from "./FormField"

const baseInputClassName =
  "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"

interface TextFieldProps extends Omit<ComponentProps<"input">, "className"> {
  label: string
  error?: string
  containerClassName?: string
  inputClassName?: string
}

export const TextField = ({
  label,
  error,
  containerClassName,
  inputClassName,
  id,
  required,
  ...props
}: TextFieldProps) => {
  return (
    <FormField label={label} htmlFor={id} required={required} error={error} className={containerClassName}>
      <Input
        id={id}
        className={cn(baseInputClassName, error ? "border-red-500" : "border-gray-300", inputClassName)}
        {...props}
      />
    </FormField>
  )
}
