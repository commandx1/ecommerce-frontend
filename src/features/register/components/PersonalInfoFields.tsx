import type { ChangeEvent } from "react"
import { TextField } from "@/components/form/TextField"
import type { RegisterFormData, RegisterFormErrors } from "@/features/register/types"
import { formatPhoneNumber } from "@/lib/utils/phone-number"

interface PersonalInfoFieldsProps {
  formData: RegisterFormData
  errors: RegisterFormErrors
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPhoneNumberChange: (value: string) => void
  emailReadOnly?: boolean
}

export default function PersonalInfoFields({
  formData,
  errors,
  onChange,
  onPhoneNumberChange,
  emailReadOnly,
}: PersonalInfoFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          id="name"
          label="First Name"
          name="name"
          required
          value={formData.name}
          onChange={onChange}
          placeholder="Enter your first name"
          error={errors.name}
        />
        <TextField
          id="surname"
          label="Last Name"
          name="surname"
          required
          value={formData.surname}
          onChange={onChange}
          placeholder="Enter your last name"
          error={errors.surname}
        />
      </div>

      <TextField
        id="email"
        label="Email Address"
        name="email"
        type="email"
        required
        value={formData.email}
        onChange={onChange}
        placeholder="professional@example.com"
        error={errors.email}
        readOnly={emailReadOnly}
      />

      <TextField
        id="phoneNumber"
        label="Phone Number"
        name="phoneNumber"
        type="tel"
        required
        value={formatPhoneNumber(formData.phoneNumber)}
        onChange={(event) => onPhoneNumberChange(event.target.value)}
        placeholder="(555) 123-4567"
        error={errors.phoneNumber}
      />
    </div>
  )
}
