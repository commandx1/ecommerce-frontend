import type { ChangeEvent } from "react"
import { BUSINESS_TYPE_OPTIONS } from "@/lib/constants/business-types"
import type { RegisterFormErrors } from "@/features/register/types"
import { SelectField } from "@/components/form/SelectField"

interface BusinessTypeFieldProps {
  value: string
  error?: RegisterFormErrors["businessDescribe"]
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}

export default function BusinessTypeField({ value, error, onChange }: BusinessTypeFieldProps) {
  return (
    <SelectField
      id="businessDescribe"
      label="Business Type"
      name="businessDescribe"
      required
      value={value}
      onChange={onChange}
      error={error}
    >
      <option value="">Select business type</option>
      {BUSINESS_TYPE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </SelectField>
  )
}
