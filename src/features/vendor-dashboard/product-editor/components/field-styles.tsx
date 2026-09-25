import type { ChangeEvent } from "react"
import type { FieldErrors, ProductFormValues } from "../lib/product-form"

// Shared input chrome for the editor's form fields. The class strings are the ones the page has
// always rendered; `lockable` adds the disabled look used by catalogue fields a loaded product locks.
const FIELD_BASE = "rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
const LOCKED = "disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"

export function fieldClass(hasError: boolean, lockable = false): string {
  const border = hasError ? "border-destructive" : "border-border-soft"
  return `w-full px-4 py-3 border ${border} ${FIELD_BASE}${lockable ? ` ${LOCKED}` : ""}`
}

export const LABEL_CLASS = "block text-sm font-medium text-text-primary mb-2"

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-destructive text-sm mt-1">{message}</p> : null
}

/** What every field group of the form receives. `locked` = catalogue fields of a loaded listing. */
export interface FieldGroupProps {
  values: ProductFormValues
  errors: FieldErrors
  locked: boolean
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}
