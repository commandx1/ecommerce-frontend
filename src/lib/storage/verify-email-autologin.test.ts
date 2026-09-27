import { beforeEach, describe, expect, it } from "vitest"
import {
  clearVerifyEmailAutologinCredentials,
  readVerifyEmailAutologinCredentials,
  storeVerifyEmailAutologinCredentials,
} from "./verify-email-autologin"

const KEY = "verify_email_autologin_credentials"

beforeEach(() => {
  sessionStorage.clear()
})

describe("storeVerifyEmailAutologinCredentials / readVerifyEmailAutologinCredentials", () => {
  it("round-trips email and password through sessionStorage", () => {
    storeVerifyEmailAutologinCredentials({ email: "buyer@example.com", password: "hunter2" })

    expect(readVerifyEmailAutologinCredentials()).toEqual({ email: "buyer@example.com", password: "hunter2" })
  })

  it("returns null when nothing was stored", () => {
    expect(readVerifyEmailAutologinCredentials()).toBeNull()
  })

  it("returns null for malformed JSON instead of throwing", () => {
    sessionStorage.setItem(KEY, "not-json")

    expect(readVerifyEmailAutologinCredentials()).toBeNull()
  })

  it("returns null when the stored payload is missing a field", () => {
    sessionStorage.setItem(KEY, JSON.stringify({ email: "buyer@example.com" }))

    expect(readVerifyEmailAutologinCredentials()).toBeNull()
  })
})

describe("clearVerifyEmailAutologinCredentials", () => {
  it("removes the stored credentials", () => {
    storeVerifyEmailAutologinCredentials({ email: "buyer@example.com", password: "hunter2" })

    clearVerifyEmailAutologinCredentials()

    expect(sessionStorage.getItem(KEY)).toBeNull()
    expect(readVerifyEmailAutologinCredentials()).toBeNull()
  })

  it("is a no-op when nothing was stored", () => {
    expect(() => clearVerifyEmailAutologinCredentials()).not.toThrow()
  })
})
