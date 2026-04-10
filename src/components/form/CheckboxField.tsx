import type { ComponentProps } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
        <Label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
        </Label>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>
    </div>
  )
}
