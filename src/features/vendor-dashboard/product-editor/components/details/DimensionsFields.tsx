import type { ClipboardEvent, KeyboardEvent } from "react"
import { FieldError, type FieldGroupProps, fieldClass, LABEL_CLASS } from "../field-styles"

const DIMENSIONS = [
  ["height", "Height"],
  ["length", "Length"],
  ["width", "Width"],
  ["weight", "Weight *"],
] as const

// type="number" still accepts exponent and sign characters; these fields are plain decimals.
const blockInvalidNumberKey = (e: KeyboardEvent<HTMLInputElement>) => {
  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault()
}

const blockInvalidNumberPaste = (e: ClipboardEvent<HTMLInputElement>) => {
  if (!/^\d*\.?\d*$/.test(e.clipboardData.getData("text"))) e.preventDefault()
}

export default function DimensionsFields({ values, errors, locked, onInputChange }: FieldGroupProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-text-primary mb-3">Dimensions & Weight</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {DIMENSIONS.map(([field, label]) => (
          <div key={field}>
            <label htmlFor={field} className={LABEL_CLASS}>
              {label}
            </label>
            <input
              id={field}
              type="number"
              name={field}
              value={values[field]}
              onChange={onInputChange}
              onKeyDown={blockInvalidNumberKey}
              onPaste={blockInvalidNumberPaste}
              min="0"
              step="0.01"
              inputMode="decimal"
              disabled={locked}
              className={fieldClass(Boolean(errors[field]), true)}
              placeholder="0.00"
            />
            <FieldError message={errors[field]} />
          </div>
        ))}
      </div>
    </div>
  )
}
