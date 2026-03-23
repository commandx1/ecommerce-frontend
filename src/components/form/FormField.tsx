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
      <Label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required ? "*" : ""}
      </Label>
      {children}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
