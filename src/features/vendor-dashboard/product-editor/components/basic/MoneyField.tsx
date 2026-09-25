import type { ChangeEvent, ReactNode } from "react"
import { FieldError, fieldClass, LABEL_CLASS } from "../field-styles"

interface MoneyFieldProps {
  name: string
  label: ReactNode
  value: string
  error?: string
  /** "1" for whole-number fields (stock); money fields default to cents. */
  step?: "0.01" | "1"
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

/** A non-negative number input of the Pricing & Inventory grid (price, stock, fees, discount). */
export default function MoneyField({ name, label, value, error, step = "0.01", onChange }: MoneyFieldProps) {
  return (
    <div>
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={name}
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min="0"
        step={step}
        className={fieldClass(Boolean(error))}
        placeholder={step === "1" ? "0" : "0.00"}
      />
      <FieldError message={error} />
    </div>
  )
}
