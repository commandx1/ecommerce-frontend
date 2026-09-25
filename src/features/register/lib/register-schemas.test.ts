import { describe, expect, it } from "vitest"
import {
  ownerInviteSchema,
  PASSWORD_COMPLEXITY_REGEX,
  registerSchema,
  teamMemberInviteSchema,
} from "./register-schemas"

const validRegisterInput = {
  name: "Jane",
  surname: "Doe",
  email: "jane@example.com",
  phoneNumber: "5551234567",
  password: "secret1",
  confirmPassword: "secret1",
  address: {
    postalCode: "90001",
    placeId: "place-1",
  },
  businessDescribe: "General dentistry",
}

const validInviteInput = {
  name: "Jane",
  surname: "Doe",
  phoneNumber: "5551234567",
  password: "Secret1!",
  confirmPassword: "Secret1!",
}

const validOwnerInviteInput = {
  ...validInviteInput,
  address: {
    postalCode: "90001",
    placeId: "place-1",
  },
  company: {
    name: "Acme Dental",
    taxNumber: "TAX-1",
    email: "billing@acme.example.com",
    phoneNumber: "5551234567",
    shipmentPolicy: "ONE_DAY",
  },
}

describe("registerSchema", () => {
  it("accepts a fully filled-in self-serve registration", () => {
    expect(registerSchema.safeParse(validRegisterInput).success).toBe(true)
  })

  it.each([
    ["name", "", "First name is required"],
    ["surname", "", "Last name is required"],
    ["email", "", "Email is required"],
    ["email", "not-an-email", "Please enter a valid email address"],
    ["phoneNumber", "", "Phone number is required"],
    ["phoneNumber", "123", "Please enter a valid 10-digit phone number"],
    ["password", "", "Password is required"],
    ["password", "ab123", "Password must be at least 6 characters"],
    ["businessDescribe", "", "Business type is required"],
  ])("rejects %s = %j with %j", (field, value, expectedMessage) => {
    const result = registerSchema.safeParse({ ...validRegisterInput, [field]: value })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === expectedMessage)).toBe(true)
    }
  })

  it.each([
    ["postalCode", "", "Zip code is required"],
    ["placeId", "", "Address is required"],
  ])("rejects address.%s = %j with %j", (field, value, expectedMessage) => {
    const result = registerSchema.safeParse({
      ...validRegisterInput,
      address: { ...validRegisterInput.address, [field]: value },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === expectedMessage)).toBe(true)
    }
  })

  it("rejects a confirmPassword that does not match, on the confirmPassword path", () => {
    const result = registerSchema.safeParse({ ...validRegisterInput, confirmPassword: "different" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({ path: ["confirmPassword"], message: "Passwords do not match" })
    }
  })

  it("does not require password complexity (only the invite schemas do)", () => {
    expect(
      registerSchema.safeParse({ ...validRegisterInput, password: "abcdef", confirmPassword: "abcdef" }).success,
    ).toBe(true)
  })
})

describe("PASSWORD_COMPLEXITY_REGEX", () => {
  it.each([
    ["Secret1!", true],
    ["secret1!", false], // no uppercase
    ["SECRET1!", false], // no lowercase
    ["Secretxx!", false], // no digit
    ["Secret11", false], // no special character
  ])("%s -> %s", (password, expected) => {
    expect(PASSWORD_COMPLEXITY_REGEX.test(password)).toBe(expected)
  })
})

describe("ownerInviteSchema", () => {
  it("accepts a fully filled-in admin-invited owner signup", () => {
    expect(ownerInviteSchema.safeParse(validOwnerInviteInput).success).toBe(true)
  })

  it("rejects a password that does not meet the complexity rule (unlike registerSchema)", () => {
    const result = ownerInviteSchema.safeParse({
      ...validOwnerInviteInput,
      password: "abcdef1",
      confirmPassword: "abcdef1",
    })

    expect(result.success).toBe(false)
  })

  it.each([
    ["name", "Company name is required"],
    ["taxNumber", "Tax number is required"],
    ["shipmentPolicy", "Shipment policy is required"],
  ])("rejects an empty company.%s", (field, expectedMessage) => {
    const result = ownerInviteSchema.safeParse({
      ...validOwnerInviteInput,
      company: { ...validOwnerInviteInput.company, [field]: "" },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === expectedMessage)).toBe(true)
    }
  })

  it("rejects an invalid company email", () => {
    const result = ownerInviteSchema.safeParse({
      ...validOwnerInviteInput,
      company: { ...validOwnerInviteInput.company, email: "not-an-email" },
    })

    expect(result.success).toBe(false)
  })

  it("rejects a company phone number that is not 10 digits", () => {
    const result = ownerInviteSchema.safeParse({
      ...validOwnerInviteInput,
      company: { ...validOwnerInviteInput.company, phoneNumber: "123" },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === "Please enter a valid 10-digit phone number")).toBe(
        true,
      )
    }
  })
})

describe("teamMemberInviteSchema", () => {
  it("accepts personal fields alone, with no address or company", () => {
    expect(teamMemberInviteSchema.safeParse(validInviteInput).success).toBe(true)
  })

  it("still requires password complexity", () => {
    const result = teamMemberInviteSchema.safeParse({
      ...validInviteInput,
      password: "abcdef1",
      confirmPassword: "abcdef1",
    })

    expect(result.success).toBe(false)
  })

  it("ignores extraneous address/company fields rather than rejecting them", () => {
    const result = teamMemberInviteSchema.safeParse({
      ...validInviteInput,
      address: { postalCode: "", placeId: "" },
      company: { name: "" },
    })

    expect(result.success).toBe(true)
  })
})
