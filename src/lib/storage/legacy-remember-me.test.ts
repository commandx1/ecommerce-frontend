import { beforeEach, describe, expect, it } from "vitest"
import { clearLegacyRememberMeStorage } from "./legacy-remember-me"

beforeEach(() => {
  localStorage.clear()
})

describe("clearLegacyRememberMeStorage", () => {
  it("removes the legacy remembered_email and remembered_password keys", () => {
    localStorage.setItem("remembered_email", "buyer@example.com")
    localStorage.setItem("remembered_password", "hunter2")

    clearLegacyRememberMeStorage()

    expect(localStorage.getItem("remembered_email")).toBeNull()
    expect(localStorage.getItem("remembered_password")).toBeNull()
  })

  it("is a no-op when neither key was ever set", () => {
    expect(() => clearLegacyRememberMeStorage()).not.toThrow()
  })

  it("leaves unrelated localStorage keys alone", () => {
    localStorage.setItem("theme", "dark")
    localStorage.setItem("remembered_password", "hunter2")

    clearLegacyRememberMeStorage()

    expect(localStorage.getItem("theme")).toBe("dark")
  })
})
