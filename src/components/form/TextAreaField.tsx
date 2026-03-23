import type { ComponentProps } from "react"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { FormField } from "./FormField"

const baseTextAreaClassName =
  "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none"

interface TextAreaFieldProps extends Omit<ComponentProps<"textarea">, "className"> {
  label: string
  error?: string
  containerClassName?: string
  textAreaClassName?: string
}

export const TextAreaField = ({
  label,
  error,
  containerClassName,
  textAreaClassName,
  id,
  required,
  ...props
}: TextAreaFieldProps) => {
  return (
    <FormField label={label} htmlFor={id} required={required} error={error} className={containerClassName}>
      <Textarea
        id={id}
        className={cn(baseTextAreaClassName, error ? "border-red-500" : "border-gray-300", textAreaClassName)}
        {...props}
      />
    </FormField>
  )
}
