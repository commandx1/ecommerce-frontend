import { describe, expect, it } from "vitest"
import type { z } from "zod"
import { capitalizeWords, mapZodErrors } from "./register-errors"
import { ownerInviteSchema, registerSchema } from "./register-schemas"

function issuesFor(input: unknown, schema: typeof registerSchema | typeof ownerInviteSchema): z.ZodIssue[] {
  const result = schema.safeParse(input)
  if (result.success) throw new Error("expected a validation failure")
  return result.error.issues
}

describe("capitalizeWords", () => {
  it.each([
    ["john", "John"],
    ["MARY", "Mary"],
    ["mary ann", "Mary Ann"],
    ["mArY-aNN", "Mary-ann"], // only whitespace-separated words are re-cased; hyphens are not word breaks
    ["", ""],
    ["  ", "  "],
    ["o'brien", "O'brien"],
  ])("%j -> %j", (input, expected) => {
    expect(capitalizeWords(input)).toBe(expected)
  })
})

describe("mapZodErrors", () => {
  const validRegisterInput = {
    name: "Jane",
    surname: "Doe",
    email: "jane@example.com",
    phoneNumber: "5551234567",
    password: "secret1",
    confirmPassword: "secret1",
    address: { postalCode: "90001", placeId: "place-1" },
    businessDescribe: "General dentistry",
  }

  it.each([
    ["name", "", "name"],
    ["surname", "", "surname"],
    ["email", "", "email"],
    ["phoneNumber", "", "phoneNumber"],
    ["password", "", "password"],
    ["businessDescribe", "", "businessDescribe"],
  ])("maps a top-level %s error onto the %s key unchanged", (field, value, expectedKey) => {
    const issues = issuesFor({ ...validRegisterInput, [field]: value }, registerSchema)

    const map = mapZodErrors(issues)
    expect(map).toHaveProperty(expectedKey)
  })

  it("flattens address.placeId to 'address'", () => {
    const issues = issuesFor(
      { ...validRegisterInput, address: { ...validRegisterInput.address, placeId: "" } },
      registerSchema,
    )

    expect(mapZodErrors(issues)).toEqual({ address: "Address is required" })
  })

  it("flattens address.postalCode to 'addressPostalCode'", () => {
    const issues = issuesFor(
      { ...validRegisterInput, address: { ...validRegisterInput.address, postalCode: "" } },
      registerSchema,
    )

    expect(mapZodErrors(issues)).toEqual({ addressPostalCode: "Zip code is required" })
  })

  const validOwnerInviteInput = {
    name: "Jane",
    surname: "Doe",
    phoneNumber: "5551234567",
    password: "Secret1!",
    confirmPassword: "Secret1!",
    address: { postalCode: "90001", placeId: "place-1" },
    company: {
      name: "Acme Dental",
      taxNumber: "TAX-1",
      email: "billing@acme.example.com",
      phoneNumber: "5551234567",
      shipmentPolicy: "ONE_DAY",
    },
  }

  it.each([
    ["name", "companyName"],
    ["email", "companyEmail"],
    ["phoneNumber", "companyPhoneNumber"],
    ["taxNumber", "taxNumber"],
    ["shipmentPolicy", "shipmentPolicy"],
  ])("flattens company.%s to '%s'", (field, expectedKey) => {
    const issues = issuesFor(
      { ...validOwnerInviteInput, company: { ...validOwnerInviteInput.company, [field]: "" } },
      ownerInviteSchema,
    )

    expect(mapZodErrors(issues)).toHaveProperty(expectedKey)
  })

  it("maps every issue, not just the first, when several fields fail at once", () => {
    const issues = issuesFor({ ...validRegisterInput, name: "", email: "" }, registerSchema)

    const map = mapZodErrors(issues)
    expect(map).toHaveProperty("name")
    expect(map).toHaveProperty("email")
  })

  it("returns an empty map for an empty issue list", () => {
    expect(mapZodErrors([])).toEqual({})
  })
})
