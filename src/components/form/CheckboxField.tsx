import type { ComponentProps } from "react"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface CheckboxFieldProps extends Omit<ComponentProps<typeof Checkbox>, "className"> {
  label: string
  description?: string
  containerClassName?: string
  checkboxClassName?: string
}

export const CheckboxField = ({
  label,
  description,
  containerClassName,
  checkboxClassName,
  id,
  disabled,
  ...props
}: CheckboxFieldProps) => {
  return (
    <div className={cn("flex items-start gap-3", containerClassName)}>
      <Checkbox id={id} className={checkboxClassName} disabled={disabled} {...props} />
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  )
}
