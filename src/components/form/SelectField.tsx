import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { FormField } from "./FormField"

const baseSelectClassName =
  "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent bg-white"

interface SelectFieldProps extends Omit<ComponentProps<"select">, "className"> {
  label: string
  error?: string
  containerClassName?: string
  selectClassName?: string
}

export const SelectField = ({
  label,
  error,
  containerClassName,
  selectClassName,
  id,
  required,
  children,
  ...props
}: SelectFieldProps) => {
  return (
    <FormField label={label} htmlFor={id} required={required} error={error} className={containerClassName}>
      <select
        id={id}
        className={cn(baseSelectClassName, error ? "border-red-500" : "border-gray-300", selectClassName)}
        {...props}
      >
        {children}
      </select>
    </FormField>
  )
}
