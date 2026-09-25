import type { RegisterPayload } from "@/lib/api/auth-direct"
import { normalizePhoneNumber } from "@/lib/utils/phone-number"

export const initialFormData: RegisterPayload = {
  name: "",
  surname: "",
  email: "",
  password: "",
  phoneNumber: "",
  businessDescribe: "",
  address: {
    title: "Business",
    fullName: "",
    phoneNumber: "",
    country: "",
    state: "",
    city: "",
    district: "",
    postalCode: "",
    addressLine: "",
    defaultAddress: true,
    latitude: 0,
    longitude: 0,
    placeId: "",
    formattedAddress: "",
  },
  company: {
    name: "",
    companyPhoto: "",
    taxNumber: "",
    email: "",
    phoneNumber: "",
    website: "",
    description: "",
    active: true,
    shipmentPolicy: "",
  },
}

/**
 * Both register endpoints deserialize into an AddressCreateRequest with no `state` field, so the
 * selected state is sent in `city`. Both flows build the address here so they store it the same way.
 */
export function buildAddressPayload(formData: RegisterPayload): RegisterPayload["address"] {
  const fullName = `${formData.name} ${formData.surname}`.trim()

  return {
    ...formData.address,
    city: formData.address.state,
    fullName: fullName || formData.address.fullName,
    phoneNumber: normalizePhoneNumber(formData.phoneNumber),
  }
}
