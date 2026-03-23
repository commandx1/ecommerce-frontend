import type { ComponentProps } from "react"

import { Label } from "@/components/ui/label"
import { Radio } from "@/components/ui/radio"
import { cn } from "@/lib/utils"

interface RadioFieldProps extends Omit<ComponentProps<typeof Radio>, "className"> {
  label: string
  description?: string
  containerClassName?: string
  radioClassName?: string
}

export const RadioField = ({
  label,
  description,
  containerClassName,
  radioClassName,
  id,
  disabled,
  ...props
}: RadioFieldProps) => {
  return (
    <div className={cn("flex items-start gap-3", containerClassName)}>
      <Radio id={id} className={radioClassName} disabled={disabled} {...props} />
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  )
}
