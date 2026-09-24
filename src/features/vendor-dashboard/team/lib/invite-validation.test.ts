import { describe, expect, it } from "vitest"
import { validateInviteEmail } from "./invite-validation"

describe("validateInviteEmail", () => {
  it.each([
    ["", "Email is required."],
    ["   ", "Email is required."],
    ["not-an-email", "Enter a valid email address."],
    ["missing-domain@", "Enter a valid email address."],
    ["@missing-local.com", "Enter a valid email address."],
    ["no-at-sign.com", "Enter a valid email address."],
    ["spaces in@address.com", "Enter a valid email address."],
    ["teammate@company.com", null],
    ["  teammate@company.com  ", null],
    ["first.last+tag@sub.company.co", null],
  ])("validateInviteEmail(%j) -> %j", (input, expected) => {
    expect(validateInviteEmail(input)).toBe(expected)
  })
})
