import { describe, expect, it } from "vitest"
import type { RegisterPayload } from "@/lib/api/auth-direct"
import { buildAddressPayload, initialFormData } from "./register-payload"

const baseFormData: RegisterPayload = {
  ...initialFormData,
  name: "jane",
  surname: "doe",
  phoneNumber: "555 123 4567",
  address: {
    ...initialFormData.address,
    state: "CA",
    fullName: "",
  },
}

describe("initialFormData", () => {
  it("defaults the address title to Business and marks it default", () => {
    expect(initialFormData.address.title).toBe("Business")
    expect(initialFormData.address.defaultAddress).toBe(true)
  })

  it("defaults the company as active with every string field blank", () => {
    expect(initialFormData.company?.active).toBe(true)
    expect(initialFormData.company?.name).toBe("")
  })
})

describe("buildAddressPayload", () => {
  it("moves the picked state abbreviation into city (the backend has no state column)", () => {
    const result = buildAddressPayload(baseFormData)

    expect(result.city).toBe("CA")
  })

  it("builds fullName from name + surname when the address has none yet", () => {
    const result = buildAddressPayload(baseFormData)

    expect(result.fullName).toBe("jane doe")
  })

  it("keeps the address's own fullName when name and surname are both blank", () => {
    const result = buildAddressPayload({
      ...baseFormData,
      name: "",
      surname: "",
      address: { ...baseFormData.address, fullName: "Existing Name" },
    })

    expect(result.fullName).toBe("Existing Name")
  })

  it("normalizes the phone number the same way handlePhoneNumberChange does", () => {
    const result = buildAddressPayload(baseFormData)

    expect(result.phoneNumber).toBe("5551234567")
  })

  it("carries every other address field through unchanged", () => {
    const withGeo: RegisterPayload = {
      ...baseFormData,
      address: {
        ...baseFormData.address,
        placeId: "place-1",
        formattedAddress: "1600 Amphitheatre Pkwy",
        latitude: 37.422,
        longitude: -122.084,
      },
    }

    const result = buildAddressPayload(withGeo)

    expect(result.placeId).toBe("place-1")
    expect(result.formattedAddress).toBe("1600 Amphitheatre Pkwy")
    expect(result.latitude).toBe(37.422)
    expect(result.longitude).toBe(-122.084)
  })
})
