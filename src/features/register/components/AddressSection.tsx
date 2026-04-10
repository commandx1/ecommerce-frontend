import { useId } from "react"
import AddressAutocomplete from "@/components/AddressAutocomplete"
import { TextField } from "@/components/form/TextField"
import type { ParsedAddress, RegisterAddress, RegisterFormErrors } from "@/features/register/types"

interface AddressSectionProps {
  address: RegisterAddress
  errors: RegisterFormErrors
  onAddressSelect: (address: ParsedAddress) => void
  onAddressFieldChange: (field: keyof RegisterAddress, value: string) => void
  onPostalCodeChange: (value: string) => void
}

export default function AddressSection({
  address,
  errors,
  onAddressSelect,
  onAddressFieldChange,
  onPostalCodeChange,
}: AddressSectionProps) {
  const idBase = useId()

  const selectedAddress = address.placeId
    ? {
        country: address.country,
        state: address.state,
        city: address.city,
        district: address.district,
        postalCode: address.postalCode,
        addressLine: address.addressLine,
        latitude: address.latitude,
        longitude: address.longitude,
        placeId: address.placeId,
        formattedAddress: address.formattedAddress,
      }
    : null

  return (
    <div className="border-t border-border-soft pt-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Address Information</h3>
      <AddressAutocomplete onSelect={onAddressSelect} selectedAddress={selectedAddress} error={errors.address} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <TextField
          id={`${idBase}-addressTitle`}
          label="Address Title"
          value={address.title}
          onChange={(event) => onAddressFieldChange("title", event.target.value)}
          placeholder="Home, Office, etc."
        />
        <TextField
          id={`${idBase}-addressFullName`}
          label="Full Name"
          value={address.fullName}
          onChange={(event) => onAddressFieldChange("fullName", event.target.value)}
          placeholder="Full name for delivery"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <TextField
          id={`${idBase}-addressState`}
          label="State"
          value={address.state}
          disabled
          inputClassName="cursor-not-allowed bg-surface-muted text-text-muted"
        />
        <TextField
          id={`${idBase}-addressCity`}
          label="City"
          value={address.city}
          disabled
          inputClassName="cursor-not-allowed bg-surface-muted text-text-muted"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <TextField
          id={`${idBase}-addressPostalCode`}
          label="Zip Code"
          required
          value={address.postalCode}
          onChange={(event) => onPostalCodeChange(event.target.value)}
          placeholder="Enter zip code"
          error={errors.addressPostalCode}
        />
        <TextField
          id={`${idBase}-addressLine`}
          label="Address Line"
          value={address.addressLine}
          disabled
          inputClassName="cursor-not-allowed bg-surface-muted text-text-muted"
        />
      </div>
    </div>
  )
}
