import AddressAutocomplete from "@/components/AddressAutocomplete"
import type { ParsedAddress, RegisterAddress, RegisterFormErrors } from "@/features/register/types"
import { TextField } from "@/components/form/TextField"

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
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
      <AddressAutocomplete onSelect={onAddressSelect} selectedAddress={selectedAddress} error={errors.address} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <TextField
          id="addressTitle"
          label="Address Title"
          value={address.title}
          onChange={(event) => onAddressFieldChange("title", event.target.value)}
          placeholder="Home, Office, etc."
        />
        <TextField
          id="addressFullName"
          label="Full Name"
          value={address.fullName}
          onChange={(event) => onAddressFieldChange("fullName", event.target.value)}
          placeholder="Full name for delivery"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <TextField
          id="addressState"
          label="State"
          value={address.state}
          disabled
          inputClassName="bg-gray-50 text-gray-600 cursor-not-allowed"
        />
        <TextField
          id="addressCity"
          label="City"
          value={address.city}
          disabled
          inputClassName="bg-gray-50 text-gray-600 cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <TextField
          id="addressPostalCode"
          label="Zip Code"
          required
          value={address.postalCode}
          onChange={(event) => onPostalCodeChange(event.target.value)}
          placeholder="Enter zip code"
          error={errors.addressPostalCode}
        />
        <TextField
          id="addressLine"
          label="Address Line"
          value={address.addressLine}
          disabled
          inputClassName="bg-gray-50 text-gray-600 cursor-not-allowed"
        />
      </div>
    </div>
  )
}
