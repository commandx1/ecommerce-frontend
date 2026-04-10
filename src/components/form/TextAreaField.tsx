import type { ComponentProps } from "react"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { FormField } from "./FormField"

const baseTextAreaClassName = "w-full resize-none rounded-2xl px-4 py-3"

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
        className={cn(
          baseTextAreaClassName,
          error && "border-danger focus-visible:border-danger focus-visible:ring-danger/20",
          textAreaClassName,
        )}
        {...props}
      />
    </FormField>
  )
}
