import type { ComponentProps } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { FormField } from "./FormField"

const baseInputClassName = "w-full"

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
  const ariaInvalid = Boolean(error) || props["aria-invalid"]

  return (
    <FormField label={label} htmlFor={id} required={required} error={error} className={containerClassName}>
      <Input
        id={id}
        aria-invalid={ariaInvalid}
        className={cn(baseInputClassName, error ? "border-danger" : "", inputClassName)}
        {...props}
      />
    </FormField>
  )
}
