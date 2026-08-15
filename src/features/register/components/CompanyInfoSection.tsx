import { TextAreaField } from "@/components/form/TextAreaField"
import { TextField } from "@/components/form/TextField"
import type { RegisterFormData, RegisterFormErrors } from "@/features/register/types"
import { formatPhoneNumber } from "@/lib/utils/phone-number"

interface CompanyInfoSectionProps {
  company: RegisterFormData["company"]
  errors: RegisterFormErrors
  onFieldChange: (field: keyof RegisterFormData["company"], value: string) => void
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

        <TextField
          id="companyWebsite"
          label="Website"
          value={company.website}
          onChange={(e) => onFieldChange("website", e.target.value)}
          placeholder="www.company.com"
        />

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
