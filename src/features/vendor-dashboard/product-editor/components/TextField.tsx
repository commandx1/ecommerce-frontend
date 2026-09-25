import type { ChangeEvent } from "react"
import { FieldError, fieldClass, LABEL_CLASS } from "./field-styles"

interface TextFieldProps {
  name: string
  label: string
  value: string
  placeholder: string
  error?: string
  type?: "text" | "url"
  /** Catalogue field: disabled (and styled so) once a loaded listing locks it. */
  locked?: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

/** Labelled text input whose `id`/`name` is the form field name (the label/RTL/e2e contract). */
export default function TextField({
  name,
  label,
  value,
  placeholder,
  error,
  type = "text",
  locked,
  onChange,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={locked}
        className={fieldClass(Boolean(error), locked !== undefined)}
        placeholder={placeholder}
      />
      <FieldError message={error} />
    </div>
  )
}
