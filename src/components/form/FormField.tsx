import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}

export const FormField = ({ label, htmlFor, required, error, className, children }: FormFieldProps) => {
  return (
    <div className={cn(className)}>
      <Label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-text-primary">
        {label} {required ? "*" : ""}
      </Label>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
