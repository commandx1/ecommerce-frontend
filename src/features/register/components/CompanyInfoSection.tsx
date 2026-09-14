import { SelectField } from "@/components/form/SelectField"
import { TextAreaField } from "@/components/form/TextAreaField"
import { TextField } from "@/components/form/TextField"
import type { RegisterFormErrors } from "@/features/register/types"
import type { CompanyPayload } from "@/lib/api/auth-direct"
import { formatPhoneNumber } from "@/lib/utils/phone-number"

const SHIPMENT_POLICY_OPTIONS = [
  { value: "ONE_DAY", label: "Ships within 1 day" },
  { value: "TWO_DAYS", label: "Ships within 2 days" },
  { value: "THREE_DAYS", label: "Ships within 3 days" },
  { value: "FOUR_DAYS", label: "Ships within 4 days" },
  { value: "FIVE_DAYS", label: "Ships within 5 days" },
]

interface CompanyInfoSectionProps {
  company: CompanyPayload
  errors: RegisterFormErrors
  onFieldChange: (field: keyof CompanyPayload, value: string) => void
  onPhoneNumberChange: (value: string) => void
}

export default function CompanyInfoSection({
  company,
  errors,
  onFieldChange,
  onPhoneNumberChange,
}: CompanyInfoSectionProps) {
  return (
    <div className="border-t border-border-soft pt-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Company Information</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            id="companyName"
            label="Company Name"
            required
            value={company.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="Enter company name"
            error={errors.companyName}
          />
          <TextField
            id="taxNumber"
            label="Tax Number"
            required
            value={company.taxNumber}
            onChange={(e) => onFieldChange("taxNumber", e.target.value)}
            placeholder="Enter tax number"
            error={errors.taxNumber}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            id="companyEmail"
            label="Company Email"
            type="email"
            required
            value={company.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            placeholder="info@company.com"
            error={errors.companyEmail}
          />
          <TextField
            id="companyPhoneNumber"
            label="Company Phone"
            type="tel"
            required
            value={formatPhoneNumber(company.phoneNumber)}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="(555) 123-4567"
            error={errors.companyPhoneNumber}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            id="companyWebsite"
            label="Website"
            value={company.website}
            onChange={(e) => onFieldChange("website", e.target.value)}
            placeholder="www.company.com"
          />
          <SelectField
            id="shipmentPolicy"
            name="shipmentPolicy"
            label="Shipment Policy"
            required
            value={company.shipmentPolicy}
            onChange={(e) => onFieldChange("shipmentPolicy", e.target.value)}
            error={errors.shipmentPolicy}
          >
            <option value="">Select shipment policy</option>
            {SHIPMENT_POLICY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>

        <TextAreaField
          id="companyDescription"
          label="Description"
          value={company.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          placeholder="Briefly describe your company and services"
          rows={3}
        />

        <TextField
          id="companyPhoto"
          label="Company Logo URL"
          value={company.companyPhoto}
          onChange={(e) => onFieldChange("companyPhoto", e.target.value)}
          placeholder="https://cdn.example.com/logo.png"
        />
      </div>
    </div>
  )
}
