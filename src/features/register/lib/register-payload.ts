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
 * The backend deserializes both /users/register and /users/register/vendor/invite into the same
 * AddressCreateRequest, which has no `state` field. The dentist flow has always compensated by
 * sending the selected state in `city`; the vendor invite flow sent the raw locality instead, so
 * the very same picked address ended up stored differently depending on which endpoint created
 * it. Both flows now build the address here.
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
